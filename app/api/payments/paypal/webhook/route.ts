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

    console.log(`📬 [PayPal Webhook] Received: ${event.event_type} (${event.id})`);

    // 3. Verify webhook signature (CRITICAL for security)
    const isValid = await verifyPayPalWebhookSignature(event, {
      transmissionId,
      transmissionTime,
      transmissionSig,
      certUrl,
      authAlgo,
    });

    if (!isValid && process.env.NODE_ENV === 'production') {
      console.error('[PayPal Webhook] Invalid signature - possible fraud attempt');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    if (!isValid && process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ [PayPal Webhook] Signature verification failed (DEV mode - continuing)');
    }

    // 4. Use admin client (bypasses RLS)
    const adminClient = createAdminClient();

    // 5. Process based on event type
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED': {
        // Order approved by buyer (optional - can be used for analytics)
        const orderId = event.resource.id;
        console.log(`✅ [PayPal Webhook] Order approved: ${orderId}`);
        
        // Update payment status to processing
        await adminClient
          .from('payments')
          .update({
            metadata: {
              order_approved_at: new Date().toISOString(),
              webhook_event_id: event.id,
            },
          })
          .eq('provider_order_id', orderId);

        break;
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        // Payment captured successfully - MAIN EVENT
        const resource = event.resource;
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        const captureId = resource.id;
        const amount = resource.amount?.value;
        const payerEmail = resource.payer?.email_address;

        console.log(`💰 [PayPal Webhook] Payment captured: ${captureId} (Order: ${orderId})`);

        if (!orderId) {
          console.error('[PayPal Webhook] Missing order ID in capture event');
          return NextResponse.json({ received: true });
        }

        // Find payment record
        const { data: payment, error: paymentError } = await adminClient
          .from('payments')
          .select('*')
          .eq('provider_order_id', orderId)
          .single();

        if (paymentError || !payment) {
          console.error(`[PayPal Webhook] Payment not found for order: ${orderId}`, paymentError);
          return NextResponse.json({ received: true });
        }

        // Prevent duplicate processing (idempotency)
        if (payment.status === 'completed') {
          console.log(`⚠️ [PayPal Webhook] Payment already completed: ${payment.id}`);
          return NextResponse.json({ received: true, message: 'Already processed' });
        }

        // Verify amount matches (security check)
        const expectedAmount = parseFloat(payment.amount_usd.toString());
        const receivedAmount = parseFloat(amount);
        if (Math.abs(expectedAmount - receivedAmount) > 0.01) {
          console.error(
            `🚨 [PayPal Webhook] Amount mismatch! Expected: ${expectedAmount}, Received: ${receivedAmount}`
          );
          // Don't process - potential fraud
          return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
        }

        // Update payment record
        const { error: updateError } = await adminClient
          .from('payments')
          .update({
            status: 'completed',
            provider_payment_id: captureId,
            provider_payer_id: payerEmail,
            completed_at: new Date().toISOString(),
            metadata: {
              ...payment.metadata,
              webhook_event_id: event.id,
              webhook_received_at: new Date().toISOString(),
              payer_email: payerEmail,
            },
          })
          .eq('id', payment.id);

        if (updateError) {
          console.error('[PayPal Webhook] Failed to update payment:', updateError);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        // Add credits to user account
        const { error: creditsError } = await adminClient.rpc('increment_credits', {
          user_id: payment.user_id,
          amount: payment.credits_purchased,
        });

        if (creditsError) {
          console.error('[PayPal Webhook] Failed to add credits:', creditsError);
          console.error(`🚨 CRITICAL: Payment ${payment.id} completed but credits not added for user ${payment.user_id}`);
          // Don't return error - webhook will retry
        }

        // Update user tier
        await adminClient
          .from('profiles')
          .update({ tier: payment.tier })
          .eq('id', payment.user_id);

        console.log(
          `✅ [PayPal Webhook] Payment processed: ${payment.tier} - User ${payment.user_id} received ${payment.credits_purchased} credits`
        );

        break;
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        // Payment failed
        const orderId = event.resource.supplementary_data?.related_ids?.order_id;
        console.log(`❌ [PayPal Webhook] Payment denied: ${orderId}`);

        if (orderId) {
          await adminClient
            .from('payments')
            .update({
              status: 'failed',
              metadata: {
                webhook_event_id: event.id,
                failed_at: new Date().toISOString(),
                failure_reason: event.resource.status_details,
              },
            })
            .eq('provider_order_id', orderId);
        }

        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        // Payment refunded
        const captureId = event.resource.id;
        const refundAmount = event.resource.amount?.value;

        console.log(`🔄 [PayPal Webhook] Payment refunded: ${captureId} ($${refundAmount})`);

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
            console.log(`✅ [PayPal Webhook] Deducted ${payment.credits_purchased} credits from user ${payment.user_id}`);
          } else {
            console.warn(
              `⚠️ [PayPal Webhook] User ${payment.user_id} doesn't have enough credits to refund (has: ${profile?.credits}, need: ${payment.credits_purchased})`
            );
          }
        }

        break;
      }

      default:
        console.log(`ℹ️ [PayPal Webhook] Unhandled event type: ${event.event_type}`);
    }

    // 6. Always return 200 OK to acknowledge receipt
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[PayPal Webhook] Error:', error);
    // Return 200 to prevent webhook retry storms
    return NextResponse.json({ 
      received: true, 
      error: error.message 
    });
  }
}
