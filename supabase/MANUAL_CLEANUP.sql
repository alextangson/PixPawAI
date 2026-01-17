/**
 * Manual Guest Uploads Cleanup
 * 
 * Use this for MVP stage instead of automated Edge Function
 * Run periodically (weekly or monthly) in Supabase SQL Editor
 * 
 * Recommended: Set a calendar reminder to run this monthly
 */

-- ============================================
-- OPTION 1: Dry run (check before deleting)
-- ============================================

SELECT 
  COUNT(*) as files_to_delete,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) as total_size
FROM storage.objects 
WHERE bucket_id = 'guest-uploads' 
AND created_at < NOW() - INTERVAL '7 days';

-- ============================================
-- OPTION 2: Delete files older than 7 days
-- ============================================

DELETE FROM storage.objects 
WHERE bucket_id = 'guest-uploads' 
AND created_at < NOW() - INTERVAL '7 days';

-- ============================================
-- OPTION 3: Delete files older than 30 days
-- ============================================

-- DELETE FROM storage.objects 
-- WHERE bucket_id = 'guest-uploads' 
-- AND created_at < NOW() - INTERVAL '30 days';

-- ============================================
-- OPTION 4: View storage usage
-- ============================================

SELECT 
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) as total_size,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM storage.objects 
WHERE bucket_id IN ('guest-uploads', 'user-uploads')
GROUP BY bucket_id;

-- ============================================
-- NOTES
-- ============================================
-- 
-- When to run:
-- - Weekly if you remember
-- - Monthly minimum
-- - Or when you notice storage usage increasing in Supabase Dashboard
--
-- When to deploy automated cleanup:
-- - Daily guest uploads > 100
-- - Monthly storage cost > $1
-- - Files: supabase/functions/cleanup-guest-uploads/
