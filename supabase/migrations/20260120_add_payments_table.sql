-- ============================================
-- PayPal Payment Integration - Database Schema
-- ============================================
-- Created: 2026-01-20
-- Purpose: Track all payment transactions
-- ============================================

-- ---------------------------------------------
-- Table: payments
-- Purpose: Store payment transaction records
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment provider info
  provider TEXT NOT NULL CHECK (provider IN ('paypal', 'stripe')) DEFAULT 'paypal',
  provider_order_id TEXT NOT NULL, -- PayPal Order ID or Stripe Payment Intent ID
  provider_payment_id TEXT, -- PayPal Capture ID after successful payment
  provider_payer_id TEXT, -- PayPal Payer ID or Stripe Customer ID
  
  -- Order details
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'pro', 'master')),
  amount_usd DECIMAL(10,2) NOT NULL,
  credits_purchased INTEGER NOT NULL,
  
  -- Payment status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')
  ),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Metadata (store webhook payload for debugging)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Refund info
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT
);

-- Indexes for fast lookups
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_provider_order_id ON public.payments(provider, provider_order_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);

-- Composite index for webhook deduplication
CREATE UNIQUE INDEX idx_payments_provider_payment_unique 
  ON public.payments(provider, provider_payment_id) 
  WHERE provider_payment_id IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE public.payments IS 'Payment transaction records for credit purchases';
COMMENT ON COLUMN public.payments.provider_order_id IS 'PayPal Order ID (starts with "O-") or Stripe Payment Intent ID';
COMMENT ON COLUMN public.payments.provider_payment_id IS 'PayPal Capture ID after payment completion';
COMMENT ON COLUMN public.payments.status IS 'Payment status: pending -> completed/failed';
COMMENT ON COLUMN public.payments.metadata IS 'JSON field for storing webhook payloads and debug info';

-- ---------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment history
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only authenticated users can create payment records (via API)
CREATE POLICY "Authenticated users can create payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only service role can update payment status (webhook only)
-- No policy needed - will use service role key in webhook

-- ---------------------------------------------
-- Function: Get user payment history
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION get_payment_history(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  tier TEXT,
  amount_usd DECIMAL,
  credits_purchased INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.tier,
    p.amount_usd,
    p.credits_purchased,
    p.status,
    p.created_at,
    p.completed_at
  FROM public.payments p
  WHERE p.user_id = user_uuid
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION get_payment_history IS 'Retrieve payment history for a user with configurable limit';

-- ---------------------------------------------
-- Function: Get payment statistics
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION get_payment_stats(user_uuid UUID)
RETURNS TABLE (
  total_spent DECIMAL,
  total_credits_purchased INTEGER,
  total_transactions INTEGER,
  last_payment_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(p.amount_usd), 0)::DECIMAL AS total_spent,
    COALESCE(SUM(p.credits_purchased), 0)::INTEGER AS total_credits_purchased,
    COUNT(*)::INTEGER AS total_transactions,
    MAX(p.completed_at) AS last_payment_date
  FROM public.payments p
  WHERE p.user_id = user_uuid
    AND p.status = 'completed';
END;
$$;

COMMENT ON FUNCTION get_payment_stats IS 'Get aggregated payment statistics for a user';

-- ============================================
-- End of Migration
-- ============================================
