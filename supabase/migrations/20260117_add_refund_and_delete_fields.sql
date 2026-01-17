-- ============================================
-- Add is_refunded field to generations table
-- Purpose: Track credit refunds for "not quite" feedback
-- Created: 2026-01-17
-- Updated: 2026-01-17 - Removed soft delete (user feedback: don't auto-delete)
-- ============================================

-- Add is_refunded field to track if user has been refunded for this generation
ALTER TABLE public.generations
ADD COLUMN IF NOT EXISTS is_refunded BOOLEAN NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.generations.is_refunded IS 'Whether user has been refunded credit for this generation (first "not quite" only)';
