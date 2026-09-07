/**
 * PayPal Webhook Handler
 * 
 * Purpose: Receive and process PayPal event notifications
 * Method: POST
 * Security: Verifies PayPal webhook signature
 * 
 * Handled Events:
 * - CHECKOUT.ORDER.APPROVED (Order approved by buyer)
 * - PAYMENT.CAPTURE.COMPLETED (Payment captured successfully)
 * - PAYMENT.CAPTURE.DENIED (Payment failed)
 * - PAYMENT.CAPTURE.REFUNDED (Payment refunded)
 * 
 * Flow:
 * 1. Verify webhook signature (security critical!)
 * 2. Parse event type and data
 * 3. Process based on event type
 * 4. Update database accordingly
 * 5. Return 200 OK to acknowledge receipt
 * 
 * IMPORTANT: This endpoint uses Service Role Key to bypass RLS
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPayPalWebhookSignature } from '@/lib/paypal/config';
import { fulfillCreditPayment, CreditPaymentError } from '@/lib/paypal/credit-payments';

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 1. Get webhook headers for signature verification
    const transmissionId = request.headers.get('paypal-transmission-id');
    const transmissionTime = request.headers.get('paypal-transmission-time');
    const transmissionSig = request.headers.get('paypal-transmission-sig');
    const certUrl = request.headers.get('paypal-cert-url');
    const authAlgo = request.headers.get('paypal-auth-algo');

    if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
      console.error('[PayPal Webhook] Missing required headers');
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
    }

    // 2. Parse webhook event
    const rawBody = await request.text();
    const event = JSON.parse(rawBody);

    console.log('[PayPal Webhook] Event received');

    // 3. Verify webhook signature (CRITICAL for security)
    const isValid = await verifyPayPalWebhookSignature(event, {
      transmissionId,
      transmissionTime,
      transmissionSig,
      certUrl,
      authAlgo,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // 4. Use admin client (bypasses RLS)
    const adminClient = createAdminClient();

    // 5. Process based on event type
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED': {
        // Approval is not fulfillment. In particular, never overwrite reconciliation metadata.
        break;
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        const resource = event.resource;
        const orderId = resource?.supplementary_data?.related_ids?.order_id;
        if (typeof orderId !== 'string' || !orderId) {
          return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
        }

        const { data: payment, error: paymentError } = await adminClient
          .from('payments')
          .select('id, user_id, provider_order_id, tier, amount_usd, credits_purchased, status')
          .eq('provider', 'paypal')
          .eq('provider_order_id', orderId)
          .maybeSingle();
        if (paymentError) {
          return NextResponse.json({ error: 'Payment lookup unavailable' }, { status: 503 });
        }
        if (!payment) {
          // The same PayPal app also sells HD downloads and physical products.
          // Acknowledge only a positively identified non-credit order, not an unknown one.
          const otherOrders = await Promise.all([
            adminClient.from('hd_unlocks').select('id').eq('paypal_order_id', orderId).maybeSingle(),
            adminClient.from('printful_orders').select('id').eq('paypal_order_id', orderId).maybeSingle(),
          ]);
          if (otherOrders.some(result => !result.error && result.data)) {
            return NextResponse.json({ received: true, message: 'Not a credit purchase' });
          }
          return NextResponse.json({ error: 'Payment not available yet' }, { status: 503 });
        }

        await fulfillCreditPayment(adminClient, payment, resource, event.id);
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        // Payment failed
        const orderId = event.resource.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          const { error } = await adminClient
            .from('payments')
            .update({ status: 'failed' })
            .eq('provider', 'paypal')
            .eq('provider_order_id', orderId)
            .eq('status', 'pending');
          if (error) return NextResponse.json({ error: 'Payment update unavailable' }, { status: 503 });
        }

        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        // Payment refunded
        const captureId = event.resource.id;
        const refundAmount = event.resource.amount?.value;

        console.log('[PayPal Webhook] Refund notification received');

        const { data: payment } = await adminClient
          .from('payments')
          .select('*')
          .eq('provider_payment_id', captureId)
          .single();

        if (payment) {
          // Update payment status
          await adminClient
            .from('payments')
            .update({
              status: 'refunded',
              refunded_at: new Date().toISOString(),
              metadata: {
                ...payment.metadata,
                refund_event_id: event.id,
                refund_amount: refundAmount,
              },
            })
            .eq('id', payment.id);

          // Deduct credits (if user still has them)
          const { data: profile } = await adminClient
            .from('profiles')
            .select('credits')
            .eq('id', payment.user_id)
            .single();

          if (profile && profile.credits >= payment.credits_purchased) {
            await adminClient.rpc('increment_credits', {
              user_id: payment.user_id,
              amount: -payment.credits_purchased,
            });
            console.log('[PayPal Webhook] Refund credit adjustment requested');
          } else {
            console.warn(
              '[PayPal Webhook] Insufficient credits for refund adjustment'
            );
          }
        }

        break;
      }

      default:
        console.log('[PayPal Webhook] Event type not handled');
    }

    // Acknowledge only successfully handled or intentionally ignored events.
    return NextResponse.json({ received: true });

  } catch (error: unknown) {
    if (error instanceof CreditPaymentError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid webhook JSON' }, { status: 400 });
    }
    console.error('[PayPal Webhook] Processing unavailable');
    // Non-2xx keeps delivery retryable. Never acknowledge a failed credit grant.
    return NextResponse.json({ error: 'Webhook processing unavailable' }, { status: 503 });
  }
}
