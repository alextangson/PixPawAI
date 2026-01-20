-- ============================================
-- 调整风格展示
-- 1. 隐藏 Music Lover
-- 2. 调整顺序（打乱猫狗）
-- 3. 确保显示 8 个风格（2行x4列）
-- ============================================

-- 隐藏 Music Lover
UPDATE styles SET is_enabled = false WHERE id = 'Music-Lover';

-- 调整 sort_order（打乱猫狗顺序）
UPDATE styles SET sort_order = 1 WHERE id = 'Christmas-Vibe';      -- 圣诞哈士奇
UPDATE styles SET sort_order = 2 WHERE id = 'emerald-muse';        -- 翡翠缪斯猫
UPDATE styles SET sort_order = 3 WHERE id = 'Smart-Casual';        -- 智能休闲狗
UPDATE styles SET sort_order = 4 WHERE id = 'bordeaux-muse';       -- 酒红缪斯猫
UPDATE styles SET sort_order = 5 WHERE id = 'Birthday-Party';      -- 生日派对狗
UPDATE styles SET sort_order = 6 WHERE id = 'wes-anderson-pop';    -- 韦斯安德森猫
UPDATE styles SET sort_order = 7 WHERE id = 'Retro-Pop-Art';       -- 复古波普狗
UPDATE styles SET sort_order = 8 WHERE id = 'magazine-chic';       -- 时尚摄影猫

-- 验证结果（应该显示 8 个启用的风格）
SELECT 
  sort_order,
  id,
  name,
  is_enabled,
  preview_image_url
FROM styles
WHERE is_enabled = true
ORDER BY sort_order
LIMIT 8;

-- 显示被隐藏的风格
SELECT 
  '以下风格已隐藏:' as info,
  id,
  name
FROM styles
WHERE is_enabled = false;
