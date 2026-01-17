/**
 * Fun facts displayed during AI generation process
 * Rotates every 5 seconds to engage users while they wait
 */

export const FUN_FACTS = [
  "PixPaw AI analyzes over 100 facial features to capture your pet's unique personality",
  "Our AI was trained on thousands of pet portraits from master artists",
  "Each generation uses advanced color matching to preserve your pet's natural tones",
  "The AI carefully preserves unique features like heterochromia (different colored eyes)",
  "Professional artists spend hours on pet portraits - our AI does it in 30 seconds",
  "We use the same technology that creates Hollywood movie effects",
  "Your pet's expression and posture are key factors in creating the perfect portrait",
  "The AI recognizes different breeds and adapts the artistic style accordingly",
  "Complex fur patterns are preserved through specialized texture analysis",
  "Your pet's unique eye color is detected and enhanced in the final portrait"
] as const

export type FunFact = typeof FUN_FACTS[number]
