/**
 * Share to Earn API Endpoint
 * POST /api/share
 * Allows users to share their generations publicly and earn 1 credit
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateShareCard, SLOGANS } from '@/lib/generate-share-card'

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

    // 4. Check reward eligibility (for credit increment)
    const isEligibleForReward = !generation.is_rewarded
    
    console.log('Share eligibility check:', {
      generation_id,
      is_rewarded: generation.is_rewarded,
      eligible_for_credit: isEligibleForReward
    })

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

    // 7. Generate share card asynchronously (non-blocking)
    let shareCardUrl = ''
    let shareSlogan = ''
    let shareSloganIndex = Math.floor(Math.random() * SLOGANS.length)
    shareSlogan = SLOGANS[shareSloganIndex]
    
    // Start card generation in background (don't await)
    if (generation.output_url) {
      console.log('🚀 Starting async share card generation...')
      
      // Fire and forget - generate card in background
      generateShareCard({
        generationId: generation_id,
        imageUrl: generation.output_url,
        title: title || generation.title || undefined,
        sloganIndex: shareSloganIndex
      }).then(async (result) => {
        if (result.success && result.shareCardUrl) {
          // Update the database with the generated card URL
          const adminSupabase = createAdminClient()
          await adminSupabase
            .from('generations')
            .update({ share_card_url: result.shareCardUrl })
            .eq('id', generation_id)
          
          console.log('✅ Background card generation complete:', result.shareCardUrl)
        } else {
          console.error('⚠️ Background card generation failed:', result.error)
        }
      }).catch((err) => {
        console.error('💥 Background card generation error:', err)
      })
    } else {
      console.warn('⚠️ No output_url available for card generation')
    }

    // 8. Update generation: set public, title, alt_text, is_rewarded, and share_card_url
    // Use admin client to bypass RLS policies
    const adminSupabase = createAdminClient()
    const { error: updateError } = await adminSupabase
      .from('generations')
      .update({
        is_public: true,
        title: title || null,
        alt_text: altText,
        is_rewarded: true,
        share_card_url: shareCardUrl || null,
      })
      .eq('id', generation_id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('❌ CRITICAL: Failed to update generation for sharing:', updateError)
      console.error('Generation ID:', generation_id)
      console.error('Update data:', { is_public: true, title, alt_text: altText, is_rewarded: true, share_card_url: shareCardUrl })
      return NextResponse.json(
        { error: 'Failed to share generation', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ Generation shared successfully:', generation_id)
    console.log('✅ Set is_public=true, is_rewarded=true, share_card_url saved')

    // 9. Increment user's credits ONLY if this is the first time sharing (one-time reward)
    let updatedCredits = null
    
    if (isEligibleForReward) {
      const { data: creditData, error: creditError } = await adminSupabase.rpc(
        'increment_credits',
        { user_uuid: user.id, amount: 1 }
      )

      if (creditError) {
        console.error('❌ Failed to increment credits:', creditError)
        // Note: Generation is already shared, but credit increment failed
        // This is a recoverable error - we still return success but log the issue
      } else {
        updatedCredits = creditData
        console.log('💰 Credits incremented (+1), new balance:', updatedCredits)
      }
    } else {
      console.log('ℹ️  No credit granted - already rewarded for this generation')
      // Fetch current credits without incrementing
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()
      
      updatedCredits = profile?.credits || null
    }

    // 10. Return success with share card data
    const successMessage = isEligibleForReward
      ? 'Generation shared successfully! +1 credit earned'
      : 'Generation shared successfully!'
    
    return NextResponse.json({
      success: true,
      message: successMessage,
      credits: updatedCredits,
      credited: isEligibleForReward,
      generation_id,
      is_public: true,
      share_card_url: shareCardUrl,
      slogan: shareSlogan,
      slogan_index: shareSloganIndex,
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
