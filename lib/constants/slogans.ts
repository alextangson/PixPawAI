/**
 * Premium Cinematic Slogans for Share Cards
 * 
 * Single source of truth for all slogan-related features.
 * Used in:
 * - lib/generate-share-card.ts (Background card generation)
 * - app/api/create-share-card/route.ts (Custom card creation)
 * - components/art-card-modal.tsx (Card preview UI)
 * 
 * DO NOT duplicate these slogans in other files.
 */

export const PREMIUM_SLOGANS = [
  "Every paw has a story to tell",
  "Turning paws into stunning portraits",
  "Captured with AI, Loved for Real",
  "Cinema-grade portraits for your best friend",
  "Where art meets unconditional love",
  "A digital hug in every pixel",
  "Your pet, reimagined as a masterpiece",
  "From camera roll to red carpet",
  "Because every pet deserves the spotlight",
  "Paws that paint a thousand words",
  "Made with AI magic, sealed with love",
  "Your furry friend's cinematic debut",
  "Artistic pet memories, one click away",
  "When technology meets tail wags",
  "Art that makes your heart skip a beat",
  "Transform moments into movie scenes",
  "The future of pet portraits is here",
  "Where pixels become precious memories",
  "Your pet's journey to stardom starts now",
  "Creating legends, one paw at a time"
] as const

/**
 * Get a random slogan index
 */
export function getRandomSloganIndex(): number {
  return Math.floor(Math.random() * PREMIUM_SLOGANS.length)
}

/**
 * Get a random slogan
 */
export function getRandomSlogan(): string {
  return PREMIUM_SLOGANS[getRandomSloganIndex()]
}

/**
 * Get a slogan by index (with fallback to random if invalid)
 */
export function getSloganByIndex(index: number): string {
  if (index >= 0 && index < PREMIUM_SLOGANS.length) {
    return PREMIUM_SLOGANS[index]
  }
  return getRandomSlogan()
}

/**
 * Total number of available slogans
 */
export const TOTAL_SLOGANS = PREMIUM_SLOGANS.length
