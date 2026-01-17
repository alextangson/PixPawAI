/**
 * A/B Testing Utility Functions
 * Simple localStorage-based variant assignment
 */

export type Variant = 'A' | 'B' | 'C';

export interface ABTestConfig {
  testName: string;
  variants: Variant[];
  defaultVariant?: Variant;
}

/**
 * Get the variant for a specific A/B test
 * Priority: URL param > localStorage cache > random assignment
 */
export function getVariant(testName: string, variants: Variant[] = ['A', 'B']): Variant {
  // Check if running on client side
  if (typeof window === 'undefined') {
    return variants[0]; // Default to first variant on server
  }

  // 1. Check URL parameter for forced variant
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariant = urlParams.get('variant');
  if (urlVariant && variants.includes(urlVariant as Variant)) {
    // Cache the forced variant
    localStorage.setItem(`ab_${testName}`, urlVariant);
    return urlVariant as Variant;
  }

  // 2. Check localStorage cache
  const cachedVariant = localStorage.getItem(`ab_${testName}`);
  if (cachedVariant && variants.includes(cachedVariant as Variant)) {
    return cachedVariant as Variant;
  }

  // 3. Random assignment
  const randomIndex = Math.floor(Math.random() * variants.length);
  const assignedVariant = variants[randomIndex];
  
  // Cache the assignment
  localStorage.setItem(`ab_${testName}`, assignedVariant);
  
  return assignedVariant;
}

/**
 * Clear all A/B test assignments (useful for testing)
 */
export function clearABTests(): void {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('ab_')) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Get all current A/B test assignments
 */
export function getABTestAssignments(): Record<string, Variant> {
  if (typeof window === 'undefined') return {};
  
  const assignments: Record<string, Variant> = {};
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    if (key.startsWith('ab_')) {
      const testName = key.replace('ab_', '');
      const variant = localStorage.getItem(key);
      if (variant) {
        assignments[testName] = variant as Variant;
      }
    }
  });
  
  return assignments;
}
