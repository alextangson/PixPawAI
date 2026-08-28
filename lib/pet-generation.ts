/** Shared guards for pet identity; neither style text nor failed analysis is identity evidence. */
const PET_TYPES = [
  'guinea pig', 'bearded dragon', 'dog', 'cat', 'rabbit', 'bird', 'parrot',
  'hamster', 'snake', 'lizard', 'turtle', 'tortoise', 'fish', 'ferret',
  'chinchilla', 'hedgehog', 'gecko', 'rat', 'mouse', 'gerbil', 'horse',
  'pony', 'chicken', 'duck', 'goat', 'pig', 'frog', 'axolotl',
]

export function normalizePetType(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  if (['puppy', 'canine'].includes(normalized)) return 'dog'
  if (['kitten', 'feline'].includes(normalized)) return 'cat'
  if (normalized === 'bunny') return 'rabbit'
  return PET_TYPES.includes(normalized) ? normalized : undefined
}

export interface PetAnalysisIdentity {
  petType?: unknown
  hasPet?: boolean
  isSafe?: boolean
  issues?: unknown
}

export function hasUsablePetIdentity(analysis: PetAnalysisIdentity | null | undefined): boolean {
  return !!analysis && analysis.hasPet !== false && analysis.isSafe !== false &&
    !!normalizePetType(analysis.petType) &&
    !(Array.isArray(analysis.issues) && analysis.issues.some(issue =>
      typeof issue === 'string' && /(?:failed|error|unclear_detection)/i.test(issue)))
}

export function preservePetIdentity(prompt: string, petType: unknown, styleId?: string): string {
  const species = normalizePetType(petType)
  if (!species) throw new Error('Pet identity could not be verified')
  // FLUX-dev has no negative_prompt input: identity constraints must be positive text.
  const costume = styleId === 'Christmas-Vibe'
    ? 'The pet is wearing a fluffy red and white Santa hat on its head, against a solid red studio background. '
    : ''
  // Put the animal AND the requested costume early; a long preservation preamble
  // can crowd the actual style out of the model's text conditioning.
  return `Pet portrait of the same ${species} from the reference photo. ${costume}${prompt} ` +
    `Keep the original pet's species, face, ears, body shape, colors and distinctive markings. ` +
    `The subject must remain an animal, never a human. Apply accessories to the pet only.`
}

export const CHRISTMAS_MAX_PROMPT_STRENGTH = 0.9

export function resolvePetPromptStrength(styleId: string | undefined, requested: unknown, configured: unknown): number {
  const valid = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
  const fallback = styleId === 'Christmas-Vibe' ? CHRISTMAS_MAX_PROMPT_STRENGTH : 0.45
  const strength = valid(requested) ? requested : valid(configured) ? configured : fallback
  // 1.0 destroys the input image, it does NOT mean maximum resemblance.
  // Enforce on the server too: old database rows and clients can still send 0.92.
  return styleId === 'Christmas-Vibe' ? Math.min(strength, CHRISTMAS_MAX_PROMPT_STRENGTH) : strength
}
