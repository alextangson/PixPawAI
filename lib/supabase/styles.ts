/**
 * Database styles helper functions
 * Fetch styles from Supabase with fallback to hardcoded
 */

import { createAdminClient } from './server'
import { STYLES, getStyleById, type Style } from '@/lib/styles'
import { type StyleTierConfig } from '@/lib/style-tiers'

interface DatabaseStyle {
  id: string
  name: string
  emoji?: string
  prompt_suffix: string
  negative_prompt?: string
  category?: string
  description?: string
  preview_image_url?: string
  sort_order: number
  is_enabled: boolean
  is_premium: boolean
  tier?: number
  expected_similarity?: string
  recommended_strength_min?: number
  recommended_strength_max?: number
  recommended_guidance?: number
}

/**
 * Convert database style to frontend Style format
 */
function convertDatabaseStyleToStyle(dbStyle: DatabaseStyle): Style {
  return {
    id: dbStyle.id,
    label: dbStyle.name,
    src: dbStyle.preview_image_url || '',
    promptSuffix: dbStyle.prompt_suffix,
    description: dbStyle.description
  }
}

/**
 * Fetch a single style from database by ID
 * Returns null if not found or disabled
 */
export async function getStyleFromDatabase(styleId: string): Promise<Style | null> {
  try {
    const supabase = await createAdminClient()
    
    const { data, error } = await supabase
      .from('styles')
      .select('*')
      .eq('id', styleId)
      .eq('is_enabled', true)
      .single()
    
    if (error) {
      console.error(`Failed to fetch style ${styleId} from database:`, error)
      return null
    }
    
    if (!data) {
      return null
    }
    
    return convertDatabaseStyleToStyle(data)
  } catch (error) {
    console.error(`Error fetching style ${styleId}:`, error)
    return null
  }
}

/**
 * Get style config with fallback
 * Priority: Database -> Hardcoded
 */
export async function getStyleConfigWithFallback(styleId: string): Promise<Style | undefined> {
  // 1. Try database first
  const dbStyle = await getStyleFromDatabase(styleId)
  if (dbStyle) {
    console.log(`✅ Using database style: ${styleId}`)
    return dbStyle
  }
  
  // 2. Fallback to hardcoded
  const hardcodedStyle = getStyleById(styleId)
  if (hardcodedStyle) {
    console.log(`⚠️ Database fallback: using hardcoded style: ${styleId}`)
    return hardcodedStyle
  }
  
  // 3. Style not found anywhere
  console.error(`❌ Style not found: ${styleId}`)
  return undefined
}

/**
 * Fetch all enabled styles from database
 */
export async function getAllEnabledStyles(): Promise<Style[]> {
  try {
    const supabase = await createAdminClient()
    
    const { data, error } = await supabase
      .from('styles')
      .select('*')
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('Failed to fetch styles from database:', error)
      return STYLES // Fallback to hardcoded
    }
    
    return data.map(convertDatabaseStyleToStyle)
  } catch (error) {
    console.error('Error fetching styles:', error)
    return STYLES // Fallback to hardcoded
  }
}

/**
 * Get style tier config from database
 * Returns StyleTierConfig or undefined if not found/configured
 */
export async function getStyleTierFromDatabase(styleId: string): Promise<StyleTierConfig | undefined> {
  try {
    const supabase = await createAdminClient()
    
    const { data, error } = await supabase
      .from('styles')
      .select('tier, expected_similarity, recommended_strength_min, recommended_strength_max, recommended_guidance')
      .eq('id', styleId)
      .eq('is_enabled', true)
      .single()
    
    if (error || !data || !data.tier) {
      return undefined
    }
    
    // Convert database style to StyleTierConfig format
    const tierConfig: StyleTierConfig = {
      tier: data.tier as 1 | 2 | 3 | 4,
      strength: data.recommended_strength_min || 0.35,
      guidance: data.recommended_guidance || 2.5,
      description: getTierDescription(data.tier),
      expectedSimilarity: data.expected_similarity || '70-80%',
      numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
    }
    
    console.log(`✅ Loaded tier config from database for ${styleId}:`, tierConfig)
    return tierConfig
  } catch (error) {
    console.error(`Error fetching tier config for ${styleId}:`, error)
    return undefined
  }
}

/**
 * Get tier description by tier number
 */
function getTierDescription(tier: number): string {
  switch (tier) {
    case 1: return '写实增强'
    case 2: return '轻艺术'
    case 3: return '强艺术'
    case 4: return '极致艺术'
    default: return '默认配置'
  }
}
