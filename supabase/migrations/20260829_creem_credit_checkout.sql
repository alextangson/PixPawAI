-- Creem one-time checkout for digital credit packs.
-- Apply after 20260828_atomic_paypal_credit_fulfillment.sql.
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_provider_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_provider_check
  CHECK (provider IN ('paypal', 'stripe', 'creem'));

COMMENT ON COLUMN public.payments.provider IS
  'Payment provider. Historical PayPal rows remain valid; new digital credit checkouts use Creem.';

CREATE OR REPLACE FUNCTION public.fulfill_creem_credit_payment(
  p_payment_id UUID,
  p_checkout_id TEXT,
  p_order_id TEXT,
  p_transaction_id TEXT,
  p_product_id TEXT,
  p_amount_cents INTEGER,
  p_currency TEXT,
  p_event_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_new_credits INTEGER;
BEGIN
  SELECT * INTO v_payment FROM public.payments
    WHERE id = p_payment_id AND provider = 'creem'
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF p_checkout_id IS NULL OR btrim(p_checkout_id) = ''
     OR p_order_id IS NULL OR btrim(p_order_id) = ''
     OR p_transaction_id IS NULL OR btrim(p_transaction_id) = ''
     OR p_product_id IS NULL OR btrim(p_product_id) = ''
     OR p_currency IS DISTINCT FROM 'USD'
     OR p_amount_cents IS NULL OR p_amount_cents <= 0
     OR p_amount_cents IS DISTINCT FROM (v_payment.amount_usd * 100)::INTEGER
     OR v_payment.credits_purchased <= 0
     OR (v_payment.metadata ->> 'creem_checkout_id') IS DISTINCT FROM p_checkout_id
     OR (v_payment.metadata ->> 'creem_product_id') IS DISTINCT FROM p_product_id THEN
    RAISE EXCEPTION 'invalid_creem_payment' USING ERRCODE = '22023';
  END IF;

  IF v_payment.provider_payment_id IS NOT NULL
     AND v_payment.provider_payment_id <> p_transaction_id THEN
    RAISE EXCEPTION 'transaction_mismatch' USING ERRCODE = '22023';
  END IF;
  IF v_payment.status IN ('refunded', 'cancelled') THEN
    RAISE EXCEPTION 'payment_not_fulfillable' USING ERRCODE = '55000';
  END IF;

  IF v_payment.metadata ? 'manual_credit_reconciliation'
     AND (v_payment.metadata #>> '{manual_credit_reconciliation,status}')
       IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'manual_reconciliation_requires_review' USING ERRCODE = '55000';
  END IF;

  IF v_payment.credits_granted_at IS NOT NULL
     OR (v_payment.metadata #>> '{manual_credit_reconciliation,status}') = 'completed' THEN
    IF v_payment.provider_order_id <> p_order_id THEN
      RAISE EXCEPTION 'order_mismatch' USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('success', true, 'already_completed', true, 'added', 0);
  END IF;

  IF v_payment.status = 'completed' THEN
    RAISE EXCEPTION 'legacy_payment_requires_review' USING ERRCODE = '55000';
  END IF;

  UPDATE public.profiles
    SET credits = credits + v_payment.credits_purchased,
        tier = v_payment.tier,
        updated_at = NOW()
    WHERE id = v_payment.user_id
    RETURNING credits INTO v_new_credits;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.payments
    SET status = 'completed',
        provider_order_id = p_order_id,
        provider_payment_id = p_transaction_id,
        completed_at = NOW(),
        credits_granted_at = NOW(),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'creem_checkout_id', p_checkout_id,
          'creem_product_id', p_product_id,
          'credit_fulfillment_version', 1,
          'webhook_event_id', p_event_id
        )
    WHERE id = v_payment.id;

  RETURN jsonb_build_object(
    'success', true,
    'already_completed', false,
    'added', v_payment.credits_purchased,
    'new_credits', v_new_credits
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_creem_credit_payment(
  UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_creem_credit_payment(
  UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT
) TO service_role;

COMMIT;
