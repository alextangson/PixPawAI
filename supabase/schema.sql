-- ============================================
-- PixPaw AI - Database Schema Setup
-- ============================================
-- Run this script in Supabase SQL Editor
-- Last Updated: 2026-01-15
-- ============================================

-- ============================================
-- 1. EXTENSIONS
-- ============================================
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. TABLES
-- ============================================

-- ---------------------------------------------
-- Table: profiles
-- Purpose: Extends auth.users with app-specific data
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 2,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro')),
  total_generations INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON public.profiles(tier);

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles with credits and subscription tier';
COMMENT ON COLUMN public.profiles.credits IS 'Available generation credits (2 free on signup)';
COMMENT ON COLUMN public.profiles.tier IS 'Subscription tier: free, starter, or pro';

-- ---------------------------------------------
-- Table: generations
-- Purpose: Stores AI generation history
-- UPDATED: 2026-01-16 - Added Share-to-Earn columns
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'succeeded', 'failed')),
  input_url TEXT NOT NULL,
  output_url TEXT,
  prompt TEXT NOT NULL,
  style TEXT NOT NULL,
  error_message TEXT,
  replicate_id TEXT,
  webhook_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Share-to-Earn System (Added 2026-01-16)
  is_public BOOLEAN NOT NULL DEFAULT false,
  title TEXT,
  alt_text TEXT,
  is_rewarded BOOLEAN NOT NULL DEFAULT false,
  style_category TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Analytics & Social (Added 2026-01-16)
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  share_card_url TEXT,
  
  -- Storage Path Tracking (Added 2026-01-16)
  input_storage_path TEXT,
  output_storage_path TEXT,
  share_card_storage_path TEXT
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON public.generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_replicate_id ON public.generations(replicate_id) WHERE replicate_id IS NOT NULL;

