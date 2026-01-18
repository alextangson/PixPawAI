-- ============================================
-- Add Referral Fields to Profiles Table
-- Migration Date: 2026-01-18
-- Purpose: Track user referral relationships and statistics
-- ============================================

-- Add referral-related columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS successful_referrals INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_rewards_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_created_at TIMESTAMPTZ;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_code ON public.profiles(referred_by_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_user_id ON public.profiles(referred_by_user_id);

-- Add comments
COMMENT ON COLUMN public.profiles.referral_code IS 'User''s unique referral code (generated when user creates referral link)';
COMMENT ON COLUMN public.profiles.referred_by_code IS 'The referral code used during signup (if any)';
COMMENT ON COLUMN public.profiles.referred_by_user_id IS 'The user who referred this user (NULL for beta invites)';
COMMENT ON COLUMN public.profiles.successful_referrals IS 'Number of successful referrals (users who completed first generation)';
COMMENT ON COLUMN public.profiles.referral_rewards_earned IS 'Total credits earned from referring others';
COMMENT ON COLUMN public.profiles.referral_created_at IS 'When the user first generated their referral link';
