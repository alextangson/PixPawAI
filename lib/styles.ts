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
  },
  // ============================================
  // New Styles - Added 2026-01-20
  // ============================================
  {
    id: 'bordeaux-muse',
    label: 'Bordeaux Muse',
    src: '/styles/bordeaux-muse.jpg',
    promptSuffix: ', wearing a sophisticated burgundy beret hat and a luxurious black ribbed turtleneck sweater, elegant pearl necklace with decorative gold pendant, professional magazine cover portrait, SOLID DEEP BURGUNDY RED BACKGROUND, RICH RED STUDIO BACKDROP, monochromatic burgundy color theme, centered frontal pose, dramatic studio lighting, Harper\'s Bazaar Pets magazine editorial style, ultra-realistic commercial photography, CRISP SHARP FOCUS, high-definition details, sophisticated premium luxury aesthetic, 8k ultra high resolution',
    description: 'Elegant burgundy-themed fashion portrait - beret, turtleneck, pearls'
  },
  {
    id: 'emerald-muse',
    label: 'Emerald Muse',
    src: '/styles/emerald-muse.jpg',
    promptSuffix: ', wearing a chic sage green beret hat and a soft olive green cashmere scarf, antique jade necklace with brass pendant, professional fashion portrait, SOLID MUTED SAGE GREEN BACKGROUND, SOFT OLIVE GREEN STUDIO BACKDROP, SOPHISTICATED GREEN SETTING, refined green monochromatic palette, matte sophisticated finish, centered composition, Harper\'s Bazaar vintage editorial style, ultra-realistic commercial photography, SHARP FOCUS, understated elegance, premium muted aesthetic, 8k resolution',
    description: 'Elegant sage green fashion portrait - beret, cashmere scarf, jade necklace'
  },
  {
    id: 'magazine-chic',
    label: 'Magazine Chic',
    src: '/styles/magazine-chic.jpg',
    promptSuffix: ', elegantly dressed as a fashion photographer, wearing stylish oversized designer sunglasses and a luxurious textured blazer or knit jacket, silk scarf or neck accessory with decorative jewelry brooch, holding a vintage leather-wrapped camera, professional low-angle fashion portrait, warm creamy beige or neutral background, soft golden studio lighting, warm color palette throughout, vogue magazine editorial style, ultra-realistic commercial photography, rich luxurious textures, sophisticated and elegant, sharp focus, 8k resolution',
    description: 'High-end fashion magazine style with designer accessories and warm studio lighting'
  },
  {
    id: 'wes-anderson-pop',
    label: 'Wes Anderson Pop',
    src: '/styles/wes-anderson-pop.jpg',
    promptSuffix: ', symmetrical fashion editorial portrait, anthropomorphically dressed in glossy bright vivid clothing with bold colors, wearing oversized translucent sunglasses, wearing a matching bucket hat or cap, clean solid vivid background with strong color contrast, Wes Anderson cinematic style, strong color blocking, pop art aesthetic, geometric composition, soft even studio lighting, sharp focus, highly detailed, vibrant colors',
    description: 'Wes Anderson-inspired pop art with bold colors and symmetrical composition'
  },
  {
    id: 'birthday-celebration',
    label: 'Birthday Celebration',
    src: '/styles/birthday-celebration.jpg',
    promptSuffix: ', celebrating a joyful birthday party, wearing a vibrant rainbow-colored striped party hat and a festive colorful bow tie around the neck, sweet cheerful expression with closed mouth and happy eyes, sitting behind a beautiful birthday cake with lit candles on a golden cake stand, festive party scene with floating soft pink and peach balloons in the background, hanging golden yellow party streamers cascading from above, colorful bunting flags strung across, scattered warm-toned confetti on the table surface, wrapped pastel gift boxes with satin ribbons nearby, twinkling warm string lights creating bokeh, warm indoor lighting with golden amber glow, WARM PEACHY PINK AMBIENT ATMOSPHERE, cozy cheerful celebration, professional party photography, 8k resolution',
    description: 'Warm festive birthday with decorative elements - party hat, bow tie, cake'
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
