/**
 * Database styles helper functions
 * Fetch styles from Supabase with fallback to hardcoded
 */

import { createAdminClient } from './server'
import { STYLES, getStyleById, type Style } from '@/lib/styles'

interface DatabaseStyle {
  id: string
  name: string
  prompt_suffix: string
  negative_prompt?: string
  category?: string
  description?: string
  preview_image_url?: string
  sort_order: number
  is_enabled: boolean
  is_premium: boolean
  recommended_strength_min?: number
  recommended_guidance?: number
  // Generation quality parameters (per-style control)
  num_inference_steps?: number    // 28-80, default 50
  output_quality?: number         // 0-100, default 80
  enable_go_fast?: boolean        // Performance vs quality, default true
  // Multi-model routing support
  model_provider?: string  // 'replicate', 'doubao', 'midjourney', etc.
  model_id?: string        // Specific model identifier
  lora_url?: string        // Optional LoRA URL for FLUX/SDXL
  model_params?: any       // JSON object with model-specific parameters
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

