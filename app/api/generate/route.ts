/**
 * AI Image Generation API Endpoint
 * POST /api/generate
 * Using OpenRouter API for global accessibility
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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
 * Uses admin client to bypass RLS policies
 */
async function uploadBase64ToStorage(
  base64Data: string,
  userId: string,
  generationId: string
): Promise<string> {
  // Use admin client to bypass RLS policies
  const supabase = createAdminClient()
  
  // Convert Base64 to Buffer
  const buffer = Buffer.from(base64Data, 'base64')
  console.log('📦 Converted Base64 to Buffer:', buffer.length, 'bytes')
  
  // Get actual image dimensions from the buffer
  try {
    // PNG signature check and dimension extraction
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      const actualWidth = buffer.readUInt32BE(16)
      const actualHeight = buffer.readUInt32BE(20)
      const actualRatio = (actualWidth / actualHeight).toFixed(2)
      console.log('🖼️  ACTUAL Image Dimensions:', `${actualWidth}x${actualHeight}`)
      console.log('📐 ACTUAL Aspect Ratio:', actualRatio, `(${actualWidth}:${actualHeight})`)
      console.log(`${actualWidth === 1024 && actualHeight === 1024 ? '⚠️  FLUX generated 1:1 (square) - model may not support custom dimensions' : '✅ Custom dimensions applied!'}`)
    }
  } catch (err) {
    console.log('⚠️  Could not read image dimensions from buffer')
  }

  // Generate file path
  const timestamp = Date.now()
  const filePath = `${userId}/${timestamp}-${generationId}.png`

  // Upload to Supabase Storage (public bucket)
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
 * Convert aspect ratio string to pixel dimensions
 * All dimensions are multiples of 32 for FLUX compatibility
 */
function aspectRatioToDimensions(aspectRatio: string): { width: number; height: number } {
  const ratioMap: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },    // Square
    '3:4': { width: 768, height: 1024 },     // Portrait (Best for Print)
    '9:16': { width: 576, height: 1024 },    // Vertical (Best for Wallpaper)
    '4:3': { width: 1024, height: 768 },     // Landscape
    '16:9': { width: 1024, height: 576 },    // Cinematic
  }

  return ratioMap[aspectRatio] || ratioMap['1:1'] // Default to square
}

/**
 * Normalize image dimensions to be compatible with FLUX model
 * FLUX requires dimensions to be multiples of 32
 */
function normalizeDimensions(width?: number, height?: number): { width: number; height: number } {
  // Default to 1024x1024 if no dimensions provided
  if (!width || !height) {
    return { width: 1024, height: 1024 }
  }

  // Round to nearest multiple of 32
  const roundTo32 = (n: number) => Math.round(n / 32) * 32

  // Ensure minimum 256 and maximum 2048
  const clamp = (n: number) => Math.max(256, Math.min(2048, n))

  return {
    width: clamp(roundTo32(width)),
    height: clamp(roundTo32(height))
  }
}

/**
 * Generate image using OpenRouter API with FLUX.2-flex model
 * Returns the public Supabase Storage URL (not Base64)
 */