-- Indexes for Share-to-Earn System (Added 2026-01-16)
CREATE INDEX IF NOT EXISTS idx_generations_is_public ON public.generations(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_generations_style_category ON public.generations(style_category) WHERE style_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_generations_is_rewarded ON public.generations(is_rewarded) WHERE is_rewarded = true;
CREATE INDEX IF NOT EXISTS idx_generations_share_card_url ON public.generations(share_card_url) WHERE share_card_url IS NOT NULL;

-- Add comments
COMMENT ON TABLE public.generations IS 'AI generation history and status tracking';
COMMENT ON COLUMN public.generations.status IS 'Current status: processing, succeeded, or failed';
COMMENT ON COLUMN public.generations.replicate_id IS 'Replicate API prediction ID for tracking';
COMMENT ON COLUMN public.generations.is_public IS 'Whether this generation is shared publicly in the gallery';
COMMENT ON COLUMN public.generations.title IS 'User-provided title for public gallery display';
COMMENT ON COLUMN public.generations.alt_text IS 'SEO-friendly alt text for the image';
COMMENT ON COLUMN public.generations.is_rewarded IS 'Whether user has received the +1 credit reward for sharing (one-time only)';
COMMENT ON COLUMN public.generations.style_category IS 'Style category for filtering in gallery';
COMMENT ON COLUMN public.generations.metadata IS 'Additional metadata (JSONB): aspectRatio, dimensions, strength, provider, model, etc.';
COMMENT ON COLUMN public.generations.views IS 'Number of times this generation was viewed in the gallery';
COMMENT ON COLUMN public.generations.likes IS 'Number of likes this generation received';
COMMENT ON COLUMN public.generations.share_card_url IS 'URL of the premium Leica/Polaroid-style branded card for social media';
COMMENT ON COLUMN public.generations.input_storage_path IS 'Storage path for input image (for reliable deletion)';
COMMENT ON COLUMN public.generations.output_storage_path IS 'Storage path for output image (for reliable deletion)';
COMMENT ON COLUMN public.generations.share_card_storage_path IS 'Storage path for share card (for reliable deletion)';

-- ---------------------------------------------
-- Table: gallery_images
-- Purpose: Public gallery showcase
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  style_category TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'rabbit', 'bird', 'reptile', 'small_pet', 'farm', 'other')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_gallery_style_category ON public.gallery_images(style_category);
CREATE INDEX IF NOT EXISTS idx_gallery_species ON public.gallery_images(species);
CREATE INDEX IF NOT EXISTS idx_gallery_is_featured ON public.gallery_images(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON public.gallery_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_tags ON public.gallery_images USING GIN(tags);

-- Add comments
COMMENT ON TABLE public.gallery_images IS 'Public gallery of curated pet portraits';
COMMENT ON COLUMN public.gallery_images.prompt_template IS 'The prompt template used to generate this style';
COMMENT ON COLUMN public.gallery_images.species IS 'Pet species for filtering';
COMMENT ON COLUMN public.gallery_images.tags IS 'Array of tags for search and filtering';

-- ============================================
-- 3. FUNCTIONS
-- ============================================

-- ---------------------------------------------
-- Function: handle_new_user
-- Purpose: Automatically create profile when user signs up
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Creates a profile automatically when a new user signs up';

-- ---------------------------------------------
-- Function: update_updated_at
-- Purpose: Automatically update updated_at timestamp
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at IS 'Updates the updated_at timestamp on row modification';

-- ---------------------------------------------
-- Function: decrement_credits
-- Purpose: Safely decrement user credits
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_credits(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits = credits - 1
  WHERE id = user_uuid AND credits > 0
  RETURNING credits INTO current_credits;
  
  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits or user not found';
  END IF;
  
  RETURN current_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.decrement_credits IS 'Safely decrements user credits (atomic operation)';

-- ---------------------------------------------
-- Function: increment_credits
-- Purpose: Safely increment user credits (for refunds and rewards)
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_credits(user_uuid UUID, amount INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits = credits + amount
  WHERE id = user_uuid
  RETURNING credits INTO new_credits;
  
  IF new_credits IS NULL THEN
    RAISE EXCEPTION 'User not found: %', user_uuid;
  END IF;
  
  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_credits IS 'Safely increments user credits (atomic operation) - for refunds and share rewards';

-- ---------------------------------------------
-- Function: increment_generation_count
-- Purpose: Track total generations per user
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_generation_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'succeeded' AND (OLD IS NULL OR OLD.status != 'succeeded') THEN
    UPDATE public.profiles
    SET total_generations = total_generations + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_generation_count IS 'Increments total_generations when a generation succeeds';

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Trigger: Create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Update updated_at on profile changes
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger: Increment generation count on success
DROP TRIGGER IF EXISTS on_generation_succeeded ON public.generations;
CREATE TRIGGER on_generation_succeeded
  AFTER INSERT OR UPDATE ON public.generations
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_generation_count();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- RLS Policies: profiles
-- ---------------------------------------------

-- Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Service role can do anything (for admin operations)
DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;
CREATE POLICY "Service role has full access to profiles"
  ON public.profiles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ---------------------------------------------
-- RLS Policies: generations
-- ---------------------------------------------

-- Policy: Users can view their own generations OR public shared ones
DROP POLICY IF EXISTS "Users can view own generations" ON public.generations;
CREATE POLICY "Users can view own generations"
  ON public.generations
  FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

-- Policy: Anonymous users can view public shared generations
DROP POLICY IF EXISTS "Public can view shared generations" ON public.generations;
CREATE POLICY "Public can view shared generations"
  ON public.generations
  FOR SELECT
  TO anon
  USING (is_public = true);

-- Policy: Users can insert their own generations
DROP POLICY IF EXISTS "Users can insert own generations" ON public.generations;
CREATE POLICY "Users can insert own generations"
  ON public.generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own generations (for status changes)
DROP POLICY IF EXISTS "Users can update own generations" ON public.generations;
CREATE POLICY "Users can update own generations"
  ON public.generations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access (for webhooks)
DROP POLICY IF EXISTS "Service role has full access to generations" ON public.generations;
CREATE POLICY "Service role has full access to generations"
  ON public.generations
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ---------------------------------------------
-- RLS Policies: gallery_images
-- ---------------------------------------------

-- Policy: Anyone can view gallery images (public)
DROP POLICY IF EXISTS "Gallery images are publicly viewable" ON public.gallery_images;
CREATE POLICY "Gallery images are publicly viewable"
  ON public.gallery_images
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert gallery images (curated)
DROP POLICY IF EXISTS "Service role can insert gallery images" ON public.gallery_images;
CREATE POLICY "Service role can insert gallery images"
  ON public.gallery_images
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Policy: Only service role can update gallery images
DROP POLICY IF EXISTS "Service role can update gallery images" ON public.gallery_images;
CREATE POLICY "Service role can update gallery images"
  ON public.gallery_images
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Policy: Only service role can delete gallery images
DROP POLICY IF EXISTS "Service role can delete gallery images" ON public.gallery_images;
CREATE POLICY "Service role can delete gallery images"
  ON public.gallery_images
  FOR DELETE
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 6. STORAGE BUCKETS
-- ============================================

-- Create storage buckets (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'user-uploads',
    'user-uploads',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'generated-results',
    'generated-results',
    true,
    20971520, -- 20MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'shared-cards',
    'shared-cards',
    true,
    20971520, -- 20MB limit
    ARRAY['image/jpeg', 'image/jpg']
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------
-- Storage Policies: user-uploads (Private)
-- ---------------------------------------------

-- Policy: Users can upload to their own folder
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
CREATE POLICY "Users can upload to own folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can view their own uploads
DROP POLICY IF EXISTS "Users can view own uploads" ON storage.objects;
CREATE POLICY "Users can view own uploads"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own uploads
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
CREATE POLICY "Users can delete own uploads"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------
-- Storage Policies: generated-results (Public Read)
-- ---------------------------------------------

-- Policy: Anyone can view generated results (public bucket)
DROP POLICY IF EXISTS "Public can view generated results" ON storage.objects;
CREATE POLICY "Public can view generated results"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'generated-results');

-- Policy: Service role can insert generated results
DROP POLICY IF EXISTS "Service role can insert results" ON storage.objects;
CREATE POLICY "Service role can insert results"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-results' AND
    auth.jwt()->>'role' = 'service_role'
  );

-- Policy: Service role can delete generated results
DROP POLICY IF EXISTS "Service role can delete results" ON storage.objects;
CREATE POLICY "Service role can delete results"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'generated-results' AND
    auth.jwt()->>'role' = 'service_role'
  );

-- ---------------------------------------------
-- Storage Policies: shared-cards (Public Read)
-- ---------------------------------------------

-- Policy: Anyone can view share cards (public bucket)
DROP POLICY IF EXISTS "Public can view share cards" ON storage.objects;
CREATE POLICY "Public can view share cards"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'shared-cards');

