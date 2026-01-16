-- ============================================
-- 调试 Generations 表
-- 在 Supabase SQL Editor 中运行
-- ============================================

-- 1. 查看最近的 10 条生成记录及其状态
SELECT 
  id,
  status,
  created_at,
  output_url IS NOT NULL as has_output,
  input_url IS NOT NULL as has_input,
  is_public,
  is_rewarded,
  metadata->>'aspectRatio' as aspect_ratio,
  metadata->>'dimensions' as dimensions
FROM public.generations
ORDER BY created_at DESC
LIMIT 10;

-- 2. 统计各种状态的记录数量
SELECT 
  status, 
  COUNT(*) as count
FROM public.generations
GROUP BY status;

-- 3. 查找有 output_url 但 status 不是 'succeeded' 的记录（这些是有问题的）
SELECT 
  id,
  status,
  output_url,
  error_message,
  created_at
FROM public.generations
WHERE output_url IS NOT NULL 
AND status != 'succeeded'
ORDER BY created_at DESC
LIMIT 5;
