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
  {
    id: 'Johannes Vermeer',
    label: 'Johannes Vermeer',
    src: 'johannes-vermeer.png',
    promptSuffix: 'wearing a blue and yellow turban headscarf and a large pearl earring, in the style of Johannes Vermeer masterpiece "Girl with a Pearl Earring", classical oil painting, soft natural window light from the left, chiaroscuro, detailed brushstrokes, rich colors, baroque art style, high quality',
    description: 'Classic Dutch Golden Age painting style'
  },
  {
    id: 'Victorian-Royal',
    label: 'Royal Portrait',
    src: 'iShot_2026-01-16_15.16.00.png',
    promptSuffix: ', as a majestic royal monarch, wearing an intricate golden crown with red rubies, a luxurious purple velvet robe with ermine fur collar, holding a golden scepter, classical oil painting style, dark moody studio background, dramatic masterpiece, regal and dignified atmosphere.',
    description: 'Regal royal portrait with crown and velvet robes'
  },
  {
    id: 'Christmas-Vibe',
    label: 'Merry Christmas',
    src: 'iShot_2026-01-16_15.15.27.png',
    promptSuffix: ', wearing a fluffy red and white Santa hat, festive holiday spirit, soft white fur texture, bright joyful eyes, solid bold red background, high-end commercial photography, clean composition, warm and cheerful atmosphere, 8k resolution.',
    description: 'Festive holiday look with a classic Santa hat'
  },
  {
    id: 'Vintage-Traveler',
    label: 'Vintage Traveler',
    src: 'iShot_2026-01-16_15.15.06.png',
    promptSuffix: ', dressed in a Victorian gentleman suit with a black top hat and gold bow tie, riding in an ornate hot air balloon basket, surrounded by colorful hot air balloons and flowers in the sky, whimsical steampunk aesthetic, oil painting style, soft dreamy sunset lighting.',
    description: 'Whimsical adventure in a vintage hot air balloon'
  },
  {
    id: 'Flower-Crown',
    label: 'Floral Elegance',
    src: 'iShot_2026-01-16_15.14.51.png',
    promptSuffix: ', wearing a lush crown of white and pink peonies and wildflowers, classical fine art oil painting, soft chiaroscuro lighting, textured canvas effect, romantic and peaceful mood, detailed floral elements, museum quality.',
    description: 'Elegant portrait with a beautiful floral crown'
  },
  {
    id: 'Smart-Casual',
    label: 'Smart Casual',
    src: 'iShot_2026-01-16_15.15.47.png',
    promptSuffix: ', wearing a cozy textured orange turtleneck sweater and a grey herringbone newsboy flat cap, professional pet photography, solid olive green background, sharp focus on eyes, clean and stylish modern aesthetic.',
    description: 'Trendy look with a sweater and newsboy cap'
  },
  {
    id: 'Embroidery-Art',
    label: 'Embroidery Art',
    src: 'iShot_2026-01-16_15.17.04.png',
    promptSuffix: ', created entirely with colorful embroidery thread, textured needlework art, 3D stitched texture, vibrant wool yarn details, handcrafted folk art style, intricate embroidery patterns, unique textile aesthetic.',
    description: 'Unique handcrafted look made of embroidery thread'
  },
  {
    id: 'Birthday-Party',
    label: 'Birthday Party',
    src: 'iShot_2026-01-16_15.16.22.png',
    promptSuffix: ', celebrating a birthday, wearing a colorful striped party hat, sitting behind a vibrant yellow and pink birthday cake with a burning candle, blurred party background with balloons and fairy lights, warm indoor lighting, joyful celebration.',
    description: 'Cheerful birthday celebration with cake and hat'
  },
  {
    id: 'Music-Lover',
    label: 'Music Lover',
    src: 'iShot_2026-01-16_15.17.26.png',
    promptSuffix: ', wearing professional silver wired headphones around the neck, studio portrait, deep blue textured background, cinematic rim lighting, crisp fur details, cool and contemporary vibe, high-quality photography.',
    description: 'Cool studio portrait with silver headphones'
  },
  {
    id: 'Fine-Sketch',
    label: 'Master Sketch',
    src: 'iShot_2026-01-16_15.14.43.png',
    promptSuffix: ', ultra-detailed charcoal and graphite pencil sketch, high contrast black and white art, meticulous line work, realistic fur texture, clean white background, artistic hand-drawn masterpiece, fine art gallery style.',
    description: 'Highly detailed black and white pencil drawing'
  },
  
  // ============================================
  // MVP Test Styles (Added 2026-01-17)
  // Each Tier has one representative style
  // ============================================
  
  {
    id: 'Spring-Vibes',
    label: 'Spring Vibes',
    src: 'spring-vibes.png',
    promptSuffix: ', surrounded by soft pink cherry blossom petals gently falling in the air, dreamy spring atmosphere, pastel pink and white color palette, soft bokeh background with blurred flowers, natural soft lighting, professional pet photography, clean and fresh aesthetic, sharp focus on face, warm and cheerful spring mood, high-quality 8k resolution',
    description: 'Dreamy spring atmosphere with cherry blossoms'
  },
  {
    id: 'Retro-Pop-Art',
    label: 'Retro Pop Art',
    src: 'retro-pop-art.png',
    promptSuffix: ', bold geometric shapes and flat color blocks, mid-century modern illustration style, vibrant contrasting colors (yellow, orange, blue, red), simplified features, clean outlines, playful and energetic composition, vintage poster aesthetic with subtle paper texture, trendy and eye-catching design',
    description: 'Bold retro poster with geometric shapes'
  },
  {
    id: 'Watercolor-Dream',
    label: 'Watercolor Dream',
    src: 'watercolor-dream.png',
    promptSuffix: ', soft transparent watercolor painting, flowing brush strokes with visible water stains, delicate color bleeding and gradients, loose expressive style, textured watercolor paper background, gentle pastel colors, artistic and dreamy atmosphere, hand-painted illustration feel, elegant and serene mood',
    description: 'Soft watercolor painting with flowing strokes'
  },
  {
    id: 'Pixel-Mosaic',
    label: 'Pixel Mosaic',
    src: 'pixel-mosaic.png',
    promptSuffix: ', 8-bit pixel art style, retro video game aesthetic, square pixel grid pattern, limited color palette with solid blocks, nostalgic 90s game character design, sharp edges and geometric pixelation, bright vibrant colors, cute and playful vibe, classic arcade game art',
    description: 'Retro 8-bit pixel art style'
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
