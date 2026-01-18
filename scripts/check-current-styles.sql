-- 查看数据库中现有的风格
-- 在 Supabase SQL Editor 中运行

SELECT 
  id,
  name,
  emoji,
  is_enabled,
  sort_order,
  created_at
FROM styles
ORDER BY sort_order, created_at;

-- 查看总数
SELECT 
  COUNT(*) as total_styles,
  COUNT(*) FILTER (WHERE is_enabled = true) as enabled_styles,
  COUNT(*) FILTER (WHERE is_enabled = false) as disabled_styles
FROM styles;
