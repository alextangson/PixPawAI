-- ============================================
-- Referral Reward Trigger - Auto-grant on First Generation
-- Migration Date: 2026-01-18
-- Purpose: Automatically award referral credits when new user completes first generation
-- ============================================

-- ============================================
-- FUNCTION: Process referral reward on first generation
-- ============================================
CREATE OR REPLACE FUNCTION public.process_referral_reward_on_first_generation()
RETURNS TRIGGER AS $$
DECLARE
  user_total_gens INTEGER;
  pending_claim RECORD;
  fraud_score INTEGER;
  recent_ip_claims INTEGER;
  email_used_before BOOLEAN;
  referrer_total_referrals INTEGER;
  should_grant BOOLEAN;
  rejection_reason TEXT;
BEGIN
  -- Only process if generation succeeded
  IF NEW.status != 'succeeded' THEN
    RETURN NEW;
  END IF;
  
  -- Check if this is the user's first successful generation
  SELECT COUNT(*) INTO user_total_gens
  FROM public.generations
  WHERE user_id = NEW.user_id AND status = 'succeeded';
  
  -- Only process on first generation
  IF user_total_gens != 1 THEN
    RETURN NEW;
  END IF;
  
  -- Look for pending referral claim for this user
  SELECT * INTO pending_claim
  FROM public.referral_claims
  WHERE new_user_id = NEW.user_id 
    AND reward_status = 'pending'
  LIMIT 1;
  
  -- No pending claim, exit early
  IF pending_claim IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- ============================================
  -- ANTI-FRAUD CHECKS
  -- ============================================
  fraud_score := 0;
  should_grant := true;
  rejection_reason := NULL;
  
  -- Check 1: Email already claimed rewards before?
  SELECT EXISTS(
    SELECT 1 FROM public.referral_claims
    WHERE new_user_email = pending_claim.new_user_email
      AND reward_status = 'granted'
      AND id != pending_claim.id
  ) INTO email_used_before;
  
  IF email_used_before THEN
    fraud_score := fraud_score + 100;
    rejection_reason := 'Email already used for referral reward';
    should_grant := false;
  END IF;
  
  -- Check 2: IP address - max 3 claims in 24 hours
  SELECT COUNT(*) INTO recent_ip_claims
  FROM public.referral_claims
  WHERE new_user_ip = pending_claim.new_user_ip
    AND reward_status = 'granted'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  IF recent_ip_claims >= 3 THEN
    fraud_score := fraud_score + 80;
    rejection_reason := 'IP address exceeded daily limit (3 claims/24h)';
    should_grant := false;
  ELSIF recent_ip_claims >= 2 THEN
    fraud_score := fraud_score + 40;
  END IF;
  
  -- Check 3: Referrer reached max limit (50 successful referrals)?
  IF pending_claim.referrer_id IS NOT NULL THEN
    SELECT successful_referrals INTO referrer_total_referrals
    FROM public.profiles
    WHERE id = pending_claim.referrer_id;
    
    IF referrer_total_referrals >= 50 THEN
      fraud_score := fraud_score + 50;
      rejection_reason := 'Referrer reached maximum limit (50 referrals)';
      should_grant := false;
    END IF;
  END IF;
  
  -- Check 4: Time window check - registration to first generation (too fast is suspicious)
  -- If completed in less than 10 seconds, add suspicion score
  IF EXTRACT(EPOCH FROM (NOW() - pending_claim.created_at)) < 10 THEN
    fraud_score := fraud_score + 30;
  END IF;
  
  -- ============================================
  -- GRANT OR REJECT REWARD
  -- ============================================
  
  IF should_grant AND fraud_score < 70 THEN
    -- GRANT REWARDS
    
    -- Award credits to new user
    UPDATE public.profiles
    SET credits = credits + pending_claim.new_user_reward
    WHERE id = pending_claim.new_user_id;
    
    -- Award credits to referrer (if applicable)
    IF pending_claim.referrer_id IS NOT NULL AND pending_claim.referrer_reward > 0 THEN
      UPDATE public.profiles
      SET credits = credits + pending_claim.referrer_reward,
          successful_referrals = successful_referrals + 1,
          referral_rewards_earned = referral_rewards_earned + pending_claim.referrer_reward
      WHERE id = pending_claim.referrer_id;
    END IF;
    
    -- Increment referral code usage counter
    UPDATE public.referral_codes
    SET current_uses = current_uses + 1
    WHERE id = pending_claim.referral_code_id;
    
    -- Update claim status to granted
    UPDATE public.referral_claims
    SET reward_status = 'granted',
        granted_at = NOW(),
        triggered_by_generation_id = NEW.id,
        triggered_at = NOW(),
        fraud_risk_score = fraud_score,
        fraud_checks = jsonb_build_object(
          'email_used_before', email_used_before,
          'recent_ip_claims', recent_ip_claims,
          'referrer_total_referrals', COALESCE(referrer_total_referrals, 0),
          'time_to_first_gen_seconds', EXTRACT(EPOCH FROM (NOW() - pending_claim.created_at))
        )
    WHERE id = pending_claim.id;
    
    RAISE NOTICE '✅ Referral reward granted: User % received % credits, Referrer % received % credits',
      pending_claim.new_user_id, pending_claim.new_user_reward,
      COALESCE(pending_claim.referrer_id::text, 'N/A'), pending_claim.referrer_reward;
    
  ELSE
    -- REJECT REWARD (fraud detected)
    
    UPDATE public.referral_claims
    SET reward_status = 'rejected',
        rejection_reason = rejection_reason,
        triggered_by_generation_id = NEW.id,
        triggered_at = NOW(),
        fraud_risk_score = fraud_score,
        fraud_checks = jsonb_build_object(
          'email_used_before', email_used_before,
          'recent_ip_claims', recent_ip_claims,
          'referrer_total_referrals', COALESCE(referrer_total_referrals, 0),
          'time_to_first_gen_seconds', EXTRACT(EPOCH FROM (NOW() - pending_claim.created_at))
        )
    WHERE id = pending_claim.id;
    
    RAISE NOTICE '⚠️  Referral reward rejected: User %, Score: %, Reason: %',
      pending_claim.new_user_id, fraud_score, rejection_reason;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.process_referral_reward_on_first_generation IS 
  'Auto-grants referral rewards when new user completes first generation (with fraud checks)';

-- ============================================
-- TRIGGER: Execute reward processing on generation success
-- ============================================
DROP TRIGGER IF EXISTS on_first_generation_referral_reward ON public.generations;

CREATE TRIGGER on_first_generation_referral_reward
  AFTER INSERT OR UPDATE ON public.generations
  FOR EACH ROW
  WHEN (NEW.status = 'succeeded')
  EXECUTE FUNCTION public.process_referral_reward_on_first_generation();

COMMENT ON TRIGGER on_first_generation_referral_reward ON public.generations IS
  'Triggers referral reward processing when user completes first generation';
