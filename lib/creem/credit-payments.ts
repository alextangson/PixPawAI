import type { SupabaseClient } from '@supabase/supabase-js';
import { PRICING_TIERS, type PricingTier } from '@/lib/payments/catalog';
import { getCreemProductId } from '@/lib/creem/config';

export type CreemCreditPayment = {
  id: string;
  user_id: string;
  tier: PricingTier;
  amount_usd: number | string;
  credits_purchased: number;
  status: string;
};

export type CreemCheckoutCompleted = {
  eventId: string;
  checkoutId: string;
  requestId: string;
  orderId: string;
  transactionId: string;
  productId: string;
  amountCents: number;
  currency: string;
};

export class CreemPaymentError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

export function parseCreemCheckoutCompleted(event: unknown): CreemCheckoutCompleted {
  if (!event || typeof event !== 'object') {
    throw new CreemPaymentError('INVALID_EVENT', 400, 'Invalid webhook event.');
  }
  const body = event as Record<string, any>;
  const checkout = body.object;
  const order = checkout?.order;
  const product = checkout?.product;
  const transactionId = order?.transaction ?? order?.id;

  if (body.eventType !== 'checkout.completed'
      || typeof body.id !== 'string' || !body.id
      || typeof checkout?.id !== 'string' || !checkout.id
      || checkout.status !== 'completed'
      || typeof checkout.request_id !== 'string' || !checkout.request_id
      || typeof order?.id !== 'string' || !order.id
      || order.status !== 'paid'
      || typeof transactionId !== 'string' || !transactionId
      || typeof product?.id !== 'string' || !product.id
      || order.product !== product.id
      || !Number.isSafeInteger(order.amount) || order.amount <= 0
      || typeof order.currency !== 'string') {
    throw new CreemPaymentError('INVALID_EVENT', 400, 'Invalid checkout completion payload.');
  }

  return {
    eventId: body.id,
    checkoutId: checkout.id,
    requestId: checkout.request_id,
    orderId: order.id,
    transactionId,
    productId: product.id,
    amountCents: order.amount,
    currency: order.currency,
  };
}

export function validateCreemCreditPayment(
  payment: CreemCreditPayment,
  completed: CreemCheckoutCompleted,
) {
  const plan = PRICING_TIERS[payment.tier];
  const expectedCents = Math.round(Number(payment.amount_usd) * 100);
  if (completed.requestId !== payment.id
      || completed.productId !== getCreemProductId(payment.tier)
      || completed.currency !== 'USD'
      || completed.amountCents !== expectedCents
      || payment.credits_purchased !== plan.credits
      || expectedCents !== Math.round(Number(plan.amount) * 100)) {
    throw new CreemPaymentError(
      'PAYMENT_MISMATCH',
      400,
      'Payment verification failed. Please contact support; do not pay again.',
    );
  }
}

export async function fulfillCreemCreditPayment(
  admin: SupabaseClient,
  payment: CreemCreditPayment,
  completed: CreemCheckoutCompleted,
) {
  validateCreemCreditPayment(payment, completed);
  const { data, error } = await admin.rpc('fulfill_creem_credit_payment', {
    p_payment_id: payment.id,
    p_checkout_id: completed.checkoutId,
    p_order_id: completed.orderId,
    p_transaction_id: completed.transactionId,
    p_product_id: completed.productId,
    p_amount_cents: completed.amountCents,
    p_currency: completed.currency,
    p_event_id: completed.eventId,
  });
  if (error || data?.success !== true || typeof data.already_completed !== 'boolean') {
    console.error('[Creem Credits] Fulfillment failed', { code: error?.code ?? 'INVALID_RPC_RESULT' });
    throw new CreemPaymentError(
      'CREDIT_FULFILLMENT_FAILED',
      error?.code === '55000' ? 409 : 503,
      'Payment received, but credits could not be confirmed. Please contact support; do not pay again.',
    );
  }
  return data;
}
