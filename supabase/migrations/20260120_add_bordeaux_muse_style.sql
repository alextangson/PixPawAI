-- ============================================
-- Migration: Add Bordeaux Muse Style
-- Date: 2026-01-20
-- Purpose: Classic fashion magazine cover with burgundy/deep red monochromatic theme
-- Testing Results: strength=0.93, guidance=3.5, burgundy background works well
-- Chinese Name: 酒红缪斯
-- ============================================

-- Insert the Bordeaux Muse style
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
  '/styles/Bordeaux-Muse.jpg',
  14,
  true,
  true,
  0.90,
  3.5,
  50,
  98,
  false  -- Maximum quality for premium realistic photography
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  prompt_suffix = EXCLUDED.prompt_suffix,
  negative_prompt = EXCLUDED.negative_prompt,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  preview_image_url = EXCLUDED.preview_image_url,
  recommended_strength_min = EXCLUDED.recommended_strength_min,
  recommended_guidance = EXCLUDED.recommended_guidance,
  num_inference_steps = EXCLUDED.num_inference_steps,
  output_quality = EXCLUDED.output_quality,
  enable_go_fast = EXCLUDED.enable_go_fast,
  updated_at = now();

-- Verify the insertion
SELECT 
  id,
  name,
  category,
  recommended_strength_min as strength,
  recommended_guidance as guidance,
  num_inference_steps as steps,
  output_quality as quality,
  enable_go_fast as fast_mode,
  is_enabled,
  is_premium
FROM styles
WHERE id = 'bordeaux-muse';

-- Show success message
SELECT 
  '✅ Bordeaux Muse (酒红缪斯) style added successfully!' as status,
  'Tested parameters: strength=0.93, guidance=3.5, quality=98' as params,
  'Key: High guidance (3.5) is critical for burgundy/red backgrounds' as learning;
