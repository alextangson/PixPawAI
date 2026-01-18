-- Create functions for incrementing views and likes in gallery
-- Migration: 20260118_increment_stats_functions
-- Purpose: Enable real-time stats tracking for public gallery images

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_views(generation_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE generations 
  SET views = views + 1 
  WHERE id = generation_uuid AND is_public = true
  RETURNING views INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment like count
CREATE OR REPLACE FUNCTION increment_likes(generation_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE generations 
  SET likes = likes + 1 
  WHERE id = generation_uuid AND is_public = true
  RETURNING likes INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated and anon users
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION increment_likes(UUID) TO authenticated, anon;

-- Add comments
COMMENT ON FUNCTION increment_views IS 'Increments view count for a public gallery image';
COMMENT ON FUNCTION increment_likes IS 'Increments like count for a public gallery image';

-- Test the functions (optional)
-- SELECT increment_views('your-generation-uuid-here');
-- SELECT increment_likes('your-generation-uuid-here');
