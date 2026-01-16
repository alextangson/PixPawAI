/**
 * AI Image Generation API Endpoint
 * POST /api/generate
 * Using SiliconFlow API with FLUX.1-dev for high-quality, cost-effective generation
 * Native fetch implementation with correct image_size parameter to fix aspect ratio handling
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getStyleById } from '@/lib/styles'

// Logging disabled for performance - large objects cause 100% CPU usage

/**
 * Extract Base64 image data from various response formats
 */
function extractBase64FromResponse(data: any): string | null {
  // Strategy 1: data.data[0].b64_json (DALL-E format)
  if (data.data && Array.isArray(data.data) && data.data[0]?.b64_json) {
    return data.data[0].b64_json
  }

  // Strategy 2: choices[0].message.images (FLUX.2 format with Base64)
  if (data.choices?.[0]?.message?.images && Array.isArray(data.choices[0].message.images)) {
    const firstImage = data.choices[0].message.images[0]
    
    let imageData: string | undefined
    
    if (typeof firstImage === 'string') {
      imageData = firstImage
    } else if (firstImage?.image_url?.url) {
      imageData = firstImage.image_url.url
    } else if (firstImage?.url) {
      imageData = firstImage.url
    } else if (firstImage?.b64_json) {
      imageData = firstImage.b64_json
    }
    
    if (imageData) {
      if (imageData.startsWith('data:image')) {
        return imageData.split(',')[1]
      }
      if (imageData.startsWith('http')) {
        return null
      }
      return imageData
    }
  }

  // Strategy 3: choices[0].message.content (chat format)
  if (data.choices?.[0]?.message?.content) {
    const content = data.choices[0].message.content
    
    if (content.startsWith('data:image')) {
      return content.split(',')[1]
    }
    
    if (content.length > 1000 && !content.startsWith('http')) {
      return content
    }
  }

  // Strategy 4: data.output (Replicate format)
  if (data.output && typeof data.output === 'string') {
    if (data.output.startsWith('data:image')) {
      return data.output.split(',')[1]
    }
    if (data.output.length > 1000 && !data.output.startsWith('http')) {
      return data.output
    }
  }

  // Strategy 5: Top-level b64_json
  if (data.b64_json && typeof data.b64_json === 'string') {
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
  
  return {
    publicUrl: publicUrlData.publicUrl,
    storagePath: data.path
  }
}

/**
 * 🎯 ASPECT RATIO FIX: Map aspect ratio to SiliconFlow image_size format
 * SiliconFlow uses "WIDTHxHEIGHT" string format (e.g., "768x1024")
 * All dimensions are multiples of 32 for FLUX.1-schnell compatibility
 */
function aspectRatioToImageSize(aspectRatio: string): string {
  switch (aspectRatio) {
    case "3:4":
      return "768x1024"   // Portrait
    case "4:3":
      return "1024x768"   // Landscape
    case "16:9":
      return "1024x576"   // Wide
    case "9:16":
      return "576x1024"   // Tall
    default: // "1:1"
      return "1024x1024"  // Square
  }
}

/**
 * Generate image using SiliconFlow API with FLUX.1-dev model
 * Uses native fetch with correct image_size parameter to fix aspect ratio bug
 * FLUX.1-dev provides high quality while maintaining cost-effectiveness
 * Returns the public Supabase Storage URL and storage path
 */
async function generateWithSiliconFlow(
  finalPrompt: string,
  userId: string,
  generationId: string,
  imageSize: string = "1024x1024",
  imageUrl?: string,  // Optional: source image for image-to-image
  strength: number = 0.85  // Image-to-image strength (0.1-1.0)
): Promise<{ publicUrl: string; storagePath: string }> {
  const apiKey = process.env.SILICONFLOW_API_KEY

  if (!apiKey) {
    throw new Error('SILICONFLOW_API_KEY is not configured')
  }

  // Build request body following SiliconFlow's API format
  const requestBody: any = {
    model: "black-forest-labs/FLUX.1-dev",
    prompt: finalPrompt,
    image_size: imageSize,
    num_inference_steps: 28
  }

  // Add image-to-image parameters if source image provided
  if (imageUrl) {
    requestBody.image = imageUrl  // Source image URL
    requestBody.strength = 1 - strength  // Inverted: 0 = keep original, 1 = full creativity
  }

  const response = await fetch('https://api.siliconflow.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('SiliconFlow API error:', response.status, errorBody.substring(0, 200))
    throw new Error(`SiliconFlow API failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // Check for errors in response
  if (data.error) {
    console.error('❌ SiliconFlow error:', data.error)
    throw new Error(data.error.message || JSON.stringify(data.error))
  }

  // SiliconFlow returns URL format: images[0].url or data[0].url
  const generatedImageUrl = data.images?.[0]?.url || data.data?.[0]?.url

  if (!generatedImageUrl) {
    throw new Error('No image URL found in SiliconFlow response')
  }

  // Download image from SiliconFlow URL
  const imageResponse = await fetch(generatedImageUrl)
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status}`)
  }

  // Convert to Buffer
  const arrayBuffer = await imageResponse.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Convert to Base64 for storage
  const base64Data = buffer.toString('base64')
  
  // Upload to Supabase Storage and return public URL + storage path
  const result = await uploadBase64ToStorage(base64Data, userId, generationId)
  return result
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
      strength = 0.85 // Image-to-image strength (0.1-1.0), default 0.85
    } = body

    if (!style || !userPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields: style, prompt' },
        { status: 400 }
      )
    }

    // 🎯 ASPECT RATIO FIX: Convert aspect ratio to SiliconFlow image_size format
    const imageSize = aspectRatioToImageSize(aspectRatio)

    // 3. Get style configuration
    const styleConfig = getStyleById(style)
    if (!styleConfig) {
      return NextResponse.json(
        { error: `Invalid style: ${style}` },
        { status: 400 }
      )
    }

    // 4. Construct final prompt with image-to-image optimization
    let finalPrompt = ''
    
    if (imageUrl) {
      // Image-to-image: Let the image be the PRIMARY reference
      // Prompt should be minimal and only describe the STYLE, not the subject
      // The subject (animal type, breed, features) comes from the IMAGE
      finalPrompt = `The EXACT SAME animal from the reference image, preserving ALL physical features, colors, and characteristics${styleConfig.promptSuffix}. Keep the subject identical to the reference photo.`
    } else {
      // Text-to-image: Standard prompt
      finalPrompt = `${userPrompt}, ${styleConfig.promptSuffix}`
    }

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
          provider: 'siliconflow',
          model: 'black-forest-labs/FLUX.1-dev',
          aspectRatio,
          imageSize,
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

    try {
      // 8. Call SiliconFlow API and upload to storage
      const { publicUrl: publicImageUrl, storagePath } = await generateWithSiliconFlow(
        finalPrompt, 
        user.id, 
        generation.id,
        imageSize,
        imageUrl,
        strength
      )

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
        console.error('CRITICAL: Failed to update generation status:', updateError)
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
