-- ============================================
-- Migration: Add Birthday Celebration Style (Enhanced Version)
-- Date: 2026-01-20
-- Purpose: Warm festive birthday party with rich decorations
-- Testing Results: strength=0.95, guidance=2.5, warm decorative elements work well
-- Chinese Name: 生日庆典（增强版）
-- Note: This is an A/B test variant of Birthday-Party
-- ============================================

-- Insert the Birthday Celebration style
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
  'birthday-celebration',
  'Birthday Celebration',
  ', celebrating a joyful birthday party, wearing a vibrant rainbow-colored striped party hat and a festive colorful bow tie around the neck, sweet cheerful expression with closed mouth and happy eyes, sitting behind a beautiful birthday cake with lit candles on a golden cake stand, festive party scene with floating soft pink and peach balloons in the background, hanging golden yellow party streamers cascading from above, colorful bunting flags strung across, scattered warm-toned confetti on the table surface, wrapped pastel gift boxes with satin ribbons nearby, twinkling warm string lights creating bokeh, warm indoor lighting with golden amber glow, WARM PEACHY PINK AMBIENT ATMOSPHERE, cozy cheerful celebration, professional party photography, 8k resolution',
  'wide open mouth, tongue out, showing teeth, grinning, laughing, blue background, teal tones, cyan colors, purple shades, green hues, cool color temperature, cold lighting, grey background, dark moody, plain solid background, minimalist, serious sad expression, outdoor, blurry, low quality',
  'Realistic',
  'Warm festive birthday with decorative elements - party hat, bow tie, cake',
  '/styles/birthday-celebration.jpg',
  16,
  true,
  true,
  0.95,
  2.5,
  50,
  90,
  false
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
  is_enabled,
  is_premium
FROM styles
WHERE id = 'birthday-celebration';

-- Show success message
SELECT 
  '✅ Birthday Celebration style added successfully!' as status,
  'Tested parameters: strength=0.95, guidance=2.5' as params,
  'Decoration phrases: floating balloons, hanging streamers, scattered confetti' as technique;
