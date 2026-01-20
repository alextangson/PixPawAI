-- ============================================
-- Migration: Add Generation Parameters to Styles
-- Date: 2026-01-20
-- Purpose: Move generation quality parameters to database for per-style control
-- ============================================

-- Add generation quality parameters
ALTER TABLE styles 
  ADD COLUMN IF NOT EXISTS num_inference_steps INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS output_quality INTEGER DEFAULT 80,
  ADD COLUMN IF NOT EXISTS enable_go_fast BOOLEAN DEFAULT true;

-- Add comments
COMMENT ON COLUMN styles.num_inference_steps IS 'Number of inference steps (28-80). Higher = better quality but slower';
COMMENT ON COLUMN styles.output_quality IS 'Output quality (0-100). Realistic styles should use 90+';
COMMENT ON COLUMN styles.enable_go_fast IS 'Enable fast mode (40-60% faster but may reduce style transfer)';

-- Set optimal values for existing styles
UPDATE styles SET
  num_inference_steps = 50,
  output_quality = 90,
  enable_go_fast = false
WHERE id IN ('Christmas-Vibe', 'Smart-Casual', 'Birthday-Party', 'Music-Lover')
  AND recommended_strength_min >= 0.90;  -- Realistic styles

UPDATE styles SET
  num_inference_steps = 35,
  output_quality = 80,
  enable_go_fast = true
WHERE id = 'Retro-Pop-Art'
  AND recommended_strength_min < 0.90;   -- Artistic styles

-- Verify
SELECT 
  id,
  name,
  recommended_strength_min as strength,
  recommended_guidance as guidance,
  num_inference_steps as steps,
  output_quality as quality,
  enable_go_fast as fast_mode
FROM styles
WHERE is_enabled = true
ORDER BY sort_order;
