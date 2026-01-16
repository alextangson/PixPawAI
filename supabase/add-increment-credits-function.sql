-- ============================================
-- Add increment_credits Function
-- Migration Date: 2026-01-16
-- Purpose: Fix missing database function for credit refunds and rewards
-- ============================================

-- This function is called by:
-- 1. app/api/generate/route.ts:577 (credit refund on generation failure)
-- 2. app/api/share/route.ts:149 (share reward +1 credit)

CREATE OR REPLACE FUNCTION public.increment_credits(user_uuid UUID, amount INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  -- Atomically increment credits and return new value
  UPDATE public.profiles
  SET credits = credits + amount
  WHERE id = user_uuid
  RETURNING credits INTO new_credits;
  
  -- Raise exception if user not found
  IF new_credits IS NULL THEN
    RAISE EXCEPTION 'User not found: %', user_uuid;
  END IF;
  
  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add documentation
COMMENT ON FUNCTION public.increment_credits IS 'Safely increments user credits (atomic operation) - for refunds and share rewards';

-- Test the function (optional - uncomment to test)
/*
DO $$
DECLARE
  test_user_id UUID;
  initial_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- Get a test user (first user in profiles table)
  SELECT id, credits INTO test_user_id, initial_credits
  FROM public.profiles
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test increment by 1
    SELECT public.increment_credits(test_user_id, 1) INTO new_credits;
    
    -- Verify
    IF new_credits = initial_credits + 1 THEN
      RAISE NOTICE '✅ increment_credits function works correctly';
      RAISE NOTICE '   Initial credits: %, New credits: %', initial_credits, new_credits;
      
      -- Rollback the test increment
      UPDATE public.profiles SET credits = initial_credits WHERE id = test_user_id;
    ELSE
      RAISE EXCEPTION '❌ increment_credits test failed';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  No users found to test with';
  END IF;
END $$;
*/

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete: increment_credits function added';
  RAISE NOTICE '📋 Function signature: increment_credits(user_uuid UUID, amount INTEGER DEFAULT 1)';
  RAISE NOTICE '🔒 Security: SECURITY DEFINER (runs with elevated privileges)';
END $$;
