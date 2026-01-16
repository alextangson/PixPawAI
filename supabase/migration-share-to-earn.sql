-- ============================================
-- Share to Earn Feature Migration
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- Add new columns to generations table
ALTER TABLE public.generations
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS alt_text TEXT,
ADD COLUMN IF NOT EXISTS is_rewarded BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS style_category TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Note: input_url already exists in the base schema (input_image was renamed to input_url)
-- Note: output_url already exists in the base schema (output_image was renamed to output_url)

-- Create index for public generations (for gallery query performance)
CREATE INDEX IF NOT EXISTS idx_generations_is_public ON public.generations(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_generations_style_category ON public.generations(style_category) WHERE is_public = true;

-- Add comments
COMMENT ON COLUMN public.generations.is_public IS 'Whether this generation is shared publicly in the gallery';
COMMENT ON COLUMN public.generations.title IS 'User-provided title for public gallery display';
COMMENT ON COLUMN public.generations.alt_text IS 'SEO-friendly alt text for the image';
COMMENT ON COLUMN public.generations.is_rewarded IS 'Whether the user has received the sharing reward for this generation';
COMMENT ON COLUMN public.generations.style_category IS 'Style category for filtering in gallery';
COMMENT ON COLUMN public.generations.input_image IS 'URL of the input image (for reference)';
COMMENT ON COLUMN public.generations.metadata IS 'Additional metadata (JSON)';

-- Update RLS policies to allow public access to shared generations
DROP POLICY IF EXISTS "Public can view shared generations" ON public.generations;
CREATE POLICY "Public can view shared generations"
  ON public.generations
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE '✅ Share to Earn migration complete!';
  RAISE NOTICE '📋 Added columns: is_public, title, alt_text, is_rewarded, style_category, input_image, metadata';
  RAISE NOTICE '🔍 Created indexes for gallery queries';
  RAISE NOTICE '🔒 Updated RLS policies for public access';
END $$;
