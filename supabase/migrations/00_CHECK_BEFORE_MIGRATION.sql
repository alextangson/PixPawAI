-- ============================================
-- Pre-Migration Check Script
-- ============================================
-- Run this FIRST to verify your database is ready
-- ============================================

-- Check if main tables exist
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles'
    ) THEN '✅ profiles table exists'
    ELSE '❌ profiles table MISSING - Run schema.sql first!'
  END as profiles_check,
  
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'generations'
    ) THEN '✅ generations table exists'
    ELSE '❌ generations table MISSING - Run schema.sql first!'
  END as generations_check;

-- If generations table exists, show its structure
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'generations'
  ) THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Generations table columns:';
    RAISE NOTICE '========================================';
  END IF;
END $$;

-- List all columns in generations table (if it exists)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'generations'
ORDER BY ordinal_position;

-- Check if required columns exist
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'generations' 
      AND column_name = 'is_public'
    ) THEN '✅ is_public column exists'
    ELSE '⚠️  is_public column missing - Migration will need to add it'
  END as is_public_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'generations' 
      AND column_name = 'views'
    ) THEN '✅ views column exists'
    ELSE '⚠️  views column missing - Check schema.sql'
  END as views_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'generations' 
      AND column_name = 'likes'
    ) THEN '✅ likes column exists'
    ELSE '⚠️  likes column missing - Check schema.sql'
  END as likes_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'generations' 
      AND column_name = 'quality_check'
    ) THEN '✅ quality_check column exists'
    ELSE '⚠️  quality_check column missing - Check schema.sql'
  END as quality_check_check;

-- Show count of public generations
DO $$
DECLARE
  pub_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'generations'
  ) THEN
    SELECT COUNT(*) INTO pub_count
    FROM public.generations
    WHERE is_public = true;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Found % public generations', pub_count;
    RAISE NOTICE '========================================';
  END IF;
EXCEPTION
  WHEN undefined_column THEN
    RAISE NOTICE '⚠️  is_public column does not exist yet';
END $$;
