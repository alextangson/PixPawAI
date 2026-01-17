-- ============================================
-- Add share rewards tracking to profiles table
-- Purpose: Prevent unlimited credit farming via share-to-earn
-- Created: 2026-01-17
-- ============================================

-- Add share_rewards_earned field to track total share rewards
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS share_rewards_earned INTEGER NOT NULL DEFAULT 0;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_share_rewards 
ON public.profiles(share_rewards_earned);

-- Add comment
COMMENT ON COLUMN public.profiles.share_rewards_earned IS 
'Total number of share rewards earned (global limit: 5 for MVP, future: tier-based)';

-- Future upgrade path (Phase 2):
-- When tier system is stable, change logic to:
-- free: 5, starter: 10, pro: 20
-- Use a separate config table to avoid hardcoding tier names
