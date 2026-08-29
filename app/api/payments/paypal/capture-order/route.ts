/**
 * PayPal Capture Order API
 * 
 * Purpose: Capture payment after user approves on PayPal
 * Method: POST
 * Body: { orderId: string }
 * 
 * Flow:
 * 1. Validate user authentication
 * 2. Capture the approved PayPal order
 * 3. Atomically complete the payment, grant credits, and update the tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PAYPAL_API_BASE, getPayPalAccessToken } from '@/lib/paypal/config';
import { checkRateLimitSmart } from '@/lib/rate-limit';
import { captureCreditOrder, fulfillCreditPayment, CreditPaymentError } from '@/lib/paypal/credit-payments';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (先验证，以便使用用户 ID 进行速率限制)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 🛡️ Rate Limiting: 智能速率限制（登录用户 20次/小时，匿名 10次/小时）
    const rateLimit = await checkRateLimitSmart(request, 'payment', user?.id)
    
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000)
      const limitType = rateLimit.authenticated ? 'authenticated user' : 'IP'
      console.warn(`[Rate Limit] Payment capture blocked for ${limitType}`)
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many payment requests. Please wait ${Math.ceil(retryAfter / 60)} minutes.`,
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

    // 2. Parse request
    const body = await request.json();
    const { orderId } = body;

    if (typeof orderId !== 'string' || !/^[A-Za-z0-9-]{1,64}$/.test(orderId)) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // 3. Verify order belongs to this user
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, user_id, provider_order_id, tier, amount_usd, credits_purchased, status')
      .eq('provider', 'paypal')
      .eq('provider_order_id', orderId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (paymentError) {
      return NextResponse.json({ error: 'Payment lookup unavailable. Please try again later.' }, { status: 503 });
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or unauthorized' },
        { status: 404 }
      );
    }

    if (payment.status === 'refunded' || payment.status === 'cancelled') {
      return NextResponse.json({ error: 'This payment cannot be processed.' }, { status: 409 });
    }

    const accessToken = await getPayPalAccessToken();
    const capture = await captureCreditOrder(payment, accessToken, PAYPAL_API_BASE);
    const result = await fulfillCreditPayment(createAdminClient(), payment, capture);
    return NextResponse.json(result);

  } catch (error: any) {
    if (error instanceof CreditPaymentError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('[PayPal Capture] Unexpected processing error');
    return NextResponse.json(
      { 
        error: 'Payment processing error. Please contact support if you were charged.',
      },
      { status: 500 }
    );
  }
}
