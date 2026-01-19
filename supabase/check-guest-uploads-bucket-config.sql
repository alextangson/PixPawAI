/**
 * Check guest-uploads Bucket Configuration
 * 
 * Purpose: Diagnose why uploaded images return 404
 * Run in: Supabase Dashboard → SQL Editor
 */

-- ============================================
-- 1. Check if bucket exists and is public
-- ============================================
SELECT 
  '=== BUCKET CONFIGURATION ===' AS section,
  id,
  name,
  public AS is_public,
  file_size_limit / 1024 / 1024 AS size_limit_mb,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'guest-uploads';

-- ============================================
-- 2. Check if files exist in the bucket
-- ============================================
SELECT 
  '=== FILES IN BUCKET ===' AS section,
  COUNT(*) AS total_files,
  MAX(created_at) AS latest_upload
FROM storage.objects
WHERE bucket_id = 'guest-uploads';

-- ============================================
-- 3. Check latest uploaded file details
-- ============================================
SELECT 
  '=== LATEST UPLOADED FILE ===' AS section,
  name,
  bucket_id,
  created_at,
  (metadata->>'size')::bigint / 1024 AS size_kb,
  metadata->>'mimetype' AS mime_type
FROM storage.objects
WHERE bucket_id = 'guest-uploads'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- 4. Check SELECT policies (for public read)
-- ============================================
SELECT 
  '=== SELECT POLICIES (READ ACCESS) ===' AS section,
  policyname,
  cmd,
  qual AS policy_definition
FROM pg_policies
WHERE tablename = 'objects'
  AND cmd = 'SELECT'
  AND (qual LIKE '%guest-uploads%' OR with_check LIKE '%guest-uploads%');

/**
 * Expected results:
 * 
 * 1. Bucket should exist with "is_public" = true
 * 2. Files should exist with recent uploads
 * 3. Should have a SELECT policy for public read access
 * 
 * If "is_public" = false:
 *   → Need to make bucket public
 * 
 * If no SELECT policy:
 *   → Need to add public read policy
 */
