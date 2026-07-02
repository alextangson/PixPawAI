-- ============================================
-- HD Unlocks - per-generation watermark-free download purchases
-- ============================================
-- Created: 2026-07-01
-- Purpose: Track $9.99 one-time HD unlock purchases (PayPal),
--          and create the private bucket for clean originals.
-- ============================================

CREATE TABLE IF NOT EXISTS public.hd_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,

  -- PayPal references
  paypal_order_id TEXT NOT NULL UNIQUE,
  paypal_capture_id TEXT,
  payer_email TEXT,

  -- Buyer, when logged in (guests buy with PayPal email only)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  amount_usd NUMERIC(6,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hd_unlocks_generation_id ON public.hd_unlocks(generation_id);
CREATE INDEX IF NOT EXISTS idx_hd_unlocks_user_id ON public.hd_unlocks(user_id);

-- Server-only table: RLS on, no policies — service role bypasses RLS,
-- anon/authenticated clients get nothing.
ALTER TABLE public.hd_unlocks ENABLE ROW LEVEL SECURITY;

-- Private bucket for clean (un-watermarked) originals.
-- No storage policies => only the service-role client can read/sign.
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-originals', 'generated-originals', false)
ON CONFLICT (id) DO NOTHING;
