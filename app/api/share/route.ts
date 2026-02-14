/**
 * Share to Earn API Endpoint
 * POST /api/share
 * Allows users to share their generations publicly and earn 1 credit
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateShareCard } from '@/lib/generate-share-card'
import { PREMIUM_SLOGANS } from '@/lib/constants/slogans'

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

    // 3. Fetch user profile to check share reward limit
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('share_rewards_earned, credits')
      .eq('id', user.id)
      .single()

    // Handle missing profile or missing share_rewards_earned column
    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      
      // If share_rewards_earned column doesn't exist, use default value
      if (profileError?.code === 'PGRST116' || profileError?.message?.includes('column')) {
        console.warn('⚠️  share_rewards_earned column might not exist, using default value 0')
        
        // Try to get at least the credits
        const { data: basicProfile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single()
        
        if (basicProfile) {
          // Use default share_rewards_earned = 0
          profile = { share_rewards_earned: 0, credits: basicProfile.credits } as any
        } else {
          return NextResponse.json(
            { error: 'Profile not found', details: 'User profile does not exist' },
            { status: 404 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Profile not found', details: profileError?.message },
          { status: 404 }
        )
      }
    }

    // Global share reward limit (MVP: 5 rewards for all users)
    const MAX_SHARE_REWARDS = 5
    const hasReachedLimit = profile!.share_rewards_earned >= MAX_SHARE_REWARDS

    // 4. Fetch the generation to verify ownership and check if already rewarded
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

    // 5. Check reward eligibility (for credit increment)
    const isEligibleForReward = !generation.is_rewarded && !hasReachedLimit
    
    console.log('Share eligibility check:', {
      generation_id,
      is_rewarded: generation.is_rewarded,
      share_rewards_earned: profile!.share_rewards_earned,
      max_share_rewards: MAX_SHARE_REWARDS,
      has_reached_limit: hasReachedLimit,
      eligible_for_credit: isEligibleForReward
    })

    // 5. Check if generation succeeded
    if (generation.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Only succeeded generations can be shared' },
        { status: 400 }
      )
    }

    // 6. Generate alt text with enhanced SEO
    let altText = ''
    if (title) {
      // Use title as alt text if provided
      altText = title
    } else {
      // Generate rich alt text from quality_check data
      const qc = generation.quality_check
      const petType = qc?.petType || 'pet'
      const breed = qc?.breed && qc.breed !== 'unknown' ? qc.breed : ''
      const style = generation.style || 'artistic style'
      
      altText = `AI generated ${petType} portrait${breed ? ' - ' + breed : ''}, ${style}, high resolution`
    }

    // 7. Extract pet_type from quality_check for gallery filtering
    let petType = null
    if (generation.quality_check?.petType) {
      petType = generation.quality_check.petType.toLowerCase()
      console.log('✅ Extracted pet_type from quality_check:', petType)
    } else {
      console.warn('⚠️ No petType found in quality_check for generation:', generation_id)
    }

    // 8. Generate share card asynchronously (non-blocking)
    let shareCardUrl = ''
    let shareSlogan = ''
    let shareSloganIndex = Math.floor(Math.random() * PREMIUM_SLOGANS.length)
    shareSlogan = PREMIUM_SLOGANS[shareSloganIndex]
    
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

    // 9. Update generation: set public, title, alt_text, pet_type, is_rewarded, and share_card_url
    // Use admin client to bypass RLS policies
    const adminSupabase = createAdminClient()
    const { error: updateError } = await adminSupabase
      .from('generations')
      .update({
        is_public: true,
        title: title || null,
        alt_text: altText,
        pet_type: petType,  // ✅ Auto-categorize for gallery filtering
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
    console.log('✅ Set is_public=true, pet_type=' + petType + ', is_rewarded=true, share_card_url saved')

    // 10. Increment user's credits ONLY if eligible (first time sharing + under limit)
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
        // Increment share_rewards_earned counter (if column exists)
        const { error: counterError } = await adminSupabase
          .from('profiles')
          .update({ share_rewards_earned: profile!.share_rewards_earned + 1 })
          .eq('id', user.id)
        
        if (counterError) {
          console.error('⚠️ Failed to update share_rewards_earned:', counterError)
          // Non-critical error - continue anyway
        }
        
        updatedCredits = creditData
        console.log('💰 Credits incremented (+1), new balance:', updatedCredits)
        console.log('📊 Share rewards earned:', profile!.share_rewards_earned + 1, '/', MAX_SHARE_REWARDS)
      }
    } else {
      if (hasReachedLimit) {
        console.log('⚠️  No credit granted - share reward limit reached (', profile!.share_rewards_earned, '/', MAX_SHARE_REWARDS, ')')
      } else {
        console.log('ℹ️  No credit granted - already rewarded for this generation')
      }
      // Fetch current credits without incrementing
      const { data: currentProfile } = await adminSupabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()
      
      updatedCredits = currentProfile?.credits || null
    }

    // 11. Return success with share card data
    const remainingRewards = MAX_SHARE_REWARDS - (profile!.share_rewards_earned + (isEligibleForReward ? 1 : 0))
    
    let successMessage = ''
    if (isEligibleForReward) {
      successMessage = remainingRewards > 0
        ? `Generation shared successfully! +1 credit earned (${remainingRewards}/${MAX_SHARE_REWARDS} rewards remaining)`
        : 'Generation shared successfully! +1 credit earned (limit reached)'
    } else if (hasReachedLimit) {
      successMessage = `Generation shared! You've reached your share reward limit (${MAX_SHARE_REWARDS}/${MAX_SHARE_REWARDS})`
    } else {
      successMessage = 'Generation shared successfully!'
    }
    
    return NextResponse.json({
      success: true,
      message: successMessage,
      credits: updatedCredits,
      credited: isEligibleForReward,
      has_reached_limit: hasReachedLimit,
      remaining_rewards: remainingRewards,
      max_rewards: MAX_SHARE_REWARDS,
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
