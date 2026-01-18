-- 安全更新脚本：保留现有数据，只禁用低质量风格
-- 在 Supabase SQL Editor 中运行

-- Step 1: 禁用9个低质量风格（而不是删除）
UPDATE styles 
SET is_enabled = false
WHERE id IN (
  'Victorian-Royal',
  'Vintage-Traveler',
  'Johannes-Vermeer',
  'Johannes Vermeer',  -- 可能有空格的版本
  'Flower-Crown',
  'Embroidery-Art',
  'Fine-Sketch',
  'Spring-Vibes',
  'Watercolor-Dream',
  'Pixel-Mosaic'
);

-- Step 2: 确保5个高质量风格存在并启用
INSERT INTO styles (
  id,
  name,
  emoji,
  prompt_suffix,
  category,
  description,
  preview_image_url,
  sort_order,
  is_enabled,
  is_premium
) VALUES
  (
    'Christmas-Vibe',
    'Merry Christmas',
    '🎅',
    ', wearing a fluffy red and white Santa hat, festive holiday spirit, bright joyful eyes, solid bold red background, high-end commercial photography, clean composition, warm and cheerful atmosphere, 8k resolution.',
    'photo',
    'Festive holiday look with a classic Santa hat',
    '/iShot_2026-01-16_15.15.27.png',
    1,
    true,
    false
  ),
  (
    'Smart-Casual',
    'Smart Casual',
    '🧥',
    ', wearing a cozy textured turtleneck sweater and a herringbone newsboy flat cap, professional pet photography, solid warm background, sharp focus on eyes, clean and stylish modern aesthetic.',
    'photo',
    'Trendy look with a sweater and newsboy cap',
    '/iShot_2026-01-16_15.15.47.png',
    2,
    true,
    false
  ),
  (
    'Birthday-Party',
    'Birthday Party',
    '🎂',
    ', celebrating a birthday, wearing a colorful striped party hat, sitting behind a vibrant birthday cake with a burning candle, blurred party background with balloons and fairy lights, warm indoor lighting, joyful celebration.',
    'photo',
    'Cheerful birthday celebration with cake and hat',
    '/iShot_2026-01-16_15.16.22.png',
    3,
    true,
    false
  ),
  (
    'Music-Lover',
    'Music Lover',
    '🎧',
    ', wearing professional silver wired headphones around the neck, studio portrait, deep blue textured background, cinematic rim lighting, crisp fur details, cool and contemporary vibe, high-quality photography.',
    'photo',
    'Cool studio portrait with silver headphones',
    '/iShot_2026-01-16_15.17.26.png',
    4,
    true,
    false
  ),
  (
    'Retro-Pop-Art',
    'Retro Pop Art',
    '🎨',
    ', bold geometric shapes and flat color blocks, mid-century modern illustration style, vibrant contrasting colors, simplified features, clean outlines, playful and energetic composition, vintage poster aesthetic with subtle paper texture, trendy and eye-catching design',
    'artistic',
    'Bold retro poster with geometric shapes',
    '/retro-pop-art.png',
    5,
    true,
    false
  )
ON CONFLICT (id) 
DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  prompt_suffix = EXCLUDED.prompt_suffix,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  preview_image_url = EXCLUDED.preview_image_url,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled,
  updated_at = NOW();

-- Step 3: 验证结果
SELECT 
  id,
  name,
  is_enabled,
  sort_order
FROM styles
WHERE is_enabled = true
ORDER BY sort_order;

-- 显示总数
SELECT 
  COUNT(*) FILTER (WHERE is_enabled = true) as enabled_styles,
  COUNT(*) FILTER (WHERE is_enabled = false) as disabled_styles
FROM styles;
