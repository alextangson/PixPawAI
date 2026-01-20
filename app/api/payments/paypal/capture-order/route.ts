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
 * 3. Update payment status in database
 * 4. Add credits to user account
 * 5. Update user tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PAYPAL_API_BASE, getPayPalAccessToken } from '@/lib/paypal/config';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // 3. Verify order belongs to this user
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('provider_order_id', orderId)
      .eq('user_id', user.id)
      .single();

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Prevent duplicate capture
    if (payment.status === 'completed') {
      console.log(`⚠️ [PayPal Capture] Already completed: ${orderId}`);
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        alreadyCompleted: true,
      });
    }

    // 4. Capture the order via PayPal API
    const accessToken = await getPayPalAccessToken();

    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation',
        },
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error('[PayPal Capture] Error:', errorData);
      
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({ 
          status: 'failed',
          metadata: {
            ...payment.metadata,
            capture_error: errorData,
            failed_at: new Date().toISOString(),
          },
        })
        .eq('id', payment.id);

      return NextResponse.json(
        { 
          error: 'Payment capture failed. No charges were made.',
          details: errorData.message || 'Unknown error',
        },
        { status: 400 }
      );
    }

    const captureData = await captureResponse.json();
    const captureId = captureData.purchase_units[0]?.payments?.captures[0]?.id;
    const payerInfo = captureData.payer;

    // 5. Use admin client to update database and credits
    const adminClient = createAdminClient();

    // Update payment record
    const { error: updateError } = await adminClient
      .from('payments')
      .update({
        status: 'completed',
        provider_payment_id: captureId,
        provider_payer_id: payerInfo?.payer_id || payerInfo?.email_address,
        completed_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          capture_data: {
            capture_id: captureId,
            payer_email: payerInfo?.email_address,
            payer_name: payerInfo?.name,
            captured_at: new Date().toISOString(),
          },
        },
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('[PayPal Capture] Failed to update payment:', updateError);
      // Don't return error - payment succeeded, we'll reconcile later
    }

    // 6. Add credits to user account
    const { error: creditsError } = await adminClient.rpc('increment_credits', {
      user_id: user.id,
      amount: payment.credits_purchased,
    });

    if (creditsError) {
      console.error('[PayPal Capture] Failed to add credits:', creditsError);
      // Critical error - payment succeeded but credits not added
      // Log for manual reconciliation
      console.error(`🚨 CRITICAL: Payment ${payment.id} succeeded but credits not added for user ${user.id}`);
    }

    // 7. Update user tier
    const { error: tierError } = await adminClient
      .from('profiles')
      .update({ tier: payment.tier })
      .eq('id', user.id);

    if (tierError) {
      console.error('[PayPal Capture] Failed to update tier:', tierError);
    }

    console.log(`✅ [PayPal] Payment captured: ${captureId} - User ${user.email} received ${payment.credits_purchased} credits (${payment.tier})`);

    // 8. Return success response
    return NextResponse.json({
      success: true,
      message: `Payment successful! ${payment.credits_purchased} credits added to your account.`,
      payment: {
        tier: payment.tier,
        credits: payment.credits_purchased,
        amount: payment.amount_usd,
      },
    });

  } catch (error: any) {
    console.error('[PayPal Capture] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Payment processing error. Please contact support if you were charged.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
