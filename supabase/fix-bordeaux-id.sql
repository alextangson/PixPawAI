-- ============================================
-- 修复 Bordeaux-Muse 的 ID 和图片路径问题
-- ============================================

-- 问题 1: ID 有空格 "bordeaux-muse "
-- 问题 2: 图片路径错误

-- 方案 A: 直接删除重建（推荐）
DELETE FROM styles WHERE id LIKE 'bordeaux-muse%';

-- 重新插入正确的数据
INSERT INTO styles (
  id,
  name,
  prompt_suffix,
  negative_prompt,
  category,
  description,
  preview_image_url,
  sort_order,
  is_enabled,
  is_premium,
  recommended_strength_min,
  recommended_guidance,
  num_inference_steps,
  output_quality,
  enable_go_fast
) VALUES (
  'bordeaux-muse',
  'Bordeaux Muse',
  ', wearing a sophisticated burgundy beret hat and a luxurious black ribbed turtleneck sweater, elegant pearl necklace with decorative gold pendant, professional magazine cover portrait, SOLID DEEP BURGUNDY RED BACKGROUND, RICH RED STUDIO BACKDROP, monochromatic burgundy color theme, centered frontal pose, dramatic studio lighting, Harper''s Bazaar Pets magazine editorial style, ultra-realistic commercial photography, CRISP SHARP FOCUS, high-definition details, sophisticated premium luxury aesthetic, 8k ultra high resolution',
  'gradient, pattern, texture, messy, outdoor, blurry, soft focus, low quality, grey background, gray background, blue background, beige background, green background, bright red, orange, pink, desaturated, muted colors, neutral tones, tan, brown',
  'Realistic',
  'Elegant burgundy-themed fashion portrait - beret, turtleneck, pearls',
  '/styles/bordeaux-muse.jpg',
  14,
  true,
  true,
  0.90,
  3.5,
  50,
  98,
  false
);

-- 验证
SELECT 
  id,
  name,
  preview_image_url,
  LENGTH(id) as id_length,
  CASE WHEN id = 'bordeaux-muse' THEN '✅ Correct' ELSE '❌ Still has space' END as status
FROM styles
WHERE id LIKE 'bordeaux%';
