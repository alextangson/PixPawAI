-- ============================================
-- 查看最近的生成记录
-- ============================================

-- 查看最近 20 条生成记录
SELECT 
  id,
  created_at,
  user_id,
  style_id,
  status,
  input_image_url,
  result_url,
  prompt_strength,
  guidance_value,
  aspect_ratio
FROM generations
ORDER BY created_at DESC
LIMIT 20;

-- 按风格统计
SELECT 
  style_id,
  COUNT(*) as total_generations,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
  AVG(prompt_strength) as avg_strength,
  AVG(guidance_value) as avg_guidance
FROM generations
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY style_id
ORDER BY total_generations DESC;

-- 查看今天的测试记录
SELECT 
  id,
  created_at::time as time,
  style_id,
  status,
  prompt_strength,
  guidance_value,
  result_url
FROM generations
WHERE created_at::date = CURRENT_DATE
  AND user_id = auth.uid()  -- 只看你的记录
ORDER BY created_at DESC;
