-- 创建 increment_credits 函数用于返还 credits
-- 在 Supabase SQL Editor 中运行

CREATE OR REPLACE FUNCTION public.increment_credits(
  user_uuid UUID,
  amount INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits = credits + amount
  WHERE id = user_uuid
  RETURNING credits INTO new_credits;
  
  IF new_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_credits IS 'Safely increments user credits (for refunds or purchases)';

-- 测试函数
-- SELECT increment_credits('your-user-id'::uuid, 1);
