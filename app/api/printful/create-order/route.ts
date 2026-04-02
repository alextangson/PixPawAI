/**
 * POST /api/printful/create-order
 *
 * Flow:
 *  1. Validate request (auth, generation ownership, product/variant)
 *  2. Call Printful /orders/estimate to get real shipping + tax
 *  3. Create a PayPal order for the total amount
 *  4. Return PayPal order ID + cost breakdown to client
 *
 * After PayPal capture succeeds, the client calls /api/printful/confirm-order
 * which places the real Printful order.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { estimateOrder, type PrintfulRecipient } from '@/lib/printful/client';
import { PRINTFUL_PRODUCTS } from '@/lib/printful/config';
import { PAYPAL_API_BASE, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } from '@/lib/paypal/config';

async function getPayPalAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth failed: ${data.error_description}`);
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { generationId, productId, variantId, quantity = 1, shipping } = body as {
      generationId: string;
      productId: string;
      variantId: number;
      quantity?: number;
      shipping: PrintfulRecipient;
    };

    // Validate product + variant
    const product = PRINTFUL_PRODUCTS[productId];
    if (!product) {
      return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
    }
    const variant = product.variants.find(v => v.variantId === variantId);
    if (!variant) {
      return NextResponse.json({ error: 'Invalid variant' }, { status: 400 });
    }

    // Verify generation belongs to user and get image URL
    const { data: generation } = await supabase
      .from('generations')
      .select('id, output_url, user_id')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single();

    if (!generation?.output_url) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    // Estimate costs via Printful (no real order placed yet)
    const estimate = await estimateOrder({
      recipient: shipping,
      items: [{
        variant_id: variantId,
        quantity,
        files: [{ url: generation.output_url, placement: product.placementKey }],
      }],
    });

    const shippingCents = Math.round(parseFloat(estimate.retail_costs.shipping) * 100);
    const taxCents = Math.round(parseFloat(estimate.retail_costs.tax) * 100);
    const subtotalCents = variant.price * quantity;
    const totalCents = subtotalCents + shippingCents + taxCents;
    const totalUsd = (totalCents / 100).toFixed(2);

    // Create PayPal order
    const accessToken = await getPayPalAccessToken();
    const paypalRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: totalUsd,
            breakdown: {
              item_total: { currency_code: 'USD', value: (subtotalCents / 100).toFixed(2) },
              shipping: { currency_code: 'USD', value: (shippingCents / 100).toFixed(2) },
              tax_total: { currency_code: 'USD', value: (taxCents / 100).toFixed(2) },
            },
          },
          items: [{
            name: `${product.name} — ${variant.label}`,
            unit_amount: { currency_code: 'USD', value: (variant.price / 100).toFixed(2) },
            quantity: String(quantity),
            category: 'PHYSICAL_GOODS',
          }],
          description: `PixPaw AI — ${product.name} (${variant.label})`,
        }],
        application_context: {
          shipping_preference: 'NO_SHIPPING', // we collect shipping ourselves
        },
      }),
    });

    const paypalOrder = await paypalRes.json();
    if (!paypalRes.ok) {
      console.error('[Printful] PayPal order creation failed:', paypalOrder);
      return NextResponse.json({ error: 'Payment setup failed' }, { status: 502 });
    }

    // Persist a draft order row so we can confirm after payment
    await supabase.from('printful_orders').insert({
      user_id: user.id,
      generation_id: generationId,
      product_id: productId,
      variant_id: variantId,
      variant_label: variant.label,
      quantity,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      tax_cents: taxCents,
      total_cents: totalCents,
      paypal_order_id: paypalOrder.id,
      payment_status: 'pending',
      shipping_address: shipping,
      printful_response: estimate,
    });

    return NextResponse.json({
      paypalOrderId: paypalOrder.id,
      costs: {
        subtotal: (subtotalCents / 100).toFixed(2),
        shipping: (shippingCents / 100).toFixed(2),
        tax: (taxCents / 100).toFixed(2),
        total: totalUsd,
      },
    });
  } catch (error: any) {
    console.error('[Printful] create-order error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
