-- ============================================
-- Migration: Add Magazine Chic Style
-- Date: 2026-01-20
-- Purpose: Add high-end fashion magazine editorial style with designer accessories
-- Testing Results: Best with high strength (0.85-0.90) + moderate guidance (2.0-2.5)
-- Note: If you want to set custom model_provider/model_id, 
--       run 20260120_add_model_routing.sql first
-- ============================================

-- Insert the Magazine Chic style (model_provider and model_id will use defaults)
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
  'magazine-chic',
  'Magazine Chic',
  ', elegantly dressed as a fashion photographer, wearing stylish oversized designer sunglasses and a luxurious textured blazer or knit jacket, silk scarf or neck accessory with decorative jewelry brooch, holding a vintage leather-wrapped camera, professional low-angle fashion portrait, warm creamy beige or neutral background, soft golden studio lighting, warm color palette throughout, vogue magazine editorial style, ultra-realistic commercial photography, rich luxurious textures, sophisticated and elegant, sharp focus, 8k resolution',
  'cartoon, anime, painting, sketch, low quality, blurry, amateur, messy background, cluttered, overexposed, cold tones, grey background, blue background, dark background',
  'Realistic',
  'High-end fashion magazine style with designer accessories and warm studio lighting',
  '/styles/magazine-chic.jpg',
  12,
  true,
  true,
  0.85,
  2.0,
  50,
  95,
  false  -- go_fast disabled for maximum quality in realistic styles
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
WHERE id = 'magazine-chic';

-- Show key learning from testing
SELECT 
  '✅ Magazine Chic style added successfully!' as status,
  'Key insight: High strength (0.85-0.92) + Moderate guidance (2.0-2.5) = Best realistic accessory generation' as learning,
  'Color harmony is critical: Match clothing color to pet color for luxury feel' as tip,
  'Note: recommended_strength_max field removed - use 0.92 as upper bound in code' as note;
