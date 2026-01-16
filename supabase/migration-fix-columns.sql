-- ============================================
-- Fix Generations Table Columns
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- Check if input_url column exists, if not rename or add it
DO $$ 
BEGIN
  -- Check if input_url exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' 
    AND column_name = 'input_url'
  ) THEN
    -- Check if input_image exists (old name)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'generations' 
      AND column_name = 'input_image'
    ) THEN
      -- Rename input_image to input_url
      ALTER TABLE public.generations RENAME COLUMN input_image TO input_url;
      RAISE NOTICE 'Renamed input_image to input_url';
    ELSE
      -- Add input_url column
      ALTER TABLE public.generations ADD COLUMN input_url TEXT NOT NULL DEFAULT '';
      RAISE NOTICE 'Added input_url column';
    END IF;
  END IF;

  -- Check if output_url exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' 
    AND column_name = 'output_url'
  ) THEN
    -- Check if output_image exists (old name)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'generations' 
      AND column_name = 'output_image'
    ) THEN
      -- Rename output_image to output_url
      ALTER TABLE public.generations RENAME COLUMN output_image TO output_url;
      RAISE NOTICE 'Renamed output_image to output_url';
    ELSE
      -- Add output_url column
      ALTER TABLE public.generations ADD COLUMN output_url TEXT;
      RAISE NOTICE 'Added output_url column';
    END IF;
  END IF;
END $$;

-- Verify the columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'generations'
AND column_name IN ('input_url', 'output_url', 'input_image', 'output_image')
ORDER BY column_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Column migration complete!';
  RAISE NOTICE 'Columns should now be: input_url, output_url';
END $$;
