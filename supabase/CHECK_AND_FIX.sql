-- ============================================
-- 检查并修复 Supabase 数据库
-- 在 Supabase SQL Editor 中运行这个脚本
-- ============================================

-- ============================================
-- 第一步：检查 generations 表的列
-- ============================================
DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '第一步：检查 generations 表结构';
  RAISE NOTICE '════════════════════════════════════════════════════';
  
  -- 检查必需的列
  SELECT ARRAY_AGG(col)
  INTO missing_columns
  FROM (
    SELECT unnest(ARRAY[
      'is_public',
      'title',
      'alt_text',
      'is_rewarded',
      'style_category',
      'metadata',
      'views',
      'likes',
      'share_card_url'
    ]) AS col
  ) required_cols
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'generations'
      AND column_name = col
      AND table_schema = 'public'
  );

  IF missing_columns IS NULL OR array_length(missing_columns, 1) IS NULL THEN
    RAISE NOTICE '✅ 所有列都存在！不需要添加列。';
  ELSE
    RAISE NOTICE '⚠️  缺少以下列：%', array_to_string(missing_columns, ', ');
    RAISE NOTICE '   → 请运行下面的 "修复脚本"';
  END IF;
END $$;

-- ============================================
-- 第二步：检查 increment_credits 函数
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '第二步：检查 increment_credits 函数';
  RAISE NOTICE '════════════════════════════════════════════════════';
  
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'increment_credits'
  ) THEN
    RAISE NOTICE '✅ increment_credits 函数已存在！';
  ELSE
    RAISE NOTICE '❌ increment_credits 函数不存在！';
    RAISE NOTICE '   → 这个函数是 CRITICAL，必须创建！';
    RAISE NOTICE '   → 请运行下面的 "修复脚本"';
  END IF;
END $$;

-- ============================================
-- 第三步：检查 shared-cards 存储桶
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '第三步：检查 shared-cards 存储桶';
  RAISE NOTICE '════════════════════════════════════════════════════';
  
  IF EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'shared-cards'
  ) THEN
    RAISE NOTICE '✅ shared-cards 存储桶已存在！';
  ELSE
    RAISE NOTICE '⚠️  shared-cards 存储桶不存在！';
    RAISE NOTICE '   → 请运行下面的 "修复脚本"';
  END IF;
END $$;

-- ============================================
-- 总结
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '检查完成！请查看上面的结果';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '如果看到 ❌ 或 ⚠️，请继续运行下面的修复脚本。';
  RAISE NOTICE '如果全是 ✅，那么你的数据库已经是最新的，不需要任何操作！';
END $$;

-- ============================================
-- 修复脚本（如果上面检查发现问题，取消下面的注释并运行）
-- ============================================

/*
-- 修复 1: 添加缺失的列（如果有）
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS alt_text TEXT,
ADD COLUMN IF NOT EXISTS is_rewarded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS style_category TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_card_url TEXT;

-- 修复 2: 创建 increment_credits 函数（CRITICAL!）
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

-- 修复 3: 创建 shared-cards 存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared-cards', 'shared-cards', true)
ON CONFLICT (id) DO NOTHING;

-- 存储桶策略
DROP POLICY IF EXISTS "Public can view share cards" ON storage.objects;
CREATE POLICY "Public can view share cards"
ON storage.objects
FOR SELECT
USING (bucket_id = 'shared-cards');

DROP POLICY IF EXISTS "Users can upload share cards" ON storage.objects;
CREATE POLICY "Users can upload share cards"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shared-cards');

DROP POLICY IF EXISTS "Service role can delete share cards" ON storage.objects;
CREATE POLICY "Service role can delete share cards"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'shared-cards' AND
  auth.jwt()->>'role' = 'service_role'
);

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ 所有修复已应用！';
  RAISE NOTICE '📋 已添加：increment_credits 函数';
  RAISE NOTICE '📦 已创建：shared-cards 存储桶';
  RAISE NOTICE '🔒 已配置：存储桶访问策略';
  RAISE NOTICE '';
  RAISE NOTICE '现在可以部署前端代码了！';
END $$;
*/
