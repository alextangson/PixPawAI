-- ============================================
-- 修复图片路径问题
-- ============================================

-- 1. 先检查当前的图片路径
SELECT 
  id,
  name,
  preview_image_url,
  is_enabled,
  CASE 
    WHEN preview_image_url IS NULL THEN '❌ NULL'
    WHEN preview_image_url = '' THEN '❌ Empty'
    ELSE '✅ Has URL'
  END as url_status
FROM styles
WHERE id IN ('bordeaux-muse', 'emerald-muse', 'wes-anderson-pop', 'magazine-chic')
ORDER BY sort_order;

-- 2. 强制更新图片路径（小写）
UPDATE styles SET preview_image_url = '/styles/bordeaux-muse.jpg' WHERE id = 'bordeaux-muse';
UPDATE styles SET preview_image_url = '/styles/emerald-muse.jpg' WHERE id = 'emerald-muse';
UPDATE styles SET preview_image_url = '/styles/wes-anderson-pop.jpg' WHERE id = 'wes-anderson-pop';
UPDATE styles SET preview_image_url = '/styles/magazine-chic.jpg' WHERE id = 'magazine-chic';

-- 3. 验证更新
SELECT 
  id,
  name,
  preview_image_url as updated_url,
  '✅ Updated' as status
FROM styles
WHERE id IN ('bordeaux-muse', 'emerald-muse', 'wes-anderson-pop', 'magazine-chic')
ORDER BY sort_order;
