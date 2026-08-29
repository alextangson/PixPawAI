import type { SupabaseClient } from '@supabase/supabase-js';

export type CreditPayment = {
  id: string;
  user_id: string;
  provider_order_id: string;
  tier: string;
  amount_usd: number | string;
  credits_purchased: number;
  status: string;
};

export type PayPalCapture = {
  id?: string;
  status?: string;
  amount?: { value?: string; currency_code?: string };
};

type PayPalOrder = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    custom_id?: string;
    payments?: { captures?: PayPalCapture[] };
  }>;
};

export class CreditPaymentError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

function cents(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const amount = Math.round(Number(text) * 100);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

export function validateCreditCapture(payment: CreditPayment, capture: PayPalCapture) {
  if (capture.status !== 'COMPLETED') {
    throw new CreditPaymentError('CAPTURE_NOT_COMPLETED', 409,
      'Payment is not confirmed yet. Please wait or contact support; do not pay again.');
  }
  const expected = cents(payment.amount_usd);
  const received = cents(capture.amount?.value);
  if (typeof capture.id !== 'string' || !capture.id.trim()
      || capture.amount?.currency_code !== 'USD'
      || expected === null || received === null || received !== expected) {
    throw new CreditPaymentError('INVALID_CAPTURE', 400,
      'Payment verification failed. Please contact support; do not pay again.');
  }
}

/** Reuse the same PayPal request ID; recover a captured order after a lost response. */
export async function captureCreditOrder(
  payment: CreditPayment,
  accessToken: string,
  apiBase: string,
  fetcher: typeof fetch = fetch,
): Promise<PayPalCapture> {
  const url = `${apiBase}/v2/checkout/orders/${encodeURIComponent(payment.provider_order_id)}`;
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
  let order: PayPalOrder | undefined;
  try {
    const response = await fetcher(`${url}/capture`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation', 'PayPal-Request-Id': payment.id },
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok) order = await response.json();
  } catch {
    // A timeout does not prove that the buyer was not charged. Read the order below.
  }

  if (!order) {
    try {
      const response = await fetcher(url, {
        headers, cache: 'no-store', signal: AbortSignal.timeout(15000),
      });
      if (response.ok) order = await response.json();
    } catch {
      // Return a retryable, non-success response without marking the payment failed.
    }
  }
  if (!order) {
    throw new CreditPaymentError('CAPTURE_UNCONFIRMED', 503,
      'Payment confirmation is temporarily unavailable. Please contact support before paying again.');
  }
  if (order.id !== payment.provider_order_id || order.purchase_units?.length !== 1) {
    throw new CreditPaymentError('INVALID_ORDER', 400, 'Payment verification failed. Please contact support.');
  }
  const unit = order.purchase_units[0];
  if (unit.custom_id && unit.custom_id !== payment.user_id) {
    throw new CreditPaymentError('INVALID_ORDER', 400, 'Payment verification failed. Please contact support.');
  }
  const captures = unit.payments?.captures;
  if (order.status !== 'COMPLETED' || captures?.length !== 1) {
    throw new CreditPaymentError('CAPTURE_NOT_COMPLETED', 409,
      'Payment is not confirmed yet. Please wait or contact support; do not pay again.');
  }
  validateCreditCapture(payment, captures[0]);
  return captures[0];
}

/** Both browser capture and signed webhook must use this single transaction. */
export async function fulfillCreditPayment(
  admin: SupabaseClient,
  payment: CreditPayment,
  capture: PayPalCapture,
  eventId?: string,
) {
  validateCreditCapture(payment, capture);
  const { data, error } = await admin.rpc('fulfill_paypal_credit_payment', {
    p_order_id: payment.provider_order_id,
    p_capture_id: capture.id,
    p_amount: capture.amount!.value,
    p_currency: capture.amount!.currency_code,
    p_event_id: eventId ?? null,
  });
  if (error || data?.success !== true || typeof data.already_completed !== 'boolean') {
    // Codes only: provider payloads and database errors can contain buyer information.
    console.error('[PayPal Credits] Fulfillment failed', { code: error?.code ?? 'INVALID_RPC_RESULT' });
    throw new CreditPaymentError('CREDIT_FULFILLMENT_FAILED', error?.code === '55000' ? 409 : 503,
      'Payment received, but credits could not be confirmed. Please contact support; do not pay again.');
  }
  return {
    success: true,
    alreadyCompleted: data.already_completed,
    message: data.already_completed ? 'Payment already processed.' : 'Payment successful! Credits added to your account.',
    payment: {
      orderId: payment.provider_order_id,
      tier: payment.tier,
      credits: payment.credits_purchased,
      amount: payment.amount_usd,
    },
  };
}
