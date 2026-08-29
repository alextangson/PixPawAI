-- ============================================
-- Migration: "Digital + physical" bundle — HD add-on flag on Printful orders
-- Date: 2026-07-04
-- Purpose: Let a physical-print buyer add the clean HD digital download of the
--          same portrait at checkout (+$4, a $9.99 value). This column records
--          whether the order included the HD add-on so confirm-order can grant
--          the hd_unlocks entitlement after payment is captured.
-- ============================================

ALTER TABLE public.printful_orders
  ADD COLUMN IF NOT EXISTS include_hd BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.printful_orders.include_hd IS
  'True when the buyer added the HD digital download bundle; triggers an hd_unlocks grant on confirm.';
