/**
 * Share to Earn API Endpoint
 * POST /api/share
 * Allows users to share their generations publicly and earn 1 credit
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
    const { generation_id, title } = body

    if (!generation_id) {
      return NextResponse.json(
        { error: 'Missing required field: generation_id' },
        { status: 400 }
      )
    }

    console.log('Share request:', { userId: user.id, generation_id, hasTitle: !!title })

    // 3. Fetch the generation to verify ownership and check if already rewarded
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

    // 4. Check if already rewarded
    if (generation.is_rewarded) {
      return NextResponse.json(
        { error: 'You have already received a reward for sharing this generation' },
        { status: 400 }
      )
    }

    // 5. Check if generation succeeded
    if (generation.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Only succeeded generations can be shared' },
        { status: 400 }
      )
    }

    // 6. Generate alt text
    let altText = ''
    if (title) {
      // Use title as alt text if provided
      altText = title
    } else {
      // Generate default alt text from prompt
      const promptPreview = generation.prompt?.substring(0, 100) || 'pet portrait'
      altText = `AI generated pet portrait: ${promptPreview}`
    }

    // 7. Update generation: set public, title, alt_text, and is_rewarded
    // Use admin client to bypass RLS policies
    const adminSupabase = createAdminClient()
    const { error: updateError } = await adminSupabase
      .from('generations')
      .update({
        is_public: true,
        title: title || null,
        alt_text: altText,
        is_rewarded: true,
      })
      .eq('id', generation_id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('❌ CRITICAL: Failed to update generation for sharing:', updateError)
      console.error('Generation ID:', generation_id)
      console.error('Update data:', { is_public: true, title, alt_text: altText, is_rewarded: true })
      return NextResponse.json(
        { error: 'Failed to share generation', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ Generation shared successfully:', generation_id)
    console.log('✅ Set is_public=true, is_rewarded=true')

    // 8. Increment user's credits by 1 (use admin client)
    const { data: updatedCredits, error: creditError } = await adminSupabase.rpc(
      'increment_credits',
      { user_uuid: user.id, amount: 1 }
    )

    if (creditError) {
      console.error('Failed to increment credits:', creditError)
      // Note: Generation is already shared, but credit increment failed
      // This is a recoverable error - we still return success but log the issue
      return NextResponse.json(
        {
          success: true,
          message: 'Generation shared successfully, but credit reward is pending',
          credits: null,
        },
        { status: 200 }
      )
    }

    console.log('Credits incremented, new balance:', updatedCredits)

    // 9. Return success
    return NextResponse.json({
      success: true,
      message: 'Generation shared successfully! +1 credit earned',
      credits: updatedCredits,
      generation_id,
      is_public: true,
    })
  } catch (error: any) {
    console.error('Share API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/share?generation_id=xxx
 * Check if a generation is already shared
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
      .select('is_public, is_rewarded, title')
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
      title: generation.title,
    })
  } catch (error) {
    console.error('Failed to fetch share status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch share status' },
      { status: 500 }
    )
  }
}
