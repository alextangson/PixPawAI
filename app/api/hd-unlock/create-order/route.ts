/**
 * HD Unlock - Create PayPal Order
 *
 * Method: POST
 * Body: { generationId: string }
 * Guest-friendly: no auth required; the unlock binds to the generation,
 * buyer identity comes from PayPal at capture time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PAYPAL_API_BASE, HD_UNLOCK, getPayPalAccessToken } from '@/lib/paypal/config';
import { checkRateLimitSmart } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const rateLimit = await checkRateLimitSmart(request, 'payment', user?.id);
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      const limitType = rateLimit.authenticated ? 'authenticated user' : 'IP';
      console.warn(`[Rate Limit] HD unlock order creation blocked for ${limitType}`);

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many payment attempts. Please wait ${Math.ceil(retryAfter / 60)} minutes.`,
          retryAfter,
          limit: rateLimit.limit,
          authenticated: rateLimit.authenticated,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { generationId } = body;
    if (!generationId || typeof generationId !== 'string') {
      return NextResponse.json({ error: 'generationId is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: generation } = await admin
      .from('generations')
      .select('id, status')
      .eq('id', generationId)
      .single();

    if (!generation || generation.status !== 'succeeded') {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    const { data: existing } = await admin
      .from('hd_unlocks')
      .select('id')
      .eq('generation_id', generationId)
      .eq('status', 'completed')
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'This portrait is already unlocked', alreadyUnlocked: true },
        { status: 409 }
      );
    }

    // Cap order-creation attempts per generation: one unlock is all a
    // generation needs, so >5 attempts/hour is abuse, not enthusiasm.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentAttempts } = await admin
      .from('hd_unlocks')
      .select('id', { count: 'exact', head: true })
      .eq('generation_id', generationId)
      .gte('created_at', oneHourAgo);

    if ((recentAttempts ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'Too many unlock attempts for this portrait. Please try again later.' },
        { status: 429 }
      );
    }

    const accessToken = await getPayPalAccessToken();
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: 'PIXPAW-HD-UNLOCK',
          description: HD_UNLOCK.description,
          custom_id: generationId,
          amount: { currency_code: 'USD', value: HD_UNLOCK.amount },
        },
      ],
      application_context: {
        brand_name: 'PixPaw AI',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    };

    const paypalResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!paypalResponse.ok) {
      const errorData = await paypalResponse.json();
      console.error('[HD Unlock Create Order] PayPal error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create PayPal order. Please try again.' },
        { status: 500 }
      );
    }

    const orderData = await paypalResponse.json();

    const { error: insertError } = await admin.from('hd_unlocks').insert({
      generation_id: generationId,
      paypal_order_id: orderData.id,
      user_id: user?.id ?? null,
      amount_usd: parseFloat(HD_UNLOCK.amount),
      status: 'pending',
    });

    if (insertError) {
      console.error('[HD Unlock Create Order] DB insert failed:', insertError);
      return NextResponse.json(
        { error: 'Payment system error. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`✅ [HD Unlock] Order created: ${orderData.id} for generation ${generationId}`);
    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      amount: HD_UNLOCK.amount,
    });
  } catch (error: any) {
    console.error('[HD Unlock Create Order] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Payment system error. Please contact support.' },
      { status: 500 }
    );
  }
}
