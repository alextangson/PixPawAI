-- ============================================
-- Printful Merch Orders - Database Schema
-- ============================================
-- Created: 2026-04-02
-- Purpose: Track physical merchandise orders via Printful
-- ============================================

CREATE TABLE IF NOT EXISTS public.printful_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User & generation reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE RESTRICT,

  -- Printful order info
  printful_order_id BIGINT UNIQUE,          -- Printful's numeric order ID
  printful_status TEXT DEFAULT 'draft',     -- draft | pending | inprocess | fulfilled | cancelled

  -- Product details
  product_id TEXT NOT NULL,                 -- our internal product key (e.g. 'pillow')
  variant_id INTEGER NOT NULL,              -- Printful variant_id
  variant_label TEXT NOT NULL,              -- e.g. '16×16"'
  quantity INTEGER NOT NULL DEFAULT 1,

  -- Pricing (USD cents)
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER,
  tax_cents INTEGER,
  total_cents INTEGER,

  -- Payment reference (PayPal capture)
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),

  -- Shipping address (stored for reference)
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Raw Printful response for debugging
  printful_response JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_printful_orders_user_id ON public.printful_orders(user_id);
CREATE INDEX idx_printful_orders_generation_id ON public.printful_orders(generation_id);
CREATE INDEX idx_printful_orders_printful_id ON public.printful_orders(printful_order_id);
CREATE INDEX idx_printful_orders_payment_status ON public.printful_orders(payment_status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_printful_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_printful_orders_updated_at
  BEFORE UPDATE ON public.printful_orders
  FOR EACH ROW EXECUTE FUNCTION update_printful_orders_updated_at();

-- RLS
ALTER TABLE public.printful_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own merch orders"
  ON public.printful_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own merch orders"
  ON public.printful_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);
