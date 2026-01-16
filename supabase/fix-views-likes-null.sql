-- ============================================
-- Fix NULL views and likes values
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Update all NULL views to 0
UPDATE public.generations 
SET views = 0 
WHERE views IS NULL;

-- 2. Update all NULL likes to 0
UPDATE public.generations 
SET likes = 0 
WHERE likes IS NULL;

-- 3. Ensure default values are set for future records
ALTER TABLE public.generations 
ALTER COLUMN views SET DEFAULT 0;

ALTER TABLE public.generations 
ALTER COLUMN likes SET DEFAULT 0;

-- 4. Set NOT NULL constraint (optional, for data integrity)
ALTER TABLE public.generations 
ALTER COLUMN views SET NOT NULL;

ALTER TABLE public.generations 
ALTER COLUMN likes SET NOT NULL;

-- 5. Verify the fix
SELECT 
  id, 
  title,
  status,
  is_public,
  views,
  likes,
  created_at
FROM public.generations
ORDER BY created_at DESC
LIMIT 10;
