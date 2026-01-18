-- Add pet_type column to generations table for gallery filtering
-- Migration: 20260118_add_pet_type_column
-- Purpose: Enable automatic pet categorization in gallery from quality_check data

-- Add pet_type column
ALTER TABLE generations
ADD COLUMN IF NOT EXISTS pet_type TEXT;

-- Create index for efficient filtering in public gallery
CREATE INDEX IF NOT EXISTS idx_generations_pet_type 
ON generations(pet_type) WHERE is_public = true;

-- Add documentation
COMMENT ON COLUMN generations.pet_type IS 'Pet type extracted from quality_check (cat, dog, bird, rabbit, hamster, snake, lizard, etc.) for gallery filtering';

-- Backfill existing public generations with pet_type from quality_check
UPDATE generations
SET pet_type = LOWER(quality_check->>'petType')
WHERE is_public = true 
  AND pet_type IS NULL 
  AND quality_check->>'petType' IS NOT NULL;

-- Show results
SELECT 
  pet_type,
  COUNT(*) as count
FROM generations
WHERE is_public = true
GROUP BY pet_type
ORDER BY count DESC;
