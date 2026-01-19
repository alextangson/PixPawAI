-- Fix style image paths to use correct 400x400 images from /styles/ folder
-- Run this in Supabase SQL Editor

UPDATE styles
SET preview_image_url = '/styles/Christmas-Vibe.jpg',
    updated_at = NOW()
WHERE id = 'Christmas-Vibe';

UPDATE styles
SET preview_image_url = '/styles/smart-casual.jpg',
    updated_at = NOW()
WHERE id = 'Smart-Casual';

UPDATE styles
SET preview_image_url = '/styles/birthday-party.jpg',
    updated_at = NOW()
WHERE id = 'Birthday-Party';

UPDATE styles
SET preview_image_url = '/styles/music-lover.jpg',
    updated_at = NOW()
WHERE id = 'Music-Lover';

UPDATE styles
SET preview_image_url = '/styles/Pop-Art.jpg',
    updated_at = NOW()
WHERE id = 'Retro-Pop-Art';

-- Verify the changes
SELECT 
    id, 
    name, 
    preview_image_url,
    is_enabled,
    sort_order
FROM styles 
WHERE is_enabled = true
ORDER BY sort_order;
