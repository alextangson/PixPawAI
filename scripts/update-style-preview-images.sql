-- ============================================
-- Update Style Preview Images
-- Fix image paths to use correct 400x400 images from /styles/ folder
-- ============================================

-- Update Christmas Vibe
UPDATE styles 
SET preview_image_url = '/styles/Christmas-Vibe.jpg', 
    updated_at = NOW() 
WHERE id = 'Christmas-Vibe';

-- Update Smart Casual
UPDATE styles 
SET preview_image_url = '/styles/smart-casual.jpg', 
    updated_at = NOW() 
WHERE id = 'Smart-Casual';

-- Update Birthday Party
UPDATE styles 
SET preview_image_url = '/styles/birthday-party.jpg', 
    updated_at = NOW() 
WHERE id = 'Birthday-Party';

-- Update Music Lover
UPDATE styles 
SET preview_image_url = '/styles/music-lover.jpg', 
    updated_at = NOW() 
WHERE id = 'Music-Lover';

-- Update Retro Pop Art
UPDATE styles 
SET preview_image_url = '/styles/Pop-Art.jpg', 
    updated_at = NOW() 
WHERE id = 'Retro-Pop-Art';

-- ============================================
-- Verify the updates
-- ============================================
SELECT 
  id,
  name,
  preview_image_url,
  is_enabled,
  sort_order
FROM styles 
WHERE is_enabled = true 
ORDER BY sort_order;

-- ============================================
-- Summary
-- ============================================
SELECT 
  COUNT(*) as total_enabled_styles,
  COUNT(CASE WHEN preview_image_url LIKE '/styles/%' THEN 1 END) as styles_with_correct_path
FROM styles 
WHERE is_enabled = true;
