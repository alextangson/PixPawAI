import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { UUID } from '@/lib/waffo/catalog'
import { checkRateLimitSmart } from '@/lib/rate-limit'
import { waffoEnvironment, waffoStoreId } from '@/lib/waffo/config'

export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') ?? ''
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  if (!UUID.test(id) || !/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({ error: 'Invalid order credentials' }, { status: 400 })
  }
  try {
    const limit = await checkRateLimitSmart(request, 'api')
    if (!limit.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    const { data, error } = await createAdminClient().from('waffo_orders')
      .select('id,status,sku,generation_id,mode')
      .eq('mode', waffoEnvironment()).eq('store_id', waffoStoreId())
      .eq('id', id).eq('token_hash', createHash('sha256').update(token).digest('hex')).single()
    if (error || !data) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Unable to check payment' }, { status: 503 })
  }
}
