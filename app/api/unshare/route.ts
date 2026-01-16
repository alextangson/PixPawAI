/**
 * Unshare API Endpoint
 * POST /api/unshare
 * Makes a generation private without affecting credits or is_rewarded status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request data
    const body = await request.json()
    const { generation_id } = body

    if (!generation_id) {
      return NextResponse.json(
        { error: 'Missing required field: generation_id' },
        { status: 400 }
      )
    }

    console.log('Unshare request:', { userId: user.id, generation_id })

    // 3. Verify ownership
    const { data: generation, error: fetchError } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generation_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !generation) {
      console.error('Generation not found:', fetchError)
      return NextResponse.json(
        { error: 'Generation not found or you do not have permission' },
        { status: 404 }
      )
    }

    // 4. Check if already private
    if (!generation.is_public) {
      return NextResponse.json(
        { success: true, message: 'Generation is already private' },
        { status: 200 }
      )
    }

    // 5. Update generation: set is_public to false
    // IMPORTANT: Do NOT change is_rewarded or deduct credits
    const adminSupabase = createAdminClient()
    const { error: updateError } = await adminSupabase
      .from('generations')
      .update({
        is_public: false,
        // is_rewarded stays the same (prevent credit farming)
      })
      .eq('id', generation_id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('❌ Failed to unshare generation:', updateError)
      return NextResponse.json(
        { error: 'Failed to unshare generation', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ Generation unshared (made private):', generation_id)
    console.log('ℹ️  is_rewarded status preserved:', generation.is_rewarded)
    console.log('ℹ️  No credits deducted')

    // 6. Return success
    return NextResponse.json({
      success: true,
      message: 'Generation is now private',
      generation_id,
      is_public: false,
    })

  } catch (error: any) {
    console.error('Unshare API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/unshare?generation_id=xxx
 * Check if a generation is public
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const generationId = searchParams.get('generation_id')

    if (!generationId) {
      return NextResponse.json(
        { error: 'Missing generation_id parameter' },
        { status: 400 }
      )
    }

    const { data: generation, error } = await supabase
      .from('generations')
      .select('is_public, is_rewarded')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (error || !generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      is_public: generation.is_public,
      is_rewarded: generation.is_rewarded,
    })

  } catch (error) {
    console.error('Failed to fetch share status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch share status' },
      { status: 500 }
    )
  }
}
