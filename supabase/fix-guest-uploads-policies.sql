/**
 * Fix guest-uploads Policies for Test Lab
 * 
 * Purpose: Add service_role support to guest-uploads bucket
 * Strategy: Add a new policy without removing existing ones
 * 
 * ⚠️ ONLY RUN THIS IF diagnose script shows "service_role NOT found"
 * 
 * Run in: Supabase Dashboard → SQL Editor
 */

-- ============================================
-- Add Test Lab service_role upload policy
-- ============================================
-- This adds support for Test Lab uploads without affecting guest uploads

-- First, drop if exists (to allow re-running this script)
DROP POLICY IF EXISTS "Test Lab service role uploads" ON storage.objects;

-- Create the policy
CREATE POLICY "Test Lab service role uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'guest-uploads' 
  AND auth.role() = 'service_role'
);

-- ============================================
-- Verify the new policy was created
-- ============================================
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN with_check LIKE '%service_role%' THEN '✅ service_role supported'
    ELSE '❌ NOT found'
  END AS status
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname = 'Test Lab service role uploads';

-- ============================================
-- List all INSERT policies for guest-uploads
-- ============================================
SELECT 
  '=== ALL INSERT POLICIES ===' AS info,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND cmd = 'INSERT'
  AND with_check LIKE '%guest-uploads%'
ORDER BY policyname;

/**
 * Expected result:
 * 
 * You should see 2 INSERT policies:
 * 1. "Allow anonymous uploads" (for guests)
 * 2. "Test Lab service role uploads" (for admin/test lab)
 * 
 * Both policies work independently and don't conflict.
 */
