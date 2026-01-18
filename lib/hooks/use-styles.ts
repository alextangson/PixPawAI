/**
 * Hook to fetch styles from database or fallback to hardcoded
 */

import { useEffect, useState } from 'react'
import { STYLES, type Style } from '@/lib/styles'

interface DatabaseStyle {
  id: string
  name: string
  emoji?: string
  prompt_suffix: string
  base_prompt?: string
  negative_prompt?: string
  category?: string
  description?: string
  preview_image_url?: string
  sort_order: number
  is_enabled: boolean
  is_premium: boolean
}

function convertDatabaseStyleToStyle(dbStyle: DatabaseStyle): Style {
  return {
    id: dbStyle.id,
    label: dbStyle.name,
    src: dbStyle.preview_image_url || '',
    promptSuffix: dbStyle.prompt_suffix,
    description: dbStyle.description
  }
}

export function useStyles() {
  const [styles, setStyles] = useState<Style[]>(STYLES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStyles() {
      try {
        const res = await fetch('/api/admin/styles?includeDisabled=false')
        
        if (!res.ok) {
          throw new Error('Failed to fetch styles')
        }
        
        const data = await res.json()
        
        if (data.styles && data.styles.length > 0) {
          // Convert database styles to frontend format
          const convertedStyles = data.styles
            .filter((s: DatabaseStyle) => s.is_enabled)
            .sort((a: DatabaseStyle, b: DatabaseStyle) => a.sort_order - b.sort_order)
            .map(convertDatabaseStyleToStyle)
          
          setStyles(convertedStyles)
        } else {
          // Fallback to hardcoded styles
          setStyles(STYLES)
        }
      } catch (err: any) {
        console.error('Failed to load styles from database, using fallback:', err)
        setError(err.message)
        // Use hardcoded styles as fallback
        setStyles(STYLES)
      } finally {
        setLoading(false)
      }
    }

    fetchStyles()
  }, [])

  return { styles, loading, error }
}
