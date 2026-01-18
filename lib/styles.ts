/**
 * Style Configuration for AI Pet Portraits
 * Each style includes a unique prompt suffix for Replicate API
 */

export interface Style {
  id: string
  label: string
  src: string
  promptSuffix: string
  description?: string
}

export const STYLES: Style[] = [
  // ============================================
  // High-Quality Styles (Quality-Tested 2026-01-18)
  // Only styles that passed user validation
  // ============================================
  {
    id: 'Christmas-Vibe',
    label: 'Merry Christmas',
    src: '/styles/Christmas-Vibe.jpg',
    promptSuffix: ', wearing a fluffy red and white Santa hat, festive holiday spirit, bright joyful eyes, solid bold red background, high-end commercial photography, clean composition, warm and cheerful atmosphere, 8k resolution.',
    description: 'Festive holiday look with a classic Santa hat'
  },
  {
    id: 'Smart-Casual',
    label: 'Smart Casual',
    src: '/styles/smart-casual.jpg',
    promptSuffix: ', wearing a cozy textured turtleneck sweater and a herringbone newsboy flat cap, professional pet photography, solid warm background, sharp focus on eyes, clean and stylish modern aesthetic.',
    description: 'Trendy look with a sweater and newsboy cap'
  },
  {
    id: 'Birthday-Party',
    label: 'Birthday Party',
    src: '/styles/birthday-party.jpg',
    promptSuffix: ', celebrating a birthday, wearing a colorful striped party hat, sitting behind a vibrant birthday cake with a burning candle, blurred party background with balloons and fairy lights, warm indoor lighting, joyful celebration.',
    description: 'Cheerful birthday celebration with cake and hat'
  },
  {
    id: 'Music-Lover',
    label: 'Music Lover',
    src: '/styles/music-lover.jpg',
    promptSuffix: ', wearing professional silver wired headphones around the neck, studio portrait, deep blue textured background, cinematic rim lighting, crisp fur details, cool and contemporary vibe, high-quality photography.',
    description: 'Cool studio portrait with silver headphones'
  },
  {
    id: 'Retro-Pop-Art',
    label: 'Retro Pop Art',
    src: '/styles/Pop-Art.jpg',
    promptSuffix: ', bold geometric shapes and flat color blocks, mid-century modern illustration style, vibrant contrasting colors, simplified features, clean outlines, playful and energetic composition, vintage poster aesthetic with subtle paper texture, trendy and eye-catching design',
    description: 'Bold retro poster with geometric shapes'
  }
]

/**
 * Get style by ID
 */
export function getStyleById(id: string): Style | undefined {
  return STYLES.find(style => style.id === id)
}

/**
 * Get style label by ID
 */
export function getStyleLabel(id: string): string {
  return getStyleById(id)?.label || id
}
