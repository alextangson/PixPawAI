/**
 * Fix guest-uploads Bucket Public Access
 * 
 * Problem: Images upload successfully but return 404 when accessed
 * Cause: Bucket is not set as public OR missing public read policy
 * 
 * Run in: Supabase Dashboard → SQL Editor
 */

-- ============================================
-- 1. Make bucket public (if not already)
-- ============================================
UPDATE storage.buckets
SET public = true
WHERE id = 'guest-uploads';

-- Verify bucket is now public
SELECT 
  id,
  name,
  public AS is_public
FROM storage.buckets
WHERE id = 'guest-uploads';

-- ============================================
-- 2. Ensure public read policy exists
-- ============================================
-- Drop existing policy if it exists (to allow recreation)
DROP POLICY IF EXISTS "Public read access for guest uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow signed URL access" ON storage.objects;

-- Create new public read policy
CREATE POLICY "Public read access for guest uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'guest-uploads');

-- ============================================
-- 3. Verify policies
-- ============================================
SELECT 
  '=== VERIFICATION ===' AS section,
  policyname,
  cmd,
  'guest-uploads' AS bucket
FROM pg_policies
WHERE tablename = 'objects'
  AND cmd = 'SELECT'
  AND qual LIKE '%guest-uploads%';

-- ============================================
-- 4. Test URL generation
-- ============================================
-- This will show you what the public URL should look like
SELECT 
  '=== SAMPLE PUBLIC URL ===' AS section,
  name AS file_path,
  'https://' || 
    (SELECT current_setting('app.settings.supabase_url', true)) || 
    '/storage/v1/object/public/guest-uploads/' || 
    name AS public_url
FROM storage.objects
WHERE bucket_id = 'guest-uploads'
ORDER BY created_at DESC
LIMIT 1;

/**
 * Expected result:
 * 
 * After running this script:
 * 1. Bucket "guest-uploads" should show "is_public" = true
 * 2. Should see policy "Public read access for guest uploads"
 * 3. Public URLs should work in browser
 * 
 * Test: Copy the public_url from step 4 and open in browser
 *       → Should show the image, NOT a 404 error
 */
