-- Function to safely increment user credits
-- Drop existing function if it exists (in case of return type change)
DROP FUNCTION IF EXISTS increment_credits(UUID, INTEGER);

CREATE FUNCTION increment_credits(
  user_id UUID,
  amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET credits = credits + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
