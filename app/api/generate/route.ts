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
 * Safe logging helper to prevent terminal crashes from large Base64 strings
 */
function createSafeLog(data: any): string {
  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...[TRUNCATED ' + value.length + ' chars]'
    }
    return value
  }, 2)
}

/**
 * Generate image using OpenRouter API with FLUX.2-flex model
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

  console.log('🚀 Calling OpenRouter API with FLUX.2-flex...')
  console.log('📝 Prompt:', finalPrompt)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': siteUrl,
      'X-Title': 'PixPawAI',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/flux.2-flex',
      messages: [
        {
          role: 'user',
          content: `Generate an image of: ${finalPrompt}`
        }
      ],
      modalities: ['image', 'text'],
    }),
  })

  console.log('📡 Raw Response Status:', response.status)

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('❌ OpenRouter API error:', response.status, errorBody.substring(0, 500))
    throw new Error(`OpenRouter API failed with status ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  
  // Safe logging to prevent terminal crashes
  console.log('✅ Safe Parsed Response:', createSafeLog(data))

  // Check if response contains an error (OpenRouter can return errors with 200 status)
  if (data.error) {
    console.error('❌ OpenRouter returned error:', data.error)
    throw new Error(data.error.message || JSON.stringify(data.error))
  }

  // Strategy 1: Check choices[0].message.images (FLUX.2 format)
  if (data.choices?.[0]?.message?.images && Array.isArray(data.choices[0].message.images)) {
    const firstImage = data.choices[0].message.images[0]
    const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url
    
    if (imageUrl) {
      console.log('✅ Image found in choices[0].message.images')
      return imageUrl
    }
  }

  // Strategy 2: Check data.output (some models use this)
  if (data.output && typeof data.output === 'string') {
    console.log('✅ Image found in data.output')
    return data.output
  }

  // Strategy 3: Check data.data[0].url (DALL-E format)
  if (data.data && Array.isArray(data.data) && data.data[0]?.url) {
    console.log('✅ Image found in data.data[0].url')
    return data.data[0].url
  }

  // Strategy 4: Check choices[0].message.content for URLs or Base64
  if (data.choices?.[0]?.message?.content) {
    const content = data.choices[0].message.content
    
    // Check if content is a Base64 data URL
    if (content.startsWith('data:image')) {
      console.log('✅ Base64 image found in message.content')
      return content
    }
    
    // Try to extract Markdown image: ![alt](url)
    const markdownMatch = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/)
    if (markdownMatch?.[1]) {
      console.log('✅ Image extracted from markdown')
      return markdownMatch[1]
    }
    
    // Try to extract plain URL
    const urlMatch = content.match(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|webp|gif))/i)
    if (urlMatch?.[1]) {
      console.log('✅ Image extracted from plain URL')
      return urlMatch[1]
    }
  }

  // Strategy 5: Check top-level data.url
  if (data.url && typeof data.url === 'string') {
    console.log('✅ Image found in data.url')
    return data.url
  }

  // No image found - log structure for debugging
  console.error('❌ No image found. Response structure:', createSafeLog({
    hasChoices: !!data.choices,
    hasOutput: !!data.output,
    hasData: !!data.data,
    hasUrl: !!data.url,
    topLevelKeys: Object.keys(data)
  }))
  
  throw new Error('No image found in OpenRouter response. Check logs for response structure.')
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
          model: 'black-forest-labs/flux.2-flex',
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
