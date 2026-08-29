import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyCreemWebhookSignature } from '@/lib/creem/config';
import {
  CreemPaymentError,
  fulfillCreemCreditPayment,
  parseCreemCheckoutCompleted,
} from '@/lib/creem/credit-payments';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
    if (!verifyCreemWebhookSignature(rawBody, request.headers.get('creem-signature'))) {
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Webhook verification unavailable.' }, { status: 503 });
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 });
  }

  const admin = createAdminClient();
  try {
    if (event.eventType === 'checkout.completed') {
      const completed = parseCreemCheckoutCompleted(event);
      const { data: payment, error } = await admin
        .from('payments')
        .select('id, user_id, tier, amount_usd, credits_purchased, status')
        .eq('id', completed.requestId)
        .eq('provider', 'creem')
        .maybeSingle();
      if (error || !payment) {
        return NextResponse.json({ error: 'Payment is not available yet.' }, { status: 503 });
      }
      await fulfillCreemCreditPayment(admin, payment, completed);
      return NextResponse.json({ received: true });
    }

    if (event.eventType === 'refund.created') {
      const orderId = event.object?.order?.id ?? event.object?.transaction?.order;
      if (typeof orderId !== 'string' || !orderId) {
        return NextResponse.json({ error: 'Invalid refund payload.' }, { status: 400 });
      }
      const { data: payment, error: lookupError } = await admin.from('payments')
        .select('id').eq('provider', 'creem').eq('provider_order_id', orderId).maybeSingle();
      if (lookupError || !payment) {
        return NextResponse.json({ error: 'Payment is not available.' }, { status: 503 });
      }
      const { error } = await admin.from('payments').update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        refund_reason: typeof event.object?.reason === 'string' ? event.object.reason : null,
      }).eq('id', payment.id);
      if (error) return NextResponse.json({ error: 'Refund update failed.' }, { status: 503 });
      return NextResponse.json({ received: true });
    }

    if (event.eventType === 'dispute.created') {
      const orderId = event.object?.order?.id ?? event.object?.transaction?.order;
      if (typeof orderId !== 'string' || !orderId) {
        return NextResponse.json({ error: 'Invalid dispute payload.' }, { status: 400 });
      }
      const { data: payment, error: lookupError } = await admin.from('payments')
        .select('id, metadata').eq('provider', 'creem').eq('provider_order_id', orderId).maybeSingle();
      if (lookupError || !payment) {
        return NextResponse.json({ error: 'Payment is not available.' }, { status: 503 });
      }
      const { error } = await admin.from('payments').update({
        metadata: {
          ...(payment.metadata ?? {}),
          dispute: { status: 'opened', event_id: event.id, opened_at: new Date().toISOString() },
        },
      }).eq('id', payment.id);
      if (error) return NextResponse.json({ error: 'Dispute update failed.' }, { status: 503 });
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true, ignored: true });
  } catch (error) {
    if (error instanceof CreemPaymentError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('[Creem Webhook] Unexpected processing error');
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 503 });
  }
}
