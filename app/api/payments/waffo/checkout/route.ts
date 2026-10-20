import { randomBytes, createHash, randomUUID } from 'node:crypto'
import { TaxCategory } from '@waffo/pancake-ts'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { checkRateLimitSmart } from '@/lib/rate-limit'
import { waffoClient, waffoEnvironment, waffoStoreId } from '@/lib/waffo/config'
import { isWaffoSku, UUID, WAFFO_CATALOG } from '@/lib/waffo/catalog'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const sku: unknown = body?.sku
    if (!isWaffoSku(sku)) {
      return NextResponse.json({ error: 'Invalid product' }, { status: 400 })
    }
    const plan = WAFFO_CATALOG[sku]
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (sku !== 'hd_unlock' && !user) {
      return NextResponse.json({ error: 'Please sign in to buy credits' }, { status: 401 })
    }
    const limit = await checkRateLimitSmart(request, 'payment', user?.id)
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many payment attempts' }, {
        status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000))) },
      })
    }
    const admin = createAdminClient()
    if (sku === 'hd_unlock') {
      if (typeof body.generationId !== 'string' || !UUID.test(body.generationId)) {
        return NextResponse.json({ error: 'Invalid portrait' }, { status: 400 })
      }
      const { data: generation, error } = await admin.from('generations')
        .select('id,status,user_id,is_public').eq('id', body.generationId).single()
      if (error || !generation || generation.status !== 'succeeded' ||
          (generation.user_id && generation.user_id !== user?.id && !generation.is_public)) {
        return NextResponse.json({ error: 'Portrait not available' }, { status: 404 })
      }
    }
    const productId = process.env[`WAFFO_PRODUCT_${sku.toUpperCase()}`]
    const origin = process.env.WAFFO_SITE_URL
    if (!productId || !origin) {
      return NextResponse.json({ error: 'Checkout is not configured yet' }, { status: 503 })
    }
    const client = waffoClient()
    const id = randomUUID()
    const token = randomBytes(32).toString('hex')
    const { error: insertError } = await admin.from('waffo_orders').insert({
      id, token_hash: createHash('sha256').update(token).digest('hex'),
      user_id: user?.id ?? null, generation_id: sku === 'hd_unlock' ? body.generationId : null,
      sku, amount_usd: plan.amount, credits: plan.credits,
      product_id: productId, store_id: waffoStoreId(), mode: waffoEnvironment(),
    })
    if (insertError) throw new Error('Order persistence failed')
    const session = await client.checkout.createSession({
      productId, currency: 'USD', buyerEmail: user?.email,
      priceSnapshot: { amount: plan.amount, taxCategory: TaxCategory.DigitalGoods },
      orderMerchantExternalId: id,
      metadata: { pixpawOrderId: id },
      successUrl: new URL('/api/payments/waffo/return', origin).toString(),
      expiresInSeconds: 3600,
    }, { idempotencyKey: `pixpaw-checkout-${id}` })
    const { error: updateError } = await admin.from('waffo_orders')
      .update({ session_id: session.sessionId }).eq('id', id)
    if (updateError) throw new Error('Session persistence failed')
    return NextResponse.json({ id, token, checkoutUrl: session.checkoutUrl, mode: waffoEnvironment() },
      { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    // SDK errors may include signed request details; do not expose or log them.
    return NextResponse.json({ error: 'Unable to start checkout. Please try again later.' }, { status: 503 })
  }
}
