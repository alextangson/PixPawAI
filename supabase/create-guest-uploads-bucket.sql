/**
 * Create guest-uploads Storage Bucket
 * 
 * Purpose: Store temporary uploaded files for Test Lab and guest users
 * 
 * Features:
 * - Public read access (for Qwen AI to analyze images)
 * - Service role can write/delete
 * - 10MB file size limit
 * - Automatic cleanup via Edge Function (when enabled)
 * 
 * Run in: Supabase Dashboard → SQL Editor
 */

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guest-uploads',
  'guest-uploads',
  true,  -- Public bucket (images need to be accessible via URL)
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for guest-uploads bucket
-- Policy 1: Anyone can read (needed for Qwen AI and image display)
CREATE POLICY "Public read access for guest uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'guest-uploads');

-- Policy 2: Service role can insert (admin uploads from Test Lab)
CREATE POLICY "Service role can upload to guest-uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'guest-uploads' 
  AND (auth.role() = 'service_role' OR auth.role() = 'authenticated')
);

-- Policy 3: Service role can delete (for cleanup)
CREATE POLICY "Service role can delete from guest-uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'guest-uploads' 
  AND auth.role() = 'service_role'
);

-- Verify bucket creation
SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 AS size_limit_mb,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'guest-uploads';

/**
 * Expected output:
 * 
 * id              | name           | public | size_limit_mb | allowed_mime_types
 * ----------------|----------------|--------|---------------|-------------------
 * guest-uploads   | guest-uploads  | true   | 10            | {image/jpeg,...}
 */