-- Policy: Authenticated users can upload their own share cards
DROP POLICY IF EXISTS "Users can upload share cards" ON storage.objects;
CREATE POLICY "Users can upload share cards"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'shared-cards');

-- Policy: Service role can delete share cards
DROP POLICY IF EXISTS "Service role can delete share cards" ON storage.objects;
CREATE POLICY "Service role can delete share cards"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'shared-cards' AND
    auth.jwt()->>'role' = 'service_role'
  );

-- ============================================
-- 7. HELPER VIEWS (Optional but useful)
-- ============================================

-- View: User stats
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
  p.id,
  p.email,
  p.tier,
  p.credits,
  p.total_generations,
  COUNT(g.id) FILTER (WHERE g.status = 'succeeded') as successful_generations,
  COUNT(g.id) FILTER (WHERE g.status = 'failed') as failed_generations,
  COUNT(g.id) FILTER (WHERE g.status = 'processing') as pending_generations,
  MAX(g.created_at) as last_generation_at
FROM public.profiles p
LEFT JOIN public.generations g ON p.id = g.user_id
GROUP BY p.id, p.email, p.tier, p.credits, p.total_generations;

COMMENT ON VIEW public.user_stats IS 'Aggregated user statistics for admin dashboard';

-- ============================================
-- 8. INITIAL DATA (Optional - Sample Gallery)
-- ============================================

-- Insert sample gallery images (optional)
-- Uncomment to add initial gallery content
/*
INSERT INTO public.gallery_images (image_url, prompt_template, style_category, species, tags, is_featured)
VALUES
  (
    'https://example.com/dog-pixar.jpg',
    'A {species} in 3D Pixar animation style, colorful and playful',
    '3D Movie',
    'dog',
    ARRAY['3D', 'Pixar', 'Animated'],
    true
  ),
  (
    'https://example.com/cat-royal.jpg',
    'A majestic {species} in royal portrait style, oil painting',
    'Royal',
    'cat',
    ARRAY['Royal', 'Portrait', 'Classical'],
    true
  )
ON CONFLICT DO NOTHING;
*/

-- ============================================
-- 9. GRANTS (Ensure proper permissions)
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to tables
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.generations TO authenticated;
GRANT SELECT ON public.gallery_images TO anon, authenticated;

-- Grant access to views
GRANT SELECT ON public.user_stats TO authenticated;

-- Grant sequence usage (for auto-incrementing IDs if needed)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Verify the setup
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema setup complete!';
  RAISE NOTICE '📋 Tables created: profiles, generations, gallery_images';
  RAISE NOTICE '🔒 RLS policies enabled and configured';
  RAISE NOTICE '📦 Storage buckets: user-uploads (private), generated-results (public)';
  RAISE NOTICE '⚡ Triggers: Auto-create profile on signup, credit management';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Next steps:';
  RAISE NOTICE '1. Test user signup (should auto-create profile with 2 credits)';
  RAISE NOTICE '2. Test file upload to user-uploads bucket';
  RAISE NOTICE '3. Integrate with your Next.js app';
END $$;
