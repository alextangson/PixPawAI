-- Apply before deploying the matching checkout/webhook code.
-- Never backfill old completed payments: some were already credited manually.
BEGIN;

-- Abort safely instead of holding up generation/profile requests on a busy database.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS credits_granted_at TIMESTAMPTZ;
COMMENT ON COLUMN public.payments.credits_granted_at IS
  'Written in the same transaction as purchased credits. NULL on legacy payments is not proof of missing credits.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_order_unique
  ON public.payments(provider, provider_order_id);

-- Purchases include master; the original profiles schema only allowed free/starter/pro.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tier_check
  CHECK (tier IN ('free', 'starter', 'pro', 'master'));

-- The RPC trusts the stored price and quantity, so only the server may create them.
DROP POLICY IF EXISTS "Authenticated users can create payments" ON public.payments;
REVOKE INSERT ON public.payments FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.fulfill_paypal_credit_payment(
  p_order_id TEXT,
  p_capture_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_event_id TEXT DEFAULT NULL
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
  -- Lock BEFORE checking completion. Capture and webhook can arrive concurrently.
  SELECT * INTO v_payment FROM public.payments
    WHERE provider = 'paypal' AND provider_order_id = p_order_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF p_capture_id IS NULL OR btrim(p_capture_id) = ''
     OR p_currency IS DISTINCT FROM 'USD'
     OR p_amount IS NULL OR p_amount <= 0
     OR p_amount IS DISTINCT FROM v_payment.amount_usd
     OR v_payment.credits_purchased <= 0 THEN
    RAISE EXCEPTION 'invalid_capture' USING ERRCODE = '22023';
  END IF;
  IF v_payment.provider_payment_id IS NOT NULL
     AND v_payment.provider_payment_id <> p_capture_id THEN
    RAISE EXCEPTION 'capture_mismatch' USING ERRCODE = '22023';
  END IF;
  IF v_payment.status IN ('refunded', 'cancelled') THEN
    RAISE EXCEPTION 'payment_not_fulfillable' USING ERRCODE = '55000';
  END IF;

  -- A reserved/ambiguous manual repair must be reviewed, never automatically retried.
  IF v_payment.metadata ? 'manual_credit_reconciliation'
     AND (v_payment.metadata #>> '{manual_credit_reconciliation,status}')
       IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'manual_reconciliation_requires_review' USING ERRCODE = '55000';
  END IF;

  IF v_payment.credits_granted_at IS NOT NULL
     OR (v_payment.metadata #>> '{manual_credit_reconciliation,status}') = 'completed' THEN
    RETURN jsonb_build_object('success', true, 'already_completed', true, 'added', 0);
  END IF;

  -- Legacy completed status was set BEFORE adding credits. Its balance is ambiguous.
  -- Do not silently report success, or risk duplicating a previously issued grant.
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
        provider_payment_id = p_capture_id,
        completed_at = NOW(),
        credits_granted_at = NOW(),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_strip_nulls(
          jsonb_build_object('credit_fulfillment_version', 1, 'webhook_event_id', p_event_id))
    WHERE id = v_payment.id;

  RETURN jsonb_build_object('success', true, 'already_completed', false,
    'added', v_payment.credits_purchased, 'new_credits', v_new_credits);
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_paypal_credit_payment(TEXT, TEXT, NUMERIC, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_paypal_credit_payment(TEXT, TEXT, NUMERIC, TEXT, TEXT)
  TO service_role;

COMMIT;
