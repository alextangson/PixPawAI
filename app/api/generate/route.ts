/**
 * AI Image Generation API Endpoint
 * POST /api/generate
 * Using OpenRouter API for global accessibility
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadGeneratedImage } from '@/lib/supabase/storage'
import { getStyleById } from '@/lib/styles'

/**
 * Generate image using OpenRouter API
 * OpenRouter uses the /chat/completions endpoint with modalities for image generation
 */
async function generateWithOpenRouter(
  finalPrompt: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  console.log('Calling OpenRouter API...')
  console.log('Prompt:', finalPrompt)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': siteUrl,
      'X-Title': 'PixPawAI',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/flux-1-schnell',
      messages: [
        {
          role: 'user',
          content: finalPrompt
        }
      ],
      modalities: ['text', 'image'],
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('OpenRouter API error:', response.status, errorBody)
    throw new Error(`OpenRouter API failed with status ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  console.log('OpenRouter response:', JSON.stringify(data, null, 2))

  // OpenRouter returns images in the response's images array
  if (!data.images || !data.images[0]) {
    throw new Error('No images in OpenRouter response')
  }

  // Images are returned as base64 data URLs or direct URLs
  const imageData = data.images[0]
  
  // If it's a data URL (base64), we need to handle it differently
  if (imageData.startsWith('data:')) {
    return imageData // Return data URL directly for now
  }
  
  // Otherwise it should be a direct URL
  return imageData
}

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
    const { imageUrl, style, prompt: userPrompt, petType = 'pet' } = body

    if (!style || !userPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields: style, prompt' },
        { status: 400 }
      )
    }

    console.log('Generation request:', { 
      userId: user.id, 
      style, 
      promptLength: userPrompt.length 
    })

    // 3. Get style configuration
    const styleConfig = getStyleById(style)
    if (!styleConfig) {
      return NextResponse.json(
        { error: `Invalid style: ${style}` },
        { status: 400 }
      )
    }

    // 4. Construct final prompt
    const finalPrompt = `${userPrompt}, ${styleConfig.promptSuffix}`
    console.log('Final prompt:', finalPrompt)

    // 5. Check user credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    if (profile.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits', credits: 0 },
        { status: 402 }
      )
    }

    // 6. Create generation record (status: processing)
    const { data: generation, error: genError } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        status: 'processing',
        prompt: finalPrompt,
        style: style,
        style_category: style,
        input_image: imageUrl || null,
        metadata: {
          petType,
          userPrompt,
          stylePromptSuffix: styleConfig.promptSuffix,
          requestedAt: new Date().toISOString(),
          provider: 'openrouter',
          model: 'black-forest-labs/flux-1-schnell',
        },
      })
      .select()
      .single()

    if (genError || !generation) {
      console.error('Failed to create generation record:', genError)
      return NextResponse.json(
        { error: 'Failed to create generation record' },
        { status: 500 }
      )
    }

    console.log('Generation record created:', generation.id)

    // 7. Decrement 1 credit (atomic operation)
    const { data: remainingCredits, error: creditError } = await supabase.rpc(
      'decrement_credits',
      { user_uuid: user.id }
    )

    if (creditError) {
      console.error('Failed to decrement credits:', creditError)
      // Delete generation record
      await supabase.from('generations').delete().eq('id', generation.id)
      return NextResponse.json(
        { error: 'Failed to process credits' },
        { status: 500 }
      )
    }

    console.log('Credits decremented, remaining:', remainingCredits)

    try {
      // 8. Call OpenRouter API
      console.log('Starting AI generation via OpenRouter...')
      const generatedImageUrl = await generateWithOpenRouter(finalPrompt)
      console.log('AI generation completed:', generatedImageUrl)

      // 9. Upload result to Supabase Storage
      console.log('Uploading to storage...')
      const uploadResult = await uploadGeneratedImage(
        generatedImageUrl,
        user.id,
        generation.id
      )

      if ('error' in uploadResult) {
        throw new Error(uploadResult.error)
      }

      console.log('Upload completed:', uploadResult.url)

      // 10. Update generation record (status: succeeded)
      const { error: updateError } = await supabase
        .from('generations')
        .update({
          status: 'succeeded',
          output_image: uploadResult.url,
          metadata: {
            ...generation.metadata,
            completedAt: new Date().toISOString(),
            openrouterUrl: generatedImageUrl,
            storageUrl: uploadResult.url,
          },
        })
        .eq('id', generation.id)

      if (updateError) {
        console.error('Failed to update generation status:', updateError)
      }

      // 11. Return success result
      return NextResponse.json({
        success: true,
        generationId: generation.id,
        outputUrl: uploadResult.url,
        remainingCredits,
        message: 'Generation completed successfully!',
      })
    } catch (error: any) {
      // Generation failed, update status and refund credits
      console.error('Generation failed:', error)

      // Update record to failed status
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: error.message || 'Generation failed',
        })
        .eq('id', generation.id)

      // Refund credit (use increment to ensure correctness)
      const { data: refundedCredits } = await supabase.rpc('increment_credits', {
        user_uuid: user.id,
        amount: 1
      })

      console.log('Credit refunded, new balance:', refundedCredits || remainingCredits + 1)

      return NextResponse.json(
        {
          error: 'Generation failed',
          message: error.message,
          generationId: generation.id,
          remainingCredits: refundedCredits || remainingCredits + 1,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/generate?id=xxx
 * Query generation status
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
    const generationId = searchParams.get('id')

    if (!generationId) {
      return NextResponse.json(
        { error: 'Missing generation ID' },
        { status: 400 }
      )
    }

    const { data: generation, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (error || !generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(generation)
  } catch (error) {
    console.error('Failed to fetch generation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch generation' },
      { status: 500 }
    )
  }
}
