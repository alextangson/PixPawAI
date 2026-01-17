/**
 * PixPaw AI Brand Assets Configuration
 * Centralized branding constants for logos, colors, and watermark settings
 */

export const BRANDING = {
  // Logo variants for different use cases
  logos: {
    // SVG (for web display)
    svg: {
      color: '/brand/logo-orange.svg',   // Primary brand color (orange)
      black: '/brand/logo-black.svg',    // Black version for light backgrounds
      white: '/brand/logo-white.svg',    // White version for dark backgrounds
    },
    // PNG (for watermark & download)
    png: {
      color128: '/brand/png/logo-orange-128.png',
      color256: '/brand/png/logo-orange-256.png',
      black128: '/brand/png/logo-black-128.png',
      black256: '/brand/png/logo-black-256.png',
      white128: '/brand/png/logo-white-128.png',
      white256: '/brand/png/logo-white-256.png',
    },
    // Legacy paths for backwards compatibility
    color: '/brand/logo-orange.svg',
    black: '/brand/logo-black.svg',
    white: '/brand/logo-white.svg',
  },
  
  // Brand colors
  colors: {
    primary: '#FF8C42',      // Coral/Orange - Primary brand color
    secondary: '#FF6B35',    // Darker orange
    background: '#FFFDF9',   // Cream/Off-white
    text: '#2D2D2D',         // Dark gray
  },
  
  // Watermark settings for non-paid users
  watermark: {
    opacity: 0.6,            // 60% opacity for subtle branding
    size: {
      small: 'h-6',          // Tailwind class: 24px height
      medium: 'h-8',         // Tailwind class: 32px height
      large: 'h-12',         // Tailwind class: 48px height
    },
    position: {
      bottomRight: 'bottom-4 right-4',
      bottomCenter: 'bottom-4 left-1/2 -translate-x-1/2',
    }
  },
  
  // Social sharing platforms
  social: {
    twitter: 'https://twitter.com/intent/tweet',
    facebook: 'https://www.facebook.com/sharer/sharer.php',
    pinterest: 'https://pinterest.com/pin/create/button/',
  }
} as const

export type LogoVariant = keyof typeof BRANDING.logos
export type BrandColor = keyof typeof BRANDING.colors
