/**
 * AI Image Generation API Endpoint
 * POST /api/generate
 * Using OpenRouter API for global accessibility
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
 * Extract Base64 image data from various response formats
 */
function extractBase64FromResponse(data: any): string | null {
  // Strategy 1: data.data[0].b64_json (DALL-E format)
  if (data.data && Array.isArray(data.data) && data.data[0]?.b64_json) {
    console.log('✅ Base64 found in data.data[0].b64_json')
    return data.data[0].b64_json
  }

  // Strategy 2: choices[0].message.images (FLUX.2 format with Base64)
  if (data.choices?.[0]?.message?.images && Array.isArray(data.choices[0].message.images)) {
    const firstImage = data.choices[0].message.images[0]
    
    // Handle nested structure: { image_url: { url: "data:image..." } }
    let imageData: string | undefined
    
    if (typeof firstImage === 'string') {
      imageData = firstImage
    } else if (firstImage?.image_url?.url) {
      // OpenRouter FLUX.2 nested format
      imageData = firstImage.image_url.url
    } else if (firstImage?.url) {
      imageData = firstImage.url
    } else if (firstImage?.b64_json) {
      imageData = firstImage.b64_json
    }
    
    if (imageData) {
      // Check if it's Base64 (starts with data:image or is raw base64)
      if (imageData.startsWith('data:image')) {
        console.log('✅ Base64 data URL found in message.images')
        return imageData.split(',')[1] // Extract base64 part after comma
      }
      // If it's a URL, return null (not base64)
      if (imageData.startsWith('http')) {
        return null
      }
      // Otherwise assume it's raw base64
      console.log('✅ Raw Base64 found in message.images')
      return imageData
    }
  }

  // Strategy 3: choices[0].message.content (chat format)
  if (data.choices?.[0]?.message?.content) {
    const content = data.choices[0].message.content
    
    // Check if it's a data URL
    if (content.startsWith('data:image')) {
      console.log('✅ Base64 data URL found in message.content')
      return content.split(',')[1]
    }
    
    // Check if it's raw base64 (very long string, no http)
    if (content.length > 1000 && !content.startsWith('http')) {
      console.log('✅ Raw Base64 found in message.content')
      return content
    }
  }

  // Strategy 4: data.output (Replicate format)
  if (data.output && typeof data.output === 'string') {
    if (data.output.startsWith('data:image')) {
      console.log('✅ Base64 data URL found in data.output')
      return data.output.split(',')[1]
    }
    if (data.output.length > 1000 && !data.output.startsWith('http')) {
      console.log('✅ Raw Base64 found in data.output')
      return data.output
    }
  }

  // Strategy 5: Top-level b64_json
  if (data.b64_json && typeof data.b64_json === 'string') {
    console.log('✅ Base64 found in data.b64_json')
    return data.b64_json
  }

  return null
}

/**
 * Upload Base64 image directly to Supabase Storage
 * Returns public URL
 */
async function uploadBase64ToStorage(
  base64Data: string,
  userId: string,
  generationId: string
): Promise<string> {
  const supabase = await createClient()
  
  // Convert Base64 to Buffer
  const buffer = Buffer.from(base64Data, 'base64')
  console.log('📦 Converted Base64 to Buffer:', buffer.length, 'bytes')

  // Generate file path
  const timestamp = Date.now()
  const filePath = `public/${userId}/${timestamp}-${generationId}.png`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('generated-results')
    .upload(filePath, buffer, {
      contentType: 'image/png',
      cacheControl: '31536000', // 1 year
      upsert: false,
    })

  if (error) {
    console.error('❌ Storage upload error:', error)
    throw new Error(`Failed to upload to storage: ${error.message}`)
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('generated-results')
    .getPublicUrl(data.path)

  console.log('✅ Uploaded to storage:', publicUrlData.publicUrl)
  return publicUrlData.publicUrl
}

/**
 * Generate image using OpenRouter API with FLUX.2-flex model
 * Returns the public Supabase Storage URL (not Base64)
 */
async function generateWithOpenRouter(
  finalPrompt: string,
  userId: string,
  generationId: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  console.log('🚀 Calling OpenRouter API with FLUX.2-flex...')
  console.log('📝 Prompt:', finalPrompt.substring(0, 100))

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

  console.log('📡 Response Status:', response.status)

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('❌ OpenRouter API error:', response.status, errorBody.substring(0, 500))
    throw new Error(`OpenRouter API failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  // Safe logging (NEVER log full Base64)
  console.log('✅ Response received. Structure:', createSafeLog(data))

  // Check for errors in response
  if (data.error) {
    console.error('❌ OpenRouter error:', data.error)
    throw new Error(data.error.message || JSON.stringify(data.error))
  }

  // Try to extract Base64 data
  const base64Data = extractBase64FromResponse(data)

  if (base64Data) {
    console.log('📊 Received Base64 length:', base64Data.length, 'chars')
    
    // Upload Base64 to Supabase Storage and return public URL
    const publicUrl = await uploadBase64ToStorage(base64Data, userId, generationId)
    return publicUrl
  }

  // If no Base64, check for direct URLs (fallback)
  if (data.data?.[0]?.url) {
    console.log('✅ Direct URL found in data.data[0].url')
    return data.data[0].url
  }

  if (data.choices?.[0]?.message?.images?.[0]) {
    const img = data.choices[0].message.images[0]
    const url = typeof img === 'string' ? img : img?.url
    if (url?.startsWith('http')) {
      console.log('✅ Direct URL found in message.images')
      return url
    }
  }

  // No image found
  console.error('❌ No image found. Response keys:', Object.keys(data))
  throw new Error('No image data found in OpenRouter response')
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
      // 8. Call OpenRouter API and upload to storage
      console.log('Starting AI generation via OpenRouter...')
      const publicImageUrl = await generateWithOpenRouter(finalPrompt, user.id, generation.id)
      console.log('✅ Generation and upload completed')

      // 9. Update generation record (status: succeeded)
      const { error: updateError } = await supabase
        .from('generations')
        .update({
          status: 'succeeded',
          output_image: publicImageUrl,
          metadata: {
            ...generation.metadata,
            completedAt: new Date().toISOString(),
            storageUrl: publicImageUrl,
          },
        })
        .eq('id', generation.id)

      if (updateError) {
        console.error('Failed to update generation status:', updateError)
      }

      // 10. Return success result
      return NextResponse.json({
        success: true,
        generationId: generation.id,
        outputUrl: publicImageUrl,
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
