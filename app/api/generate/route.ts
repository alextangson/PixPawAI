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
): Promise<{ publicUrl: string; storagePath: string }> {
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
  console.log('📁 Storage path:', data.path)
  
  return {
    publicUrl: publicUrlData.publicUrl,
    storagePath: data.path
  }
}

/**
 * 🎯 DUAL-FORCE FIX: Convert aspect ratio string to pixel dimensions
 * All dimensions are multiples of 32 for FLUX compatibility
 * This is the "HARD" limit - explicit integer mapping
 */
function aspectRatioToDimensions(aspectRatio: string): { width: number; height: number; arSuffix: string } {
  // FIX 1: Explicit Resolution Mapping (The "Hard" Limit)
  let width = 1024
  let height = 1024
  let arSuffix = " --ar 1:1"

  switch (aspectRatio) {
    case "3:4":
      width = 768
      height = 1024
      arSuffix = " --ar 3:4"
      break
    case "4:3":
      width = 1024
      height = 768
      arSuffix = " --ar 4:3"
      break
    case "16:9":
      width = 1024
      height = 576
      arSuffix = " --ar 16:9"
      break
    case "9:16":
      width = 576
      height = 1024
      arSuffix = " --ar 9:16"
      break
    default: // "1:1"
      width = 1024
      height = 1024
      arSuffix = " --ar 1:1"
  }

  return { width, height, arSuffix }
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
 * Returns the public Supabase Storage URL and storage path
 */
async function generateWithOpenRouter(
  finalPrompt: string,
  userId: string,
  generationId: string,
  imageUrl?: string,
  strength: number = 0.8,
  width?: number,
  height?: number,
  arSuffix?: string
): Promise<{ publicUrl: string; storagePath: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  // 🎯 CRITICAL: Use exact dimensions provided (already mapped from aspect ratio)
  // DO NOT normalize or modify these dimensions
  const dimensions = width && height 
    ? { width, height }
    : { width: 1024, height: 1024 } // Fallback only if not provided
  
  console.log('🚀 SENDING TO OPENROUTER:')
  console.log('  📐 Model: black-forest-labs/flux.2-flex')
  console.log('  📏 Width:', dimensions.width, '(integer)')
  console.log('  📏 Height:', dimensions.height, '(integer)')
  console.log('  💬 AR Suffix:', arSuffix || 'none')
  console.log('  🎯 Strength:', strength, '- Higher = more like original')
  console.log('  🖼️  Has Source Image:', !!imageUrl)
  console.log('  📝 Prompt tail:', finalPrompt.slice(-50))
  
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
  
  // 🎯 FIX 2: Prompt Injection (The "Soft" Hint)
  // Inject the AR into the prompt text itself as a backup
  const promptWithAR = arSuffix 
    ? `${finalPrompt}${arSuffix}` 
    : finalPrompt
  
  console.log('  ✍️  Final prompt:', promptWithAR.slice(-100))
  
  messageContent.push({
    type: 'text',
    text: `Transform this image with the following style and description: ${promptWithAR}. Preserve the subject's identity and key features while applying the artistic style.`
  })

  // 🎯 FIX 3: Correct API Body Structure (CRITICAL)
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

  // 🎯 CRITICAL: Pass dimensions via extra_body (OpenRouter format for FLUX models)
  // Use EXACT integer values from aspect ratio mapping
  requestBody.extra_body = {
    width: dimensions.width,   // Integer (e.g., 768)
    height: dimensions.height, // Integer (e.g., 1024)
    aspect_ratio: undefined    // ✅ Remove conflicting string params
  }

  // 🎯 FIX 4: Debug Logging
  console.log('📦 FINAL API PAYLOAD:')
  console.log('  model:', requestBody.model)
  console.log('  extra_body.width:', requestBody.extra_body.width, typeof requestBody.extra_body.width)
  console.log('  extra_body.height:', requestBody.extra_body.height, typeof requestBody.extra_body.height)
  console.log('  prompt_strength:', requestBody.prompt_strength)
  console.log('  has_image:', !!imageUrl)
  console.log('  ar_suffix_in_prompt:', arSuffix || 'none')

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
    
    // Upload Base64 to Supabase Storage and return public URL + storage path
    const result = await uploadBase64ToStorage(base64Data, userId, generationId)
    return result
  }

  // If no Base64, check for direct URLs (fallback)
  // Note: Direct URLs don't give us storage path, so we can't delete them later
  if (data.data?.[0]?.url) {
    console.log('✅ Direct URL found in data.data[0].url')
    console.log('⚠️  Warning: Direct URL without storage path - cannot delete later')
    return {
      publicUrl: data.data[0].url,
      storagePath: '' // No storage path for external URLs
    }
  }

  if (data.choices?.[0]?.message?.images?.[0]) {
    const img = data.choices[0].message.images[0]
    const url = typeof img === 'string' ? img : img?.url
    if (url?.startsWith('http')) {
      console.log('✅ Direct URL found in message.images')
      console.log('⚠️  Warning: Direct URL without storage path - cannot delete later')
      return {
        publicUrl: url,
        storagePath: '' // No storage path for external URLs
      }
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

    // 🎯 DUAL-FORCE FIX: Convert aspect ratio to exact pixel dimensions
    const dimensions = aspectRatioToDimensions(aspectRatio)

    console.log('🎯 Generation request:', { 
      userId: user.id, 
      style, 
      promptLength: userPrompt.length,
      aspectRatio,
      dimensions: `${dimensions.width}x${dimensions.height}`,
      arSuffix: dimensions.arSuffix,
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
      console.log('🚀 Starting AI generation via OpenRouter...')
      console.log('📐 Using aspect ratio:', aspectRatio, '→', `${dimensions.width}x${dimensions.height}`)
      console.log('💬 Prompt suffix:', dimensions.arSuffix)
      const { publicUrl: publicImageUrl, storagePath } = await generateWithOpenRouter(
        finalPrompt, 
        user.id, 
        generation.id,
        imageUrl, // Pass source image for image-to-image
        validStrength, // Pass strength parameter
        dimensions.width,
        dimensions.height,
        dimensions.arSuffix // Pass aspect ratio suffix for prompt injection
      )
      console.log('✅ Generation and upload completed')
      console.log('📁 Storage path saved:', storagePath)

      // 9. Update generation record (status: succeeded)
      // Use admin client to bypass any RLS issues
      const adminSupabase = createAdminClient()
      const { error: updateError } = await adminSupabase
        .from('generations')
        .update({
          status: 'succeeded',
          output_url: publicImageUrl,
          output_storage_path: storagePath, // ✅ Save storage path for reliable deletion
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
