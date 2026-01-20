-- =============================================
-- Migration: Add Multi-Model Routing Support
-- Date: 2026-01-20
-- Purpose: Support different models for different styles
-- =============================================

-- Add model routing columns to styles table
ALTER TABLE styles ADD COLUMN IF NOT EXISTS model_provider TEXT DEFAULT 'replicate';
ALTER TABLE styles ADD COLUMN IF NOT EXISTS model_id TEXT DEFAULT 'black-forest-labs/flux-dev';
ALTER TABLE styles ADD COLUMN IF NOT EXISTS lora_url TEXT;
ALTER TABLE styles ADD COLUMN IF NOT EXISTS model_params JSONB;

-- Add comments for clarity
COMMENT ON COLUMN styles.model_provider IS 'Model provider: replicate, doubao, midjourney, etc.';
COMMENT ON COLUMN styles.model_id IS 'Specific model ID on the provider platform';
COMMENT ON COLUMN styles.lora_url IS 'Optional LoRA URL for fine-tuning (FLUX/SDXL only)';
COMMENT ON COLUMN styles.model_params IS 'JSON object with model-specific parameters (lora_scale, guidance_scale, etc.)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_styles_model_provider ON styles(model_provider);

-- Example data updates for existing styles
-- (These are examples - adjust based on your actual style names)

-- 1. Sketch style using FLUX + LoRA
UPDATE styles 
SET 
  model_provider = 'replicate',
  model_id = 'black-forest-labs/flux-dev-lora',
  model_params = '{"lora_scale": 0.8, "trigger_word": "sketch"}'::jsonb
WHERE name = 'sketch' OR name ILIKE '%sketch%';

-- 2. Watercolor style using SDXL + LoRA (to be tested)
-- UPDATE styles 
-- SET 
--   model_provider = 'replicate',
--   model_id = 'stability-ai/sdxl',
--   lora_url = 'https://replicate.delivery/pbxt/watercolor-lora.safetensors',
--   model_params = '{"lora_scale": 0.9, "guidance_scale": 7.5}'::jsonb
-- WHERE name = 'watercolor' OR name ILIKE '%watercolor%';

-- 3. Keep existing FLUX-dev styles as default
UPDATE styles 
SET 
  model_provider = 'replicate',
  model_id = 'black-forest-labs/flux-dev'
WHERE model_provider IS NULL OR model_provider = '';

-- Show migration results
SELECT 
  name,
  model_provider,
  model_id,
  model_params
FROM styles
ORDER BY created_at DESC
LIMIT 10;
