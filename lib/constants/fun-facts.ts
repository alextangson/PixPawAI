/**
 * Fun facts displayed during AI generation process
 * Rotates every 5 seconds to engage users while they wait
 */

export const FUN_FACTS = [
  "A clear, well-lit reference photo helps preserve your pet's identifying features",
  "Curated style prompts shape the scene while the reference photo anchors your pet's appearance",
  "Your optional scene description is safety-checked before image generation begins",
  "Visible features such as coat color, ear shape, and eye color guide the portrait",
  "Image-to-image generation uses your uploaded photo as the visual starting point",
  "A front-facing photo usually gives the model the clearest view of your pet",
  "You can choose a different style or scene description for another interpretation",
  "Complex coat patterns benefit from sharp focus and even lighting",
  "The generated result may vary, so you can review it before choosing a paid product",
  "Public gallery sharing is optional and controlled separately from generation"
] as const

export type FunFact = typeof FUN_FACTS[number]
