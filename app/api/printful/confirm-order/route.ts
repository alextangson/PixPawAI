/**
 * POST /api/printful/confirm-order
 *
 * Called by the client after PayPal payment is captured.
 * 1. Verifies PayPal capture
 * 2. Places the real Printful order
 * 3. Updates printful_orders row with Printful order ID + status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOrder } from '@/lib/printful/client';
import { PRINTFUL_PRODUCTS } from '@/lib/printful/config';
import { PAYPAL_API_BASE, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } from '@/lib/paypal/config';

async function capturePayPalOrder(paypalOrderId: string) {
  const authRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const { access_token } = await authRes.json();

  const captureRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
  });
  const capture = await captureRes.json();
  if (!captureRes.ok) throw new Error(`PayPal capture failed: ${capture.message}`);
  return capture;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { paypalOrderId } = await req.json() as { paypalOrderId: string };
    if (!paypalOrderId) return NextResponse.json({ error: 'Missing paypalOrderId' }, { status: 400 });

    // Load draft order
    const { data: order } = await supabase
      .from('printful_orders')
      .select('*')
      .eq('paypal_order_id', paypalOrderId)
      .eq('user_id', user.id)
      .eq('payment_status', 'pending')
      .single();

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Capture PayPal payment
    const capture = await capturePayPalOrder(paypalOrderId);
    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    // Get generation image URL
    const { data: generation } = await supabase
      .from('generations')
      .select('output_url')
      .eq('id', order.generation_id)
      .single();

    if (!generation?.output_url) {
      return NextResponse.json({ error: 'Generation image not found' }, { status: 404 });
    }

    const product = PRINTFUL_PRODUCTS[order.product_id];

    // Place real Printful order
    const printfulOrder = await createOrder({
      recipient: order.shipping_address,
      items: [{
        variant_id: order.variant_id,
        quantity: order.quantity,
        files: [{ url: generation.output_url, placement: product.placementKey }],
      }],
      retail_costs: {
        currency: 'USD',
        subtotal: (order.subtotal_cents / 100).toFixed(2),
        shipping: (order.shipping_cents / 100).toFixed(2),
        tax: (order.tax_cents / 100).toFixed(2),
        total: (order.total_cents / 100).toFixed(2),
      },
    });

    // Update order row
    await supabase
      .from('printful_orders')
      .update({
        printful_order_id: printfulOrder.id,
        printful_status: printfulOrder.status,
        paypal_capture_id: captureId,
        payment_status: 'paid',
        printful_response: printfulOrder,
      })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      printfulOrderId: printfulOrder.id,
      status: printfulOrder.status,
    });
  } catch (error: any) {
    console.error('[Printful] confirm-order error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
