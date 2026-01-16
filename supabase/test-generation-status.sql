-- Test query to check generation status
-- Run this in Supabase SQL Editor to debug

-- Check recent generations
SELECT 
  id,
  user_id,
  status,
  style,
  style_category,
  is_public,
  is_rewarded,
  output_url IS NOT NULL as has_output,
  created_at
FROM public.generations
ORDER BY created_at DESC
LIMIT 10;

-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'generations' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
