-- ============================================
-- Migration: Add Memorial Styles (Rainbow Bridge, Guardian Angel, Watercolor Keepsake)
-- Date: 2026-07-04
-- Purpose: Close the product-content gap — the site drives pet-memorial traffic
--          but no memorial generation styles existed. These three are tribute-first
--          (light / atmosphere / medium, no costumes) so pet identity is preserved.
-- Preview thumbnails: generated via scripts/generate-memorial-previews.js (flux-dev).
-- NOTE: recommended_strength_min values are initial estimates. Generation reads
--       strength from this row (falls back to 0.45 if the row is missing), so this
--       migration MUST be applied for good output. Dial in with the testMode harness.
-- ============================================

INSERT INTO styles (
  id, name, prompt_suffix, negative_prompt, category, description,
  preview_image_url, sort_order, is_enabled, is_premium,
  recommended_strength_min, recommended_guidance,
  num_inference_steps, output_quality, enable_go_fast
) VALUES
  (
    'rainbow-bridge',
    'Rainbow Bridge',
    ', sitting peacefully in a serene heavenly meadow, a soft luminous rainbow arcing gently across a dreamy pastel sky, wispy glowing clouds and warm golden backlight, gentle ethereal glow around the pet, delicate wildflowers, tender and comforting memorial atmosphere, soft and painterly, sharp focus on the face, high detail, 8k',
    'dark, gloomy, scary, creepy, deformed, distorted, extra limbs, mutated, blurry, low quality, text, watermark, human person',
    'Memorial',
    'Peaceful rainbow-bridge tribute in a soft heavenly meadow',
    '/styles/rainbow-bridge.jpg',
    20, true, false,
    0.82, 2.5,
    50, 90, false
  ),
  (
    'guardian-angel',
    'Guardian Angel',
    ', gentle guardian angel tribute, soft white feathered angel wings behind the pet, a delicate faint golden halo glowing softly above the head, bathed in warm divine white and gold light, soft heavenly clouds, serene and loving expression, luminous ethereal glow, tender and peaceful, sharp focus on the face, high detail, 8k',
    'dark, gloomy, scary, creepy, demonic, deformed, distorted, extra limbs, mutated, blurry, low quality, text, watermark, human person',
    'Memorial',
    'Angelic tribute — soft wings, a gentle halo, divine light',
    '/styles/guardian-angel.jpg',
    21, true, false,
    0.82, 2.5,
    50, 90, false
  ),
  (
    'watercolor-keepsake',
    'Watercolor Keepsake',
    ', delicate hand-painted watercolor painting, soft translucent color washes, wet-on-wet bleeding pigments, visible watercolor paper texture, loose expressive brush strokes, muted pastel palette, timeless keepsake artwork, fine art watercolor illustration, painterly not photographic',
    'photograph, photo, realistic, hyperrealistic, 3d, cgi, sharp photographic detail, street, road, buildings, pavement, low quality, text, watermark',
    'Memorial',
    'Tender hand-painted watercolor tribute, soft and timeless',
    '/styles/watercolor-keepsake.jpg',
    22, true, false,
    0.85, 2.5,
    50, 90, false
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  prompt_suffix = EXCLUDED.prompt_suffix,
  negative_prompt = EXCLUDED.negative_prompt,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  preview_image_url = EXCLUDED.preview_image_url,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled,
  is_premium = EXCLUDED.is_premium,
  recommended_strength_min = EXCLUDED.recommended_strength_min,
  recommended_guidance = EXCLUDED.recommended_guidance,
  num_inference_steps = EXCLUDED.num_inference_steps,
  output_quality = EXCLUDED.output_quality,
  enable_go_fast = EXCLUDED.enable_go_fast,
  updated_at = now();

-- Verify
SELECT id, name, category, recommended_strength_min AS strength, recommended_guidance AS guidance, is_enabled, is_premium
FROM styles
WHERE id IN ('rainbow-bridge', 'guardian-angel', 'watercolor-keepsake')
ORDER BY sort_order;
