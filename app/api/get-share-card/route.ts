/**
 * GET /api/get-share-card?generation_id=xxx
 * Poll for the share card URL once it's generated
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get generation_id from query params
    const { searchParams } = new URL(request.url)
    const generationId = searchParams.get('generation_id')

    if (!generationId) {
      return NextResponse.json({ error: 'generation_id is required' }, { status: 400 })
    }

    // Fetch the generation record
    const { data: generation, error } = await supabase
      .from('generations')
      .select('share_card_url, title, is_public')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (error || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    // Return the share card status
    return NextResponse.json({
      ready: !!generation.share_card_url,
      share_card_url: generation.share_card_url || null,
      is_public: generation.is_public || false,
      title: generation.title || null
    })

  } catch (error) {
    console.error('Get share card error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
