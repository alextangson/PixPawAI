-- Add storage_path columns to generations table
-- These columns store the file paths for easy deletion from Supabase Storage

-- Check if columns exist and add them if missing
DO $$ 
BEGIN
    -- Add output_storage_path if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generations' 
        AND column_name = 'output_storage_path'
    ) THEN
        ALTER TABLE public.generations 
        ADD COLUMN output_storage_path TEXT;
        RAISE NOTICE 'Added output_storage_path column';
    ELSE
        RAISE NOTICE 'output_storage_path column already exists';
    END IF;

    -- Add input_storage_path if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generations' 
        AND column_name = 'input_storage_path'
    ) THEN
        ALTER TABLE public.generations 
        ADD COLUMN input_storage_path TEXT;
        RAISE NOTICE 'Added input_storage_path column';
    ELSE
        RAISE NOTICE 'input_storage_path column already exists';
    END IF;

    -- Add share_card_storage_path if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generations' 
        AND column_name = 'share_card_storage_path'
    ) THEN
        ALTER TABLE public.generations 
        ADD COLUMN share_card_storage_path TEXT;
        RAISE NOTICE 'Added share_card_storage_path column';
    ELSE
        RAISE NOTICE 'share_card_storage_path column already exists';
    END IF;
END $$;

-- Create index for faster queries on storage paths
CREATE INDEX IF NOT EXISTS idx_generations_output_storage_path 
ON public.generations(output_storage_path);

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'generations' 
    AND column_name IN ('output_storage_path', 'input_storage_path', 'share_card_storage_path')
ORDER BY column_name;
