-- ============================================
-- Final Migration: Complete Share System
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add share_card_url column (if not exists)
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS share_card_url TEXT;

-- 2. Add views and likes columns for stats (if not exists)
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- 3. Ensure is_rewarded exists (should already exist from previous migrations)
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS is_rewarded BOOLEAN DEFAULT false;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generations_share_card_url 
ON public.generations(share_card_url) 
WHERE share_card_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_generations_is_public 
ON public.generations(is_public) 
WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_generations_is_rewarded 
ON public.generations(is_rewarded) 
WHERE is_rewarded = true;

-- 5. Create shared-cards storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared-cards', 'shared-cards', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own share cards" ON storage.objects;
DROP POLICY IF EXISTS "Public can view share cards" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own share cards" ON storage.objects;

-- 7. Create storage policies for shared-cards bucket

-- Policy: Allow authenticated users to upload their own share cards
CREATE POLICY "Users can upload their own share cards"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shared-cards');

-- Policy: Allow public read access to all share cards
CREATE POLICY "Public can view share cards"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'shared-cards');

-- Policy: Allow users to delete any share cards (admin access via service role)
CREATE POLICY "Admin can delete share cards"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'shared-cards');

-- 8. Add comments for documentation
COMMENT ON COLUMN public.generations.share_card_url IS 'URL of the premium Leica/Polaroid-style branded card for social media';
COMMENT ON COLUMN public.generations.views IS 'Number of times this generation was viewed in the gallery';
COMMENT ON COLUMN public.generations.likes IS 'Number of likes this generation received';
COMMENT ON COLUMN public.generations.is_rewarded IS 'Whether the user has received the +1 credit reward for sharing (one-time only)';

-- 9. Verify the setup
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'generations'
  AND column_name IN ('share_card_url', 'views', 'likes', 'is_rewarded', 'is_public')
ORDER BY column_name;
