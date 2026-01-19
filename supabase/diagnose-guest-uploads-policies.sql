/**
 * Diagnose guest-uploads Bucket Policies
 * 
 * Purpose: Check current RLS policies for guest-uploads bucket
 * Run in: Supabase Dashboard → SQL Editor
 * 
 * This will show:
 * 1. Bucket configuration
 * 2. All policies for guest-uploads
 * 3. Specific INSERT policy details
 */

-- ============================================
-- 1. Check bucket configuration
-- ============================================
SELECT 
  '=== BUCKET INFO ===' AS section,
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 AS size_limit_mb,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'guest-uploads';

-- ============================================
-- 2. List all policies for guest-uploads
-- ============================================
SELECT 
  '=== ALL POLICIES ===' AS section,
  policyname,
  cmd AS command,
  CASE 
    WHEN qual LIKE '%anon%' THEN 'anon'
    WHEN qual LIKE '%authenticated%' THEN 'authenticated'
    WHEN qual LIKE '%service_role%' THEN 'service_role'
    WHEN qual LIKE '%public%' THEN 'public'
    ELSE 'unknown'
  END AS applied_to_from_qual,
  CASE 
    WHEN with_check LIKE '%anon%' THEN 'anon'
    WHEN with_check LIKE '%authenticated%' THEN 'authenticated'
    WHEN with_check LIKE '%service_role%' THEN 'service_role'
    WHEN with_check LIKE '%public%' THEN 'public'
    ELSE 'unknown'
  END AS applied_to_from_check
FROM pg_policies
WHERE tablename = 'objects'
  AND (qual LIKE '%guest-uploads%' OR with_check LIKE '%guest-uploads%')
ORDER BY cmd, policyname;

-- ============================================
-- 3. Detailed view of INSERT policies
-- ============================================
SELECT 
  '=== INSERT POLICY DETAILS ===' AS section,
  policyname,
  with_check AS policy_definition
FROM pg_policies
WHERE tablename = 'objects'
  AND cmd = 'INSERT'
  AND with_check LIKE '%guest-uploads%';

-- ============================================
-- 4. Check if service_role is supported
-- ============================================
SELECT 
  '=== SERVICE_ROLE CHECK ===' AS section,
  policyname,
  CASE 
    WHEN with_check LIKE '%service_role%' THEN '✅ service_role is supported'
    ELSE '❌ service_role NOT found'
  END AS status
FROM pg_policies
WHERE tablename = 'objects'
  AND cmd = 'INSERT'
  AND with_check LIKE '%guest-uploads%';

/**
 * Expected results guide:
 * 
 * If status shows "❌ service_role NOT found":
 *   → Need to add service_role support (use fix script)
 * 
 * If status shows "✅ service_role is supported":
 *   → Policies are correct, issue might be elsewhere
 */
