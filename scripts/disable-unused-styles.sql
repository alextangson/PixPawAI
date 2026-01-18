-- 只禁用不需要的风格，保留5个高质量风格
-- 在 Supabase SQL Editor 中运行

-- 禁用所有风格，除了我们要保留的5个
UPDATE styles 
SET is_enabled = false
WHERE id NOT IN (
  'Christmas-Vibe',
  'Smart-Casual',
  'Birthday-Party',
  'Music-Lover',
  'Retro-Pop-Art'
);

-- 确保5个高质量风格是启用的
UPDATE styles 
SET is_enabled = true
WHERE id IN (
  'Christmas-Vibe',
  'Smart-Casual',
  'Birthday-Party',
  'Music-Lover',
  'Retro-Pop-Art'
);

-- 验证结果：应该只有5个启用的风格
SELECT 
  id,
  name,
  is_enabled,
  sort_order
FROM styles
WHERE is_enabled = true
ORDER BY sort_order;

-- 显示统计
SELECT 
  COUNT(*) FILTER (WHERE is_enabled = true) as enabled_styles,
  COUNT(*) FILTER (WHERE is_enabled = false) as disabled_styles,
  COUNT(*) as total_styles
FROM styles;
