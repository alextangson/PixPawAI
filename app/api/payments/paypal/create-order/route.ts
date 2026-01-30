/**
 * PayPal Create Order API
 * 
 * Purpose: Initialize PayPal checkout and create order
 * Method: POST
 * Body: { tier: 'starter' | 'pro' | 'master' }
 * 
 * Flow:
 * 1. Validate user authentication
 * 2. Validate tier and get pricing
 * 3. Create PayPal order
 * 4. Store pending payment in database
 * 5. Return order ID to frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  PAYPAL_API_BASE,
  PRICING_TIERS,
  isValidTier,
  getPayPalAccessToken,
} from '@/lib/paypal/config';
import { checkRateLimitSmart } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (先验证，以便使用用户 ID 进行速率限制)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to continue.' },
        { status: 401 }
      );
    }
    
    // 🛡️ Rate Limiting: 智能速率限制（登录用户 20次/小时，匿名 10次/小时）
    const rateLimit = await checkRateLimitSmart(request, 'payment', user?.id)
    
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000)
      const limitType = rateLimit.authenticated ? 'authenticated user' : 'IP'
      console.warn(`[Rate Limit] Payment creation blocked for ${limitType}`)
      
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
      )
    }

    // 2. Parse and validate request
    const body = await request.json();
    const { tier } = body;

    if (!tier || !isValidTier(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be one of: starter, pro, master' },
        { status: 400 }
      );
    }

    const plan = PRICING_TIERS[tier];

    // 3. Get user profile (for metadata)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // 4. Create PayPal order
    const accessToken = await getPayPalAccessToken();
    
    // Simplified order payload for PayPal SDK Buttons
    // Don't include return_url/cancel_url - SDK handles callbacks automatically
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `PIXPAW-${tier.toUpperCase()}`,
          description: `${plan.name} - ${plan.credits} Generation Credits`,
          custom_id: user.id, // Pass user ID for webhook processing
          amount: {
            currency_code: 'USD',
            value: plan.amount,
          },
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
      console.error('[PayPal Create Order] Error:', errorData);
      return NextResponse.json(
        { 
          error: 'Failed to create PayPal order. Please try again.',
          details: errorData.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    const orderData = await paypalResponse.json();

    console.log(`✅ [PayPal] Order created: ${orderData.id} for user ${user.email} (${tier})`);

    // 5. Return order details to frontend immediately (don't wait for DB)
    const response = NextResponse.json({
      success: true,
      orderId: orderData.id,
      tier,
      amount: plan.amount,
      credits: plan.credits,
    });

    // 6. Store pending payment in database asynchronously (don't block response)
    supabase
      .from('payments')
      .insert({
        user_id: user.id,
        provider: 'paypal',
        provider_order_id: orderData.id,
        tier,
        amount_usd: parseFloat(plan.amount),
        credits_purchased: plan.credits,
        status: 'pending',
        metadata: {
          order_created_at: new Date().toISOString(),
          user_email: profile?.email,
          user_name: profile?.full_name,
          paypal_order_status: orderData.status,
        },
      })
      .then(({ error: dbError }) => {
        if (dbError) {
          console.error('[PayPal Create Order] Database error:', dbError);
        }
      });

    return response;

  } catch (error: any) {
    console.error('[PayPal Create Order] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Payment system error. Please contact support.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
