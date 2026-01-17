/**
 * AI Image Generation API Endpoint
 * POST /api/generate
 * Using Replicate API with FLUX.1-dev for true image-to-image generation
 * Supports aspect ratio selection and smart canvas processing
 * Cost: $0.025/image
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getStyleById } from '@/lib/styles'
import Replicate from 'replicate'
import sharp from 'sharp'

// Logging disabled for performance - large objects cause 100% CPU usage

/**
 * Pre-process image with blurred background padding
 * This ensures the output matches the target aspect ratio perfectly
 * while keeping the pet complete and centered
 */
async function padImageWithBlur(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number,
  userId: string,
  generationId: string
): Promise<string> {
  // Fetch the original image
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }
  
  const sourceBuffer = Buffer.from(await response.arrayBuffer())
  
  // Layer 1 (Background): Blurred and darkened version to fill the canvas
  const blurredBackground = await sharp(sourceBuffer)
    .resize(targetWidth, targetHeight, {
      fit: 'cover',  // Fill entire canvas
      position: 'attention',  // Smart crop
      kernel: sharp.kernel.lanczos3,
    })
    .blur(50)  // Heavy blur for artistic background
    .modulate({ brightness: 0.7 })  // Darken slightly
    .toBuffer()
  
  // Layer 2 (Foreground): Clear pet image fitted inside
  const clearPet = await sharp(sourceBuffer)
    .resize(targetWidth, targetHeight, {
      fit: 'inside',  // Fit entire pet without cropping
      kernel: sharp.kernel.lanczos3,
    })
    .toBuffer()
  
  // Get dimensions of fitted pet for centering
  const metadata = await sharp(clearPet).metadata()
  const offsetX = Math.round((targetWidth - (metadata.width || targetWidth)) / 2)
  const offsetY = Math.round((targetHeight - (metadata.height || targetHeight)) / 2)
  
  // Composite clear pet over blurred background
  const finalBuffer = await sharp(blurredBackground)
    .composite([
      {
        input: clearPet,
        left: offsetX,
        top: offsetY,
      }
    ])
    .png({ quality: 100 })
    .toBuffer()
  
  // Upload to Supabase
  const supabase = createAdminClient()
  const timestamp = Date.now()
  const filePath = `${userId}/preprocessed/${timestamp}-${generationId}.png`
  
  const { data, error } = await supabase.storage
    .from('generated-results')
    .upload(filePath, finalBuffer, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false,
    })
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }
  
  const { data: urlData } = supabase.storage
    .from('generated-results')
    .getPublicUrl(data.path)
  
  console.log(`✅ Image preprocessed: ${targetWidth}x${targetHeight}`)
  
  return urlData.publicUrl
}

/**
 * Analyze pet features using SiliconFlow Qwen2-VL-72B
 * Qwen2-VL is one of the best open-source vision models, excellent at identifying:
 * - Pet breeds
 * - Heterochromia (different eye colors)
 * - Unique markings and patterns
 * - Fur colors and textures
 */
async function analyzePetFeatures(imageUrl: string): Promise<string> {
  const apiKey = process.env.SILICONFLOW_API_KEY
  
  if (!apiKey) {
    console.warn('⚠️ SILICONFLOW_API_KEY not configured, skipping vision analysis')
    return ''
  }
  
  try {
    const response = await fetch('https://api.siliconflow.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-VL-72B-Instruct',  // 🔑 Updated to correct model name
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              },
              {
                type: 'text',
                text: 'You are a professional pet breed identification expert. Analyze this pet photo and describe ONLY the physical features in one concise sentence. Include: 1) EXACT BREED NAME (e.g., Samoyed, Border Collie), 2) Eye color (if heterochromia, specify BOTH colors like "left eye blue, right eye brown"), 3) Fur color and pattern, 4) Distinctive markings. Do NOT describe pose, background, or accessories.'
              }
            ]
          }
        ],
        max_tokens: 150,
        temperature: 0.2,  // Lower temperature for more consistent breed identification
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('SiliconFlow Vision API error:', response.status, errorText.substring(0, 200))
      return ''
    }
    
    const data = await response.json()
    const description = data.choices?.[0]?.message?.content?.trim() || ''
    
    console.log('🔍 Qwen2-VL Analysis Result:', description)
    
    return description
  } catch (error: any) {
    console.error('❌ Vision analysis failed:', error.message)
    return ''
  }
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
 * Generate image using Replicate API with FLUX.1-dev model
 * Uses image-to-image for true breed/feature preservation
 * Returns the public Supabase Storage URL and storage path
 */
