-- Add share_card_url column to generations table
-- This stores the branded Leica-style card URL for each shared generation

ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS share_card_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_generations_share_card_url 
ON public.generations(share_card_url) 
WHERE share_card_url IS NOT NULL;

-- Comment
COMMENT ON COLUMN public.generations.share_card_url IS 'URL of the branded Leica/Polaroid-style share card for social media';