async function generateWithOpenRouter(
  finalPrompt: string,
  userId: string,
  generationId: string,
  imageUrl?: string,
  strength: number = 0.8,
  width?: number,
  height?: number
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  // Use provided dimensions (already converted from aspect ratio)
  // Only normalize if dimensions are not provided
  const dimensions = width && height 
    ? { width, height }
    : normalizeDimensions(width, height)
  
  console.log('🚀 Calling OpenRouter API with FLUX.2-flex...')
  console.log('📝 Prompt:', finalPrompt.substring(0, 100))
  console.log('📐 Dimensions REQUESTED:', `${dimensions.width}x${dimensions.height}`)
  console.log('🎯 Strength (preservation):', strength, '- Higher = more like original')
  console.log('🖼️  Source Image URL:', imageUrl || 'None')
  console.log('🔍 Raw width/height params:', { width, height })
  
  // Log the full request body (without logging full URLs)
  console.log('📦 Request Body:', JSON.stringify({
    model: 'black-forest-labs/flux.2-flex',
    width: dimensions.width,
    height: dimensions.height,
    prompt_strength: strength,
    hasImage: !!imageUrl,
    messageContent: imageUrl ? 'image + text' : 'text only'
  }, null, 2))

  // Build message content with image if provided (image-to-image)
  const messageContent: any = []
  
  if (imageUrl) {
    // Add source image for image-to-image transformation
    messageContent.push({
      type: 'image_url',
      image_url: {
        url: imageUrl
      }
    })
  }
  
  // Add text prompt with aspect ratio hint for better results
  const aspectRatioHint = width && height ? ` [Aspect ratio: ${width}:${height}, resolution ${width}x${height}]` : '';
  messageContent.push({
    type: 'text',
    text: `Transform this image with the following style and description: ${finalPrompt}. Preserve the subject's identity and key features while applying the artistic style.${aspectRatioHint}`
  })

  // Build request body following OpenRouter's official format
  const requestBody: any = {
    model: 'black-forest-labs/flux.2-flex',
    messages: [
      {
        role: 'user',
        content: messageContent
      }
    ],
    modalities: ['image', 'text']
  }

  // Add prompt_strength if image is provided (controls how much to preserve original)
  if (imageUrl) {
    requestBody.prompt_strength = strength
  }

  // Try to pass dimensions via extra_body (OpenRouter format)
  // Note: FLUX may not support custom dimensions, but we'll try multiple approaches
  if (width && height) {
    requestBody.extra_body = {
      width: dimensions.width,
      height: dimensions.height,
      aspect_ratio: `${width}:${height}`
    }
  }

  console.log('📦 Full Request Body (sanitized):', JSON.stringify({
    model: requestBody.model,
    modalities: requestBody.modalities,
    prompt_strength: requestBody.prompt_strength,
    extra_body: requestBody.extra_body,
    messages: [{
      role: 'user',
      content: messageContent.map((c: any) => 
        c.type === 'image_url' ? { type: 'image_url', url: '[IMAGE]' } : { type: 'text', text: c.text?.substring(0, 100) + '...' }
      )
    }]
  }, null, 2))

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': siteUrl,
      'X-Title': 'PixPawAI',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
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
    const { 
      imageUrl, 
      style, 
      prompt: userPrompt, 
      petType = 'pet', 
      aspectRatio = '1:1', // Default to square
      strength = 0.8 // Default strength to preserve source image (0.1 to 1.0)
    } = body

    if (!style || !userPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields: style, prompt' },
        { status: 400 }
      )
    }

  // Validate strength parameter (default 0.95 for better similarity to original)
  const validStrength = Math.max(0.1, Math.min(1.0, Number(strength) || 0.95))

    // Convert aspect ratio to dimensions
    const dimensions = aspectRatioToDimensions(aspectRatio)

    console.log('Generation request:', { 
      userId: user.id, 
      style, 
      promptLength: userPrompt.length,
      aspectRatio,
      dimensions: `${dimensions.width}x${dimensions.height}`,
      strength: validStrength,
      hasImage: !!imageUrl
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
        input_url: imageUrl || '',
        views: 0,
        likes: 0,
        is_rewarded: false,
        metadata: {
          petType,
          userPrompt,
          stylePromptSuffix: styleConfig.promptSuffix,
          requestedAt: new Date().toISOString(),
          provider: 'openrouter',
          model: 'black-forest-labs/flux.2-flex',
          strength: validStrength,
          aspectRatio,
          dimensions: `${dimensions.width}x${dimensions.height}`,
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
      const publicImageUrl = await generateWithOpenRouter(
        finalPrompt, 
        user.id, 
        generation.id,
        imageUrl, // Pass source image for image-to-image
        validStrength, // Pass strength parameter
        dimensions.width,
        dimensions.height
      )
      console.log('✅ Generation and upload completed')

      // 9. Update generation record (status: succeeded)
      // Use admin client to bypass any RLS issues
      const adminSupabase = createAdminClient()
      const { error: updateError } = await adminSupabase
        .from('generations')
        .update({
          status: 'succeeded',
          output_url: publicImageUrl,
          input_url: imageUrl || '',
          metadata: {
            ...generation.metadata,
            completedAt: new Date().toISOString(),
            storageUrl: publicImageUrl,
          },
        })
        .eq('id', generation.id)

      if (updateError) {
        console.error('❌ CRITICAL: Failed to update generation status:', updateError)
        console.error('Generation ID:', generation.id)
        console.error('Update data:', { status: 'succeeded', output_url: publicImageUrl })
        // This is critical - if status is not updated, user can't share!
        // Return error to alert user
        return NextResponse.json(
          {
            error: 'Generation completed but failed to save. Please contact support.',
            message: updateError.message,
            generationId: generation.id,
            outputUrl: publicImageUrl,
            remainingCredits,
          },
          { status: 500 }
        )
      }
      
      console.log('✅ Generation status updated to succeeded')
      console.log('✅ Generation ID:', generation.id, 'Status: succeeded')

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
