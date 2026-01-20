-- ============================================
-- Migration: Add Emerald Muse Style
-- Date: 2026-01-20
-- Purpose: Elegant fashion portrait with sophisticated sage/olive green styling
-- Testing Results: strength=0.89, guidance=2.8, muted green works best
-- Chinese Name: 翡翠缪斯（橄榄绿调）
-- Key: Muted sage green > Bright emerald green for premium feel
-- ============================================

-- Insert the Emerald Muse style
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
  'emerald-muse',
  'Emerald Muse',
  ', wearing a chic sage green beret hat and a soft olive green cashmere scarf, antique jade necklace with brass pendant, professional fashion portrait, SOLID MUTED SAGE GREEN BACKGROUND, SOFT OLIVE GREEN STUDIO BACKDROP, SOPHISTICATED GREEN SETTING, refined green monochromatic palette, matte sophisticated finish, centered composition, Harper''s Bazaar vintage editorial style, ultra-realistic commercial photography, SHARP FOCUS, understated elegance, premium muted aesthetic, 8k resolution',
  'bright green, vivid green, neon, lime, light green, electric green, kelly green, grass green, gradient, pattern, grey, blue, red, beige, messy, blurry, shiny, glossy',
  'Realistic',
  'Elegant sage green fashion portrait - beret, cashmere scarf, jade necklace',
  '/styles/emerald-muse.jpg',
  13,
  true,
  true,
  0.89,
  2.8,
  50,
  95,
  false  -- Maximum quality for realistic fashion photography
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
WHERE id = 'emerald-muse';

-- Show success message
SELECT 
  '✅ Emerald Muse (翡翠缪斯) style added successfully!' as status,
  'Tested parameters: strength=0.89, guidance=2.8, quality=95' as params,
  'Key learning: Muted sage/olive green > Bright emerald for premium feel' as insight,
  'Accessories: Beret + Cashmere scarf + Jade necklace' as fixed_accessories;
