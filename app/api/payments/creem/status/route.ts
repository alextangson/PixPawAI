import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const requestId = request.nextUrl.searchParams.get('requestId');
  if (!requestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return NextResponse.json({ error: 'Invalid payment reference.' }, { status: 400 });
  }

  const { data: payment, error } = await supabase.from('payments')
    .select('id, tier, amount_usd, credits_purchased, status, provider_order_id, completed_at')
    .eq('id', requestId)
    .eq('user_id', user.id)
    .eq('provider', 'creem')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Payment status is unavailable.' }, { status: 503 });
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });

  return NextResponse.json({ payment }, { headers: { 'Cache-Control': 'no-store' } });
}
