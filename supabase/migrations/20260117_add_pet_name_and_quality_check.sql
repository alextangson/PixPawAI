-- Add pet_name, art_card_title, and quality_check fields to generations table
-- Migration: 20260117_add_pet_name_and_quality_check

-- Add pet_name column (optional text field)
ALTER TABLE generations
ADD COLUMN IF NOT EXISTS pet_name TEXT;

-- Add art_card_title column (generated title for art cards)
ALTER TABLE generations
ADD COLUMN IF NOT EXISTS art_card_title TEXT;

-- Add quality_check column (stores Qwen quality check results as JSONB)
ALTER TABLE generations
ADD COLUMN IF NOT EXISTS quality_check JSONB;

-- Add index on pet_name for faster queries
CREATE INDEX IF NOT EXISTS idx_generations_pet_name ON generations(pet_name);

-- Add comment for documentation
COMMENT ON COLUMN generations.pet_name IS 'User-provided name for their pet';
COMMENT ON COLUMN generations.art_card_title IS 'Auto-generated title for art cards (e.g., "Max - Royal Majesty")';
COMMENT ON COLUMN generations.quality_check IS 'Qwen vision analysis results including quality assessment and feature detection';
