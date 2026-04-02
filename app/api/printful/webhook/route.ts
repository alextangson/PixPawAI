/**
 * POST /api/printful/webhook
 *
 * Receives order status updates from Printful.
 * Configure in Printful dashboard: Settings → Webhooks → Add endpoint
 * URL: https://pixpawai.com/api/printful/webhook
 * Events: order_updated, order_failed, package_shipped
 *
 * Env vars:
 *   PRINTFUL_WEBHOOK_SECRET — optional HMAC-SHA256 secret for request verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { PRINTFUL_WEBHOOK_SECRET } from '@/lib/printful/config';
import crypto from 'crypto';

function verifySignature(body: string, signature: string | null): boolean {
  if (!PRINTFUL_WEBHOOK_SECRET) return true; // skip verification if not configured
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha256', PRINTFUL_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-printful-signature');

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { type: string; data: any };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const printfulOrderId = event.data?.order?.id ?? event.data?.id;

  if (!printfulOrderId) {
    return NextResponse.json({ ok: true, skipped: 'no order id' });
  }

  switch (event.type) {
    case 'order_updated':
    case 'order_failed': {
      const status = event.data?.order?.status ?? event.data?.status;
      await supabase
        .from('printful_orders')
        .update({ printful_status: status, printful_response: event.data })
        .eq('printful_order_id', printfulOrderId);
      break;
    }

    case 'package_shipped': {
      const tracking = event.data?.shipment;
      await supabase
        .from('printful_orders')
        .update({
          printful_status: 'fulfilled',
          printful_response: event.data,
        })
        .eq('printful_order_id', printfulOrderId);

      // TODO: send shipping confirmation email to user
      console.log('[Printful Webhook] Shipped:', {
        printfulOrderId,
        carrier: tracking?.carrier,
        trackingNumber: tracking?.tracking_number,
        trackingUrl: tracking?.tracking_url,
      });
      break;
    }

    default:
      console.log('[Printful Webhook] Unhandled event type:', event.type);
  }

  return NextResponse.json({ ok: true });
}
