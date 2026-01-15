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
    src: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop',
    promptSuffix: 'wearing a blue and yellow turban headscarf and a large pearl earring, in the style of Johannes Vermeer masterpiece "Girl with a Pearl Earring", classical oil painting, soft natural window light from the left, chiaroscuro, detailed brushstrokes, rich colors, baroque art style, high quality',
    description: 'Futuristic neon aesthetic with cyberpunk vibes'
  },
  {
    id: 'anime',
    label: 'Anime',
    src: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=400&fit=crop',
    promptSuffix: 'anime style, Studio Ghibli inspired, soft cel-shaded, big expressive eyes, colorful and whimsical, Japanese animation art',
    description: 'Cute anime style inspired by Studio Ghibli'
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    src: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop',
    promptSuffix: 'watercolor painting style, soft pastel colors, artistic brush strokes, dreamy and ethereal, hand-painted texture, fine art',
    description: 'Soft watercolor painting with pastel tones'
  },
  {
    id: 'oil-painting',
    label: 'Oil Painting',
    src: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop',
    promptSuffix: 'oil painting style, rich textures, vibrant colors, classical portrait art, museum quality, Renaissance inspired',
    description: 'Classical oil painting with rich textures'
  },
  {
    id: 'pop-art',
    label: 'Pop Art',
    src: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop',
    promptSuffix: 'pop art style, Andy Warhol inspired, bold colors, high contrast, graphic design, iconic and vibrant, screen print aesthetic',
    description: 'Bold pop art with vibrant colors'
  },
  {
    id: '3d-render',
    label: '3D Render',
    src: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=400&fit=crop',
    promptSuffix: '3D rendered style, Pixar character design, smooth textures, professional lighting, ultra high quality, CGI animation',
    description: 'Pixar-style 3D rendered character'
  },
  {
    id: 'sketch',
    label: 'Pencil Sketch',
    src: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=400&h=400&fit=crop',
    promptSuffix: 'pencil sketch style, detailed line work, artistic shading, graphite drawing, classical sketch, hand-drawn appearance',
    description: 'Detailed pencil sketch with fine lines'
  },
  {
    id: 'fantasy',
    label: 'Fantasy',
    src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop',
    promptSuffix: 'fantasy art style, magical atmosphere, mystical elements, ethereal lighting, epic and dramatic, concept art quality',
    description: 'Magical fantasy art with mystical elements'
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
