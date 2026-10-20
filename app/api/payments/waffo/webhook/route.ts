import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook, type WebhookEventData } from '@waffo/pancake-ts'
import { waffoEnvironment, waffoStoreId } from '@/lib/waffo/config'
import { createAdminClient } from '@/lib/supabase/server'
import { UUID, paidSubtotal } from '@/lib/waffo/catalog'

export const runtime = 'nodejs'
export async function POST(request: NextRequest) {
  const raw = await request.text()
  let event
  try {
    event = verifyWebhook<WebhookEventData>(raw, request.headers.get('x-waffo-signature'), {
      environment: waffoEnvironment(),
    })
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  if (event.mode !== waffoEnvironment() || event.storeId !== waffoStoreId()) {
    return NextResponse.json({ error: 'Wrong store or environment' }, { status: 400 })
  }
  if (event.eventType !== 'order.completed') return NextResponse.json({ received: true })
  const id = event.data.orderMerchantExternalId ?? event.data.orderMetadata?.pixpawOrderId
  const amount = paidSubtotal(event.data)
  if (!id || !UUID.test(id) || amount === null || event.data.currency !== 'USD' ||
      typeof event.data.orderId !== 'string' || !event.data.orderId.startsWith('ORD_')) {
    return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 })
  }
  try {
    // Commit fulfillment and deduplication together before acknowledging. A failed
    // transaction returns 503 so Waffo retries; no unawaited serverless work is lost.
    const { error } = await createAdminClient().rpc('fulfill_waffo_order', {
      p_id: id, p_event_id: event.id, p_provider_order_id: event.data.orderId,
      p_amount: amount, p_store_id: event.storeId, p_mode: event.mode,
    })
    if (error) throw new Error('Fulfillment failed')
    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Fulfillment temporarily unavailable' }, { status: 503 })
  }
}
