import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Fetch current Qwen configuration
    const { data, error } = await supabase
      .from('qwen_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Qwen config GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return default config if none exists
    if (!data) {
      const defaultConfig = {
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        system_prompt: 'You are a pet image analysis expert. Analyze the pet in the image and provide detailed, accurate information.',
        features: {
          heterochromia_detection: true,
          breed_recognition: true,
          pattern_analysis: true,
          multiple_pets: false
        }
      }
      return NextResponse.json(defaultConfig)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Qwen config GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Qwen config', message: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    // Check if config exists
    const { data: existing } = await supabase
      .from('qwen_config')
      .select('id')
      .single()

    let result
    if (existing) {
      // Update existing
      result = await supabase
        .from('qwen_config')
        .update(body)
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Insert new
      result = await supabase
        .from('qwen_config')
        .insert(body)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Qwen config PUT error:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error: any) {
    console.error('Qwen config PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update Qwen config', message: error.message },
      { status: 500 }
    )
  }
}
