-- =============================================
-- Migration: Remove Unused Fields
-- Date: 2026-01-20
-- Purpose: Clean up deprecated tier system and emoji
-- =============================================

-- Step 1: Remove fields from styles table
ALTER TABLE styles DROP COLUMN IF EXISTS tier;
ALTER TABLE styles DROP COLUMN IF EXISTS expected_similarity;
ALTER TABLE styles DROP COLUMN IF EXISTS recommended_strength_max;
ALTER TABLE styles DROP COLUMN IF EXISTS emoji;

COMMENT ON TABLE styles IS 'Style definitions with database-driven parameters (tier system removed 2026-01-20)';

-- Step 2: Remove fields from style_versions table
ALTER TABLE style_versions DROP COLUMN IF EXISTS tier;
ALTER TABLE style_versions DROP COLUMN IF EXISTS expected_similarity;
ALTER TABLE style_versions DROP COLUMN IF EXISTS recommended_strength_max;
ALTER TABLE style_versions DROP COLUMN IF EXISTS emoji;

-- Step 3: Verify remaining columns
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'styles'
    AND column_name IN ('tier', 'expected_similarity', 'recommended_strength_max', 'emoji');
    
    IF col_count > 0 THEN
        RAISE EXCEPTION 'Failed to remove all deprecated columns! % columns remain', col_count;
    ELSE
        RAISE NOTICE '✅ Successfully removed all deprecated columns from styles and style_versions';
    END IF;
END $$;

-- Step 4: Display final schema
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'styles'
ORDER BY ordinal_position;
