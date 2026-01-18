-- Add pet_type column to generations table for gallery filtering
-- Migration: 20260118_add_pet_type_column
-- Purpose: Enable automatic pet categorization in gallery from quality_check data

-- Check if generations table exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'generations'
  ) THEN
    RAISE EXCEPTION 'ERROR: Table public.generations does not exist. Please run the main schema.sql file first.';
  END IF;
END $$;

-- Add pet_type column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generations' 
    AND column_name = 'pet_type'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN pet_type TEXT;
    RAISE NOTICE 'Added pet_type column to generations table';
  ELSE
    RAISE NOTICE 'Column pet_type already exists, skipping...';
  END IF;
END $$;

-- Create index for efficient filtering in public gallery
CREATE INDEX IF NOT EXISTS idx_generations_pet_type 
ON public.generations(pet_type) WHERE is_public = true;

-- Add documentation
COMMENT ON COLUMN public.generations.pet_type IS 'Pet type extracted from quality_check (cat, dog, bird, rabbit, hamster, snake, lizard, etc.) for gallery filtering';

-- Backfill existing public generations with pet_type from quality_check
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.generations
  SET pet_type = LOWER(quality_check->>'petType')
  WHERE is_public = true 
    AND pet_type IS NULL 
    AND quality_check->>'petType' IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % existing records with pet_type', updated_count;
END $$;

-- Show results
SELECT 
  pet_type,
  COUNT(*) as count
FROM public.generations
WHERE is_public = true
GROUP BY pet_type
ORDER BY count DESC;