async function generateWithReplicate(
  finalPrompt: string,
  userId: string,
  generationId: string,
  imageUrl?: string,  // Pre-processed image URL (already correct size)
  promptStrength: number = 0.82  // Higher strength for better style application
): Promise<{ publicUrl: string; storagePath: string }> {
  const apiKey = process.env.REPLICATE_API_TOKEN

  if (!apiKey) {
    throw new Error('REPLICATE_API_TOKEN is not configured')
  }

  // Initialize Replicate client
  const replicate = new Replicate({
    auth: apiKey,
  })

  // Build input for FLUX-dev
  const input: any = {
    prompt: finalPrompt,
    num_outputs: 1,
    output_format: "png",
    output_quality: 100,
    disable_safety_checker: true,
    num_inference_steps: 50,
    guidance: 3.5,
  }

  // 🎨 Image-to-image mode
  if (imageUrl) {
    // CRITICAL: Image is already pre-processed to correct dimensions
    // DO NOT send width/height - let Replicate match the input image size
    input.image = imageUrl  // Pre-processed image URL
    input.prompt_strength = promptStrength  // Higher strength = stronger style and feature correction
    
    console.log('✅ Image-to-image mode:', { 
      promptStrength: input.prompt_strength,
      strategy: 'Pre-processed image (already correct size)',
      imageUrl: imageUrl.substring(0, 60) + '...'
    })
  } else {
    // Text-to-image mode
    input.aspect_ratio = "1:1"  // Default for text-to-image
  }

  console.log('🚀 Calling Replicate FLUX-dev with params:', {
    model: 'black-forest-labs/flux-dev',
    mode: imageUrl ? 'image-to-image' : 'text-to-image',
    aspectRatio: input.aspect_ratio,
    promptStrength: input.prompt_strength,
    guidance: input.guidance,
    hasImage: !!input.image,
    prompt: finalPrompt.substring(0, 80) + '...'
  })

  try {
    // Run FLUX-dev model
    const output = await replicate.run(
      "black-forest-labs/flux-dev" as `${string}/${string}`,
      { input }
    )

    console.log('✅ Replicate generation complete')

    // FLUX-dev returns an array of image URLs
    let generatedImageUrl: string
    if (Array.isArray(output) && output.length > 0) {
      generatedImageUrl = output[0] as string
    } else if (typeof output === 'string') {
      generatedImageUrl = output
    } else {
      throw new Error('Unexpected output format from Replicate')
    }

    // Download image from Replicate URL
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
  } catch (error: any) {
    console.error('❌ Replicate API error:', error)
    throw new Error(`Replicate generation failed: ${error.message}`)
  }
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

    // STEP A: Determine target dimensions based on aspect ratio
    let targetWidth = 1024
    let targetHeight = 1024
    
    switch (aspectRatio) {
      case "3:4":
        targetWidth = 768
        targetHeight = 1024
        break
      case "4:3":
        targetWidth = 1024
        targetHeight = 768
        break
      case "16:9":
        targetWidth = 1024
        targetHeight = 576
        break
      case "9:16":
        targetWidth = 576
        targetHeight = 1024
        break
      default: // "1:1"
        targetWidth = 1024
        targetHeight = 1024
    }

    // 3. Get style configuration
    const styleConfig = getStyleById(style)
    if (!styleConfig) {
      return NextResponse.json(
        { error: `Invalid style: ${style}` },
        { status: 400 }
      )
    }

    // STEP B: VISION ANALYSIS - Analyze pet features before generation
    let visionDescription = ''
    if (imageUrl) {
      try {
        console.log('🔍 Starting vision analysis...')
        visionDescription = await analyzePetFeatures(imageUrl)
        if (visionDescription) {
          console.log('✅ Vision analysis:', visionDescription)
        }
      } catch (error: any) {
        console.error('⚠️ Vision analysis failed, continuing without it:', error.message)
        // Continue without vision - not critical
      }
    }

    // STEP C: PRE-PROCESS IMAGE - Pad with blurred background to exact dimensions
    let processedImageUrl = imageUrl
    if (imageUrl) {
      try {
        console.log(`🎨 Pre-processing image to ${targetWidth}x${targetHeight}...`)
        processedImageUrl = await padImageWithBlur(
          imageUrl,
          targetWidth,
          targetHeight,
          user.id,
          crypto.randomUUID()  // Generate temp ID for preprocessing
        )
        console.log('✅ Image pre-processed successfully')
      } catch (error: any) {
        console.error('⚠️ Pre-processing failed, using original:', error.message)
        processedImageUrl = imageUrl  // Fallback to original
      }
    }

    // STEP D: CONSTRUCT STRONG PROMPT - BREED FIRST, then details, then style
    let finalPrompt = ''
    
    if (imageUrl && visionDescription) {
      // 🎯 VISION-ENHANCED PROMPT (BREED PRIORITY)
      // Structure: [BREED + PHYSICAL FEATURES] first → [User Details] → [Style Last]
      // This ensures the AI prioritizes preserving the exact breed and unique features
      finalPrompt = `A ${visionDescription}, ${userPrompt}${styleConfig.promptSuffix}. Maintain the exact breed characteristics, preserve all unique physical features including eye colors and fur patterns. Professional portrait, high detail.`
    } else if (imageUrl) {
      // FALLBACK: No vision analysis available
      finalPrompt = `The exact same pet from the reference image, ${userPrompt}${styleConfig.promptSuffix}. Preserve all unique features including breed, eye colors, fur patterns, and markings. Professional quality, high detail.`
    } else {
      // Text-to-image: Standard prompt
      finalPrompt = `${userPrompt}${styleConfig.promptSuffix}`
    }
    
    console.log('📝 Final Prompt:', finalPrompt.substring(0, 150) + '...')

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
          provider: 'replicate',
          model: 'black-forest-labs/flux-dev',
          aspectRatio,
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
      // STEP E: Call Replicate API with pre-processed image and strong prompt
      const { publicUrl: publicImageUrl, storagePath } = await generateWithReplicate(
        finalPrompt, 
        user.id, 
        generation.id,
        processedImageUrl,  // Pre-processed image (already correct dimensions)
        strength || 0.82  // Higher strength for better style application
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
          input_url: imageUrl || '',  // Original image URL (not pre-processed)
          metadata: {
            ...generation.metadata,
            completedAt: new Date().toISOString(),
            storageUrl: publicImageUrl,
            preprocessedUrl: processedImageUrl !== imageUrl ? processedImageUrl : undefined,
            visionAnalysis: visionDescription || undefined,
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
