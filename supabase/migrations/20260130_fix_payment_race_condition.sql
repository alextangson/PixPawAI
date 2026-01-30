-- Fix Payment Race Condition
-- Purpose: Prevent duplicate credit additions and ensure atomic payment processing

-- Drop old function
DROP FUNCTION IF EXISTS increment_credits(UUID, INTEGER);

-- Create improved function with race condition protection
CREATE OR REPLACE FUNCTION increment_credits_safe(
  p_user_id UUID,
  p_amount INTEGER,
  p_payment_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_new_credits INTEGER;
BEGIN
  -- If payment_id is provided, check if already processed
  IF p_payment_id IS NOT NULL THEN
    -- Check payment status
    IF EXISTS (
      SELECT 1 FROM payments 
      WHERE id = p_payment_id 
      AND status = 'completed'
    ) THEN
      -- Payment already processed, return error
      RETURN jsonb_build_object(
        'success', false,
        'error', 'payment_already_processed',
        'message', 'This payment has already been processed'
      );
    END IF;
    
    -- Lock the payment row to prevent concurrent processing
    PERFORM * FROM payments 
    WHERE id = p_payment_id 
    FOR UPDATE;
  END IF;

  -- Update credits atomically
  UPDATE profiles
  SET credits = credits + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO v_new_credits;

  -- Check if user was found
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', 'User profile not found'
    );
  END IF;

  -- Return success with new credit balance
  RETURN jsonb_build_object(
    'success', true,
    'new_credits', v_new_credits,
    'added', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create backward-compatible wrapper function
CREATE OR REPLACE FUNCTION increment_credits(
  user_id UUID,
  amount INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_result JSONB;
BEGIN
  v_result := increment_credits_safe(user_id, amount, NULL);
  
  IF (v_result->>'success')::boolean = false THEN
    RAISE EXCEPTION '%', v_result->>'message';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint to prevent duplicate payment processing
-- (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_provider_payment_id_unique'
  ) THEN
    ALTER TABLE payments 
    ADD CONSTRAINT payments_provider_payment_id_unique 
    UNIQUE (provider_payment_id);
  END IF;
END $$;

-- Add index for faster payment status checks
CREATE INDEX IF NOT EXISTS idx_payments_status_user 
ON payments(user_id, status, created_at DESC);

-- Add comment
COMMENT ON FUNCTION increment_credits_safe IS 'Safely increment user credits with race condition protection. Returns JSONB with success status.';
COMMENT ON FUNCTION increment_credits IS 'Legacy wrapper for increment_credits_safe. Throws exception on error.';
