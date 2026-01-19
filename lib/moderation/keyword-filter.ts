/**
 * Keyword Filter System
 * 
 * Purpose: Filter user prompts for inappropriate content
 * Strategy: Two-tier system (blacklist blocks, graylist sanitizes)
 * 
 * Usage:
 * ```typescript
 * const result = filterPrompt(userInput)
 * if (result.blocked) {
 *   return error('Inappropriate language')
 * }
 * const cleanPrompt = result.cleaned
 * ```
 */

// ============================================
// BLACKLIST - Blocks generation entirely
// ============================================
// These words indicate explicit intent to generate inappropriate content
// Detection triggers immediate block + violation log

const BLACKLIST_EXPLICIT = [
  // Sexual content (explicit)
  'porn', 'pornography', 'xxx', 'nsfw', 'sex', 'sexual',
  'nude', 'naked', 'topless', 'bottomless', 'undressed',
  'erotic', 'seductive', 'provocative', 'aroused',
  
  // Anatomical (explicit context)
  'genitals', 'penis', 'vagina', 'breasts', 'nipples',
  'buttocks', 'anus', 'crotch', 'groin',
  
  // Actions (explicit)
  'masturbat', 'orgasm', 'climax', 'ejaculat',
  'penetrat', 'thrust', 'hump', 'mount',
  
  // Violence & Gore
  'kill', 'murder', 'dead', 'death', 'dying',
  'blood', 'bloody', 'gore', 'gory', 'dismember',
  'torture', 'mutilat', 'decapitat', 'stab', 'shoot',
  'weapon', 'gun', 'knife', 'sword', 'blade',
  
  // Hate & Discrimination
  // (Common slurs - not listing explicitly to avoid documentation issues)
  'hate', 'racist', 'nazi', 'supremacist',
  
  // Drug references (explicit)
  'cocaine', 'heroin', 'meth', 'fentanyl',
  'drug deal', 'trafficking', 'overdose',
]

// ============================================
// GRAYLIST - Removes but allows generation
// ============================================
// Ambiguous words that might be innocent but could be misused
// Removed silently without blocking

const GRAYLIST_AMBIGUOUS = [
  // Body parts (might be innocent pet descriptions)
  'belly', 'chest', 'rear', 'backside',
  
  // Descriptors (could be style-related)
  'sensual', 'sultry', 'steamy', 'hot',
  
  // Mild violence
  'fight', 'attack', 'aggressive', 'fierce',
  
  // Substances (ambiguous)
  'smoking', 'drinking', 'drunk', 'intoxicated',
]

// ============================================
// ALLOWED TERMS - Explicitly safe for pets
// ============================================
// These should NOT trigger false positives even if similar to blacklist

const ALLOWED_PET_TERMS = [
  // Pet anatomy (safe)
  'paws', 'claws', 'tail', 'ears', 'nose', 'snout',
  'fur', 'feathers', 'scales', 'whiskers',
  
  // Pet behaviors (safe)
  'playing', 'sleeping', 'eating', 'running', 'jumping',
  'sitting', 'standing', 'lying', 'resting',
  
  // Breeds that might contain sensitive substrings
  'cock', // cockatiel, cockatoo
  'tit', // titmouse (bird)
  'ass', // assassin snail, donkey
  'pussy', // pussy willow (context: cat near plants)
]

// ============================================
// Filter Logic
// ============================================

export interface FilterResult {
  blocked: boolean
  reason?: string
  cleaned: string
  removedWords?: string[]
  matchedBlacklist?: string[]
}

/**
 * Filter user prompt for inappropriate content
 * Returns blocked=true if blacklist matched, otherwise returns cleaned prompt
 */
export function filterPrompt(userInput: string): FilterResult {
  if (!userInput || userInput.trim() === '') {
    return {
      blocked: false,
      cleaned: '',
      removedWords: []
    }
  }

  const lower = userInput.toLowerCase()
  const words = lower.split(/\s+/)
  
  // Step 1: Check for allowed pet terms (whitelist)
  // If prompt contains ONLY pet-safe terms, skip aggressive filtering
  const hasOnlyPetTerms = words.every(word => {
    return ALLOWED_PET_TERMS.some(allowed => word.includes(allowed)) ||
           word.length < 3 || // Short words like "a", "my", "the"
           /^[a-z]{1,2}$/.test(word) // Single letters
  })
  
  if (hasOnlyPetTerms && words.length < 10) {
    return {
      blocked: false,
      cleaned: userInput,
      removedWords: []
    }
  }

  // Step 2: Check blacklist (blocks generation)
  const matchedBlacklist: string[] = []
  
  for (const blacklistedWord of BLACKLIST_EXPLICIT) {
    // Use word boundary matching to avoid false positives
    // e.g., "assassin" shouldn't match "ass"
    const regex = new RegExp(`\\b${blacklistedWord}`, 'i')
    
    if (regex.test(lower)) {
      matchedBlacklist.push(blacklistedWord)
    }
  }
  
  // If blacklist matched, block immediately
  if (matchedBlacklist.length > 0) {
    return {
      blocked: true,
      reason: 'inappropriate_language',
      cleaned: '',
      matchedBlacklist
    }
  }

  // Step 3: Remove graylist words (sanitize)
  let cleaned = userInput
  const removedWords: string[] = []
  
  for (const grayWord of GRAYLIST_AMBIGUOUS) {
    const regex = new RegExp(`\\b${grayWord}\\b`, 'gi')
    
    if (regex.test(cleaned)) {
      removedWords.push(grayWord)
      cleaned = cleaned.replace(regex, '') // Remove the word
    }
  }
  
  // Step 4: Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  return {
    blocked: false,
    cleaned,
    removedWords: removedWords.length > 0 ? removedWords : undefined
  }
}

/**
 * Check if a prompt is safe (for quick validation)
 * Returns true if prompt passes filter
 */
export function isPromptSafe(userInput: string): boolean {
  const result = filterPrompt(userInput)
  return !result.blocked
}

/**
 * Get sanitized prompt (removes graylist words)
 * Returns cleaned prompt or original if no changes needed
 */
export function sanitizePrompt(userInput: string): string {
  const result = filterPrompt(userInput)
  return result.blocked ? '' : result.cleaned
}
