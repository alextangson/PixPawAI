-- ============================================
-- Migration: Add Missing Fields & Features
-- ============================================
-- 这个脚本会添加缺失的字段和功能，不会影响现有数据
-- 运行前请确保您已经创建了基础表结构
-- ============================================

-- ============================================
-- 1. 更新 PROFILES 表 - 添加缺失字段
-- ============================================

-- 添加 full_name 字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;
END $$;

-- 添加 avatar_url 字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 添加 total_generations 字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'total_generations'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN total_generations INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 添加 updated_at 字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- 添加索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON public.profiles(tier);

-- 添加表注释
COMMENT ON TABLE public.profiles IS 'User profiles with credits and subscription tier';
COMMENT ON COLUMN public.profiles.credits IS 'Available generation credits (2 free on signup)';
COMMENT ON COLUMN public.profiles.tier IS 'Subscription tier: free, starter, or pro';

-- ============================================
-- 2. 更新 GENERATIONS 表 - 添加缺失字段
-- ============================================

-- 添加 style_category 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'style_category'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN style_category TEXT;
  END IF;
END $$;

-- 添加 model_used 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'model_used'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN model_used TEXT;
  END IF;
END $$;

-- 添加 negative_prompt 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'negative_prompt'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN negative_prompt TEXT;
  END IF;
END $$;

-- 添加 seed 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'seed'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN seed INTEGER;
  END IF;
END $$;

-- 添加 cfg_scale 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'cfg_scale'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN cfg_scale NUMERIC(3,1);
  END IF;
END $$;

-- 添加 num_inference_steps 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'num_inference_steps'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN num_inference_steps INTEGER;
  END IF;
END $$;

-- 添加 is_public 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 添加 metadata 字段 (JSONB)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- 添加 error_message 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN error_message TEXT;
  END IF;
END $$;

-- 添加 updated_at 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON public.generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_public ON public.generations(is_public) WHERE is_public = true;

-- ============================================
-- 3. 创建 GALLERY_IMAGES 表（全新）
-- ============================================

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  style_category TEXT NOT NULL,
  prompt_template TEXT,
  species TEXT,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_gallery_style_category ON public.gallery_images(style_category);
CREATE INDEX IF NOT EXISTS idx_gallery_species ON public.gallery_images(species);
CREATE INDEX IF NOT EXISTS idx_gallery_is_featured ON public.gallery_images(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON public.gallery_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_tags ON public.gallery_images USING GIN(tags);

COMMENT ON TABLE public.gallery_images IS 'Public gallery of curated pet portraits';

-- ============================================
-- 4. 更新函数 - handle_new_user
-- ============================================

-- 更新函数以包含新字段
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Creates or updates profile when a new user signs up';

-- ============================================
-- 5. 新增函数 - update_updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at IS 'Updates the updated_at timestamp on row modification';

-- ============================================
-- 6. 新增函数 - decrement_credits
-- ============================================

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

-- ============================================
-- 7. 新增函数 - increment_generation_count
-- ============================================

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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.increment_generation_count IS 'Increments user generation count on success';

-- ============================================
-- 8. 添加新触发器
-- ============================================

-- Trigger: Update updated_at on profile changes
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger: Update updated_at on generation changes
DROP TRIGGER IF EXISTS on_generation_updated ON public.generations;
CREATE TRIGGER on_generation_updated
  BEFORE UPDATE ON public.generations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger: Increment generation count on success
DROP TRIGGER IF EXISTS on_generation_succeeded ON public.generations;
CREATE TRIGGER on_generation_succeeded
  AFTER INSERT OR UPDATE ON public.generations
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_generation_count();

-- Trigger: Update updated_at on gallery changes
DROP TRIGGER IF EXISTS on_gallery_updated ON public.gallery_images;
CREATE TRIGGER on_gallery_updated
  BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 9. 添加 RLS 策略到新表
-- ============================================

-- Enable RLS on gallery (if not already enabled)
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Gallery is publicly viewable
DROP POLICY IF EXISTS "Gallery is publicly viewable" ON public.gallery_images;
CREATE POLICY "Gallery is publicly viewable"
  ON public.gallery_images FOR SELECT
  USING (true);

-- Only admins can manage gallery (via service role)
DROP POLICY IF EXISTS "Service role can manage gallery" ON public.gallery_images;
CREATE POLICY "Service role can manage gallery"
  ON public.gallery_images FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 10. 更新现有用户数据（回填）
-- ============================================

-- 为现有用户从 auth.users 回填 full_name 和 avatar_url
UPDATE public.profiles p
SET 
  full_name = COALESCE(p.full_name, u.raw_user_meta_data->>'full_name'),
  avatar_url = COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url')
FROM auth.users u
WHERE p.id = u.id 
  AND (p.full_name IS NULL OR p.avatar_url IS NULL);

-- ============================================
-- 完成！
-- ============================================

-- 验证设置
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE 'Tables updated: profiles, generations';
  RAISE NOTICE 'New table created: gallery_images';
  RAISE NOTICE 'Functions added: update_updated_at, decrement_credits, increment_generation_count';
  RAISE NOTICE 'Triggers updated: on_profile_updated, on_generation_updated, on_generation_succeeded, on_gallery_updated';
END $$;
