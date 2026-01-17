-- ============================================
-- Add DELETE policy for generations table
-- Purpose: Ensure users can delete their own generations
-- Created: 2026-01-17
-- ============================================

-- Policy: Users can delete their own generations
DROP POLICY IF EXISTS "Users can delete own generations" ON public.generations;
CREATE POLICY "Users can delete own generations"
  ON public.generations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE '✅ DELETE policy added successfully!';
  RAISE NOTICE 'ℹ️  Users can now delete their own generations';
END $$;
