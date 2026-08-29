import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { checkRateLimitSmart } from '@/lib/rate-limit';
import { i18n } from '@/lib/i18n-config';
import { PRICING_TIERS, isValidTier } from '@/lib/payments/catalog';
import {
  CREEM_API_BASE,
  getCreemApiKey,
  getCreemProductId,
  getCreemSuccessUrl,
} from '@/lib/creem/config';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in to continue.' }, { status: 401 });
  }

  const rateLimit = await checkRateLimitSmart(request, 'payment', user.id);
  if (!rateLimit.success) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Too many payment attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const { tier, locale = i18n.defaultLocale } = body as Record<string, unknown>;
  if (!isValidTier(tier) || typeof locale !== 'string' || !i18n.locales.includes(locale as any)) {
    return NextResponse.json({ error: 'Invalid checkout selection.' }, { status: 400 });
  }

  let apiKey: string;
  let productId: string;
  let successUrl: string;
  try {
    apiKey = getCreemApiKey();
    productId = getCreemProductId(tier);
    successUrl = getCreemSuccessUrl(locale);
  } catch {
    return NextResponse.json({ error: 'Payment system is not configured.' }, { status: 503 });
  }

  const paymentId = randomUUID();
  const plan = PRICING_TIERS[tier];
  const admin = createAdminClient();
  const { error: insertError } = await admin.from('payments').insert({
    id: paymentId,
    user_id: user.id,
    provider: 'creem',
    provider_order_id: `checkout:${paymentId}`,
    tier,
    amount_usd: Number(plan.amount),
    credits_purchased: plan.credits,
    status: 'pending',
    metadata: {
      checkout_created_at: new Date().toISOString(),
      creem_product_id: productId,
    },
  });
  if (insertError) {
    console.error('[Creem Checkout] Persistence failed', { code: insertError.code });
    return NextResponse.json({ error: 'Checkout is temporarily unavailable.' }, { status: 503 });
  }

  let response: Response;
  try {
    response = await fetch(`${CREEM_API_BASE}/v1/checkouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({
        product_id: productId,
        request_id: paymentId,
        units: 1,
        success_url: successUrl,
        customer: { email: user.email },
        metadata: { payment_id: paymentId, tier, source: 'pricing' },
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    await admin.from('payments').update({ status: 'failed' }).eq('id', paymentId).eq('status', 'pending');
    return NextResponse.json({ error: 'Payment provider is temporarily unavailable.' }, { status: 503 });
  }

  let checkout: Record<string, unknown> = {};
  try {
    checkout = await response.json();
  } catch {
    // Handled by the provider-response validation below.
  }
  const checkoutId = checkout.id;
  const checkoutUrl = checkout.checkout_url;
  let parsedUrl: URL | null = null;
  try {
    parsedUrl = typeof checkoutUrl === 'string' ? new URL(checkoutUrl) : null;
  } catch {
    parsedUrl = null;
  }
  if (!response.ok || typeof checkoutId !== 'string' || !checkoutId
      || !parsedUrl || parsedUrl.protocol !== 'https:') {
    console.error('[Creem Checkout] Provider request failed', { status: response.status });
    await admin.from('payments').update({ status: 'failed' }).eq('id', paymentId).eq('status', 'pending');
    return NextResponse.json({ error: 'Unable to create checkout. Please try again.' }, { status: 502 });
  }

  const { error: updateError } = await admin.from('payments').update({
    provider_order_id: checkoutId,
    metadata: {
      checkout_created_at: new Date().toISOString(),
      creem_checkout_id: checkoutId,
      creem_product_id: productId,
    },
  }).eq('id', paymentId).eq('status', 'pending');
  if (updateError) {
    console.error('[Creem Checkout] Checkout persistence failed', { code: updateError.code });
    return NextResponse.json({ error: 'Checkout is temporarily unavailable.' }, { status: 503 });
  }

  return NextResponse.json({ checkoutUrl: parsedUrl.toString() });
}
