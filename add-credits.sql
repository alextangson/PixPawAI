-- 给当前用户添加 1000 credits
-- 在 Supabase SQL Editor 运行这个

UPDATE profiles 
SET credits = 1000 
WHERE email = 'alextangson@gmail.com';

-- 验证更新
SELECT id, email, credits, tier, total_generations 
FROM profiles 
WHERE email = 'alextangson@gmail.com';
