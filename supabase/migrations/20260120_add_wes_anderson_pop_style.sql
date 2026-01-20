-- ============================================
-- Migration: Add Wes Anderson Pop Art Style
-- Date: 2026-01-20
-- Purpose: Add symmetrical pop art fashion style with strong color blocking
-- Note: If you want to set custom model_provider/model_id, 
--       run 20260120_add_model_routing.sql first
-- ============================================

-- Insert the new style (model_provider and model_id will use defaults)
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
  'wes-anderson-pop',
  'Wes Anderson Pop',
  ', symmetrical fashion editorial portrait, anthropomorphically dressed in glossy bright vivid clothing with bold colors, wearing oversized translucent sunglasses, wearing a matching bucket hat or cap, clean solid vivid background with strong color contrast, Wes Anderson cinematic style, strong color blocking, pop art aesthetic, geometric composition, soft even studio lighting, sharp focus, highly detailed, vibrant colors',
  'asymmetrical, messy background, gradient background, dark colors, muted tones, realistic, photorealistic, natural lighting, blurry, low quality, cluttered',
  'Artistic',
  'Wes Anderson-inspired pop art with bold colors and symmetrical composition',
  '/styles/wes-anderson-pop.jpg',
  15,
  true,
  true,
  0.88,
  2.0,
  50,
  80,
  true  -- go_fast enabled for artistic styles
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
WHERE id = 'wes-anderson-pop';

-- Show example usage
SELECT 
  '✅ Wes Anderson Pop style added successfully!' as status,
  'Use with: prompt_strength=0.92, guidance=2.0, steps=50' as recommended_params;
