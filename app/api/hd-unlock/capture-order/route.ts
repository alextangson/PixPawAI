/**
 * HD Unlock - Capture PayPal Order
 *
 * Method: POST
 * Body: { orderId: string }
 * On success marks the unlock completed and returns the gated download path.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PAYPAL_API_BASE, getPayPalAccessToken } from '@/lib/paypal/config';
import { checkRateLimitSmart } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const rateLimit = await checkRateLimitSmart(request, 'payment', user?.id);
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      const limitType = rateLimit.authenticated ? 'authenticated user' : 'IP';
      console.warn(`[Rate Limit] HD unlock capture blocked for ${limitType}`);

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
      );
    }

    const body = await request.json();
    const { orderId } = body;
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: unlock } = await admin
      .from('hd_unlocks')
      .select('*')
      .eq('paypal_order_id', orderId)
      .single();

    if (!unlock) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const downloadPath = `/api/generations/${unlock.generation_id}/hd?orderId=${orderId}`;

    if (unlock.status === 'completed') {
      return NextResponse.json({ success: true, alreadyCompleted: true, downloadPath });
    }

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
      const alreadyCaptured = errorData?.details?.some(
        (d: any) => d.issue === 'ORDER_ALREADY_CAPTURED'
      );
      if (alreadyCaptured) {
        // Concurrent capture won the race — the row is (or is about to be) completed.
        console.warn(`[HD Unlock Capture] ${orderId} already captured (concurrent request)`);
        return NextResponse.json({ success: true, alreadyCompleted: true, downloadPath });
      }
      console.error('[HD Unlock Capture] PayPal error:', errorData);
      await admin
        .from('hd_unlocks')
        .update({ status: 'failed' })
        .eq('id', unlock.id);
      return NextResponse.json(
        { error: 'Payment capture failed. No charges were made.' },
        { status: 400 }
      );
    }

    const captureData = await captureResponse.json();
    const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const payerEmail = captureData.payer?.email_address;

    const { error: updateError } = await admin
      .from('hd_unlocks')
      .update({
        status: 'completed',
        paypal_capture_id: captureId,
        payer_email: payerEmail,
        user_id: unlock.user_id ?? user?.id ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', unlock.id)
      .neq('status', 'completed');

    if (updateError) {
      // Payment succeeded but our record didn't update — log loudly for manual reconciliation
      console.error(`🚨 CRITICAL: HD unlock ${unlock.id} captured (${captureId}) but status update failed:`, updateError);
    }

    console.log(`💰 [HD Unlock] Captured ${captureId} for generation ${unlock.generation_id} (${payerEmail})`);
    return NextResponse.json({ success: true, downloadPath });
  } catch (error: any) {
    console.error('[HD Unlock Capture] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Payment processing error. Please contact support if you were charged.' },
      { status: 500 }
    );
  }
}
