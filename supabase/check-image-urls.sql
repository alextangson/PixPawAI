-- 检查新风格的图片 URL 配置
SELECT 
  id,
  name,
  preview_image_url,
  is_enabled
FROM styles
WHERE id IN ('bordeaux-muse', 'emerald-muse', 'wes-anderson-pop', 'magazine-chic')
ORDER BY id;

-- 如果图片路径不对，可以手动更新：
-- UPDATE styles SET preview_image_url = '/styles/Bordeaux-Muse.jpg' WHERE id = 'bordeaux-muse';
-- UPDATE styles SET preview_image_url = '/styles/Emerald-Muse.jpg' WHERE id = 'emerald-muse';
-- UPDATE styles SET preview_image_url = '/styles/wes-anderson-pop.jpg' WHERE id = 'wes-anderson-pop';
