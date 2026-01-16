-- ============================================
-- 第二步：添加 Share to Earn 功能所需的列
-- 在 Supabase SQL Editor 中运行（一次性全部复制粘贴）
-- ============================================

-- 添加 is_public 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN is_public BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added column: is_public';
  ELSE
    RAISE NOTICE 'Column already exists: is_public';
  END IF;
END $$;

-- 添加 title 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN title TEXT;
    RAISE NOTICE 'Added column: title';
  ELSE
    RAISE NOTICE 'Column already exists: title';
  END IF;
END $$;

-- 添加 alt_text 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'alt_text'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN alt_text TEXT;
    RAISE NOTICE 'Added column: alt_text';
  ELSE
    RAISE NOTICE 'Column already exists: alt_text';
  END IF;
END $$;

-- 添加 is_rewarded 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'is_rewarded'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN is_rewarded BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added column: is_rewarded';
  ELSE
    RAISE NOTICE 'Column already exists: is_rewarded';
  END IF;
END $$;

-- 添加 style_category 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'style_category'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN style_category TEXT;
    RAISE NOTICE 'Added column: style_category';
  ELSE
    RAISE NOTICE 'Column already exists: style_category';
  END IF;
END $$;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_generations_is_public 
ON public.generations(is_public) 
WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_generations_style_category 
ON public.generations(style_category);

-- 更新 RLS 策略：允许公开访问已分享的生成记录
DROP POLICY IF EXISTS "Public generations are viewable by everyone" ON public.generations;

CREATE POLICY "Public generations are viewable by everyone"
ON public.generations
FOR SELECT
USING (is_public = true);

-- 显示完成信息
DO $$
BEGIN
  RAISE NOTICE '✅ All columns and indexes created successfully!';
END $$;
