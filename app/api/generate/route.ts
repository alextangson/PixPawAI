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
import { getStyleTierConfig, getDefaultTierConfig, adjustStrengthForComplexity } from '@/lib/style-tiers'
import Replicate from 'replicate'
import sharp from 'sharp'

// Logging disabled for performance - large objects cause 100% CPU usage

/**
 * Generate Art Card title from pet name and style
 */
function generateArtCardTitle(petName: string, styleName: string): string {
  const styleKeywords: Record<string, string[]> = {
    'Johannes Vermeer': ['Renaissance Portrait', 'Timeless Masterpiece', 'Classical Beauty'],
    'Victorian-Royal': ['Royal Majesty', 'Regal Portrait', 'Noble Heritage'],
    'Christmas-Vibe': ['Holiday Magic', 'Christmas Star', 'Festive Joy'],
    'Flower-Crown': ['Blooming Beauty', 'Floral Princess', 'Garden Dream'],
    'Birthday-Party': ['Birthday Star', 'Celebration Joy', 'Party Pup'],
    'Embroidery-Art': ['Stitched Masterpiece', 'Textile Art', 'Embroidered Beauty'],
    'Watercolor-Dream': ['Watercolor Wonder', 'Painted Dream', 'Artistic Vision'],
    'Pixel-Mosaic': ['Pixel Perfect', 'Digital Mosaic', 'Retro Art'],
    'Retro-Pop-Art': ['Pop Art Star', 'Retro Icon', 'Bold & Bright'],
    'Spring-Vibes': ['Spring Blossom', 'Fresh & Floral', 'Springtime Joy']
  }
  
  if (!petName || !petName.trim()) {
    return `A ${styleName} Masterpiece`
  }
  
  const keywords = styleKeywords[styleName] || ['Stunning Portrait']
  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)]
  
  return `${petName.trim()} - ${randomKeyword}`
}

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
 * Pet complexity analysis result
 */
interface PetComplexity {
  hasHeterochromia: boolean
  heterochromiaDetails: string
  complexPattern: boolean
  patternDetails: string
  multiplePets: number
  breed: string
  keyFeatures: string
}

/**
 * Analyze pet features using SiliconFlow Qwen2-VL-72B
 * Returns structured data for dynamic strength adjustment
 */
async function analyzePetFeatures(imageUrl: string): Promise<PetComplexity> {
  const apiKey = process.env.SILICONFLOW_API_KEY
  
  if (!apiKey) {
    console.warn('⚠️ SILICONFLOW_API_KEY not configured, skipping vision analysis')
    return {
      hasHeterochromia: false,
      heterochromiaDetails: '',
      complexPattern: false,
      patternDetails: '',
      multiplePets: 1,
      breed: 'unknown',
      keyFeatures: 'standard pet'
    }
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
                text: '🔍 CRITICAL TASK: Detect heterochromia (different colored eyes)\n\nYou are a pet eye color specialist. Your PRIMARY job is to examine EACH eye separately and compare their colors.\n\nSTEP 1: Look at the LEFT eye - what color is it? (blue, brown, green, amber, etc.)\nSTEP 2: Look at the RIGHT eye - what color is it?\nSTEP 3: Are they DIFFERENT colors? If yes, this is HETEROCHROMIA.\n\nCommon heterochromia in Huskies:\n- One eye BLUE, one eye BROWN/AMBER\n- One eye ICE BLUE, one eye DARK BROWN\n\nAlso check:\n- Breed: Husky, Corgi, Dalmatian, Persian, Siamese\n- Complex patterns: spots/stripes\n- Multiple pets: count them\n\nOutput ONLY this JSON (no markdown, no explanation):\n{\n  "hasHeterochromia": true,\n  "heterochromiaDetails": "left eye blue, right eye brown",\n  "complexPattern": false,\n  "patternDetails": "",\n  "multiplePets": 1,\n  "breed": "Siberian Husky",\n  "keyFeatures": "heterochromia detected"\n}\n\nIf NO heterochromia:\n{"hasHeterochromia": false, "heterochromiaDetails": "", "complexPattern": false, "patternDetails": "", "multiplePets": 1, "breed": "Siberian Husky", "keyFeatures": "standard Husky"}'
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
      return {
        hasHeterochromia: false,
        heterochromiaDetails: '',
        complexPattern: false,
        patternDetails: '',
        multiplePets: 1,
        breed: 'unknown',
        keyFeatures: 'analysis failed'
      }
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''
    
    console.log('🔍 Qwen2-VL Raw Response:', content)
    
    // Parse JSON response
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      
      const parsed = JSON.parse(jsonStr) as PetComplexity
      console.log('✅ Parsed Pet Complexity:', parsed)
      return parsed
    } catch (parseError) {
      console.error('❌ Failed to parse JSON from Qwen:', content)
      console.log('🔄 Attempting text-based fallback detection...')
      
      // Fallback: Enhanced text-based detection
      const lowerContent = content.toLowerCase()
      
      // Enhanced heterochromia detection
      const hasHeteroKeyword = lowerContent.includes('heterochromia') || 
                                lowerContent.includes('different eye') ||
                                lowerContent.includes('different colored eye')
      
      // Detect if mentions both blue and brown eyes (common heterochromia)
      const mentionsBlueEye = lowerContent.includes('blue eye') || 
                               lowerContent.includes('blue-eye') ||
                               lowerContent.match(/eye.*blue|blue.*eye/)
      const mentionsBrownEye = lowerContent.includes('brown eye') || 
                                lowerContent.includes('amber eye') ||
                                lowerContent.match(/eye.*(brown|amber)|(brown|amber).*eye/)
      
      const heterochromiaDetected = hasHeteroKeyword || (mentionsBlueEye && mentionsBrownEye)
      
      // Try to extract eye color details
      let heterochromiaDetails = ''
      if (heterochromiaDetected) {
        const leftEyeMatch = content.match(/left eye[:\s]*(blue|brown|amber|green)/i)
        const rightEyeMatch = content.match(/right eye[:\s]*(blue|brown|amber|green)/i)
        if (leftEyeMatch && rightEyeMatch) {
          heterochromiaDetails = `left ${leftEyeMatch[1]}, right ${rightEyeMatch[1]}`
        } else {
          heterochromiaDetails = 'detected but details unclear'
        }
      }
      
      console.log(`🔍 Fallback Detection - Heterochromia: ${heterochromiaDetected}, Details: ${heterochromiaDetails}`)
      
      return {
        hasHeterochromia: heterochromiaDetected,
        heterochromiaDetails: heterochromiaDetails,
        complexPattern: lowerContent.includes('pattern') || lowerContent.includes('marking') || lowerContent.includes('spot'),
        patternDetails: '',
        multiplePets: (content.match(/\d+\s*pet/i)?.[0] || '1').match(/\d+/)?.[0] ? parseInt(content.match(/\d+/)?.[0] || '1') : 1,
        breed: content.match(/(husky|corgi|dalmatian|persian|siamese)/i)?.[0] || 'unknown',
        keyFeatures: heterochromiaDetected ? 'heterochromia detected (fallback)' : content.substring(0, 80)
      }
    }
  } catch (error: any) {
    console.error('❌ Vision analysis failed:', error.message)
    return {
      hasHeterochromia: false,
      heterochromiaDetails: '',
      complexPattern: false,
      patternDetails: '',
      multiplePets: 1,
      breed: 'unknown',
      keyFeatures: 'error'
    }
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
  promptStrength: number = 0.35,  // Dynamic strength based on style tier
  guidance: number = 2.5  // Dynamic guidance based on style tier
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
    guidance: guidance,  // Dynamic guidance based on style tier
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
      strength, // Accept from frontend but don't set default here
      petName = '' // Pet name for Art Card title generation
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
    let petComplexity: PetComplexity = {
      hasHeterochromia: false,
      heterochromiaDetails: '',
      complexPattern: false,
      patternDetails: '',
      multiplePets: 1,
      breed: 'unknown',
      keyFeatures: 'standard pet'
    }
    
    if (imageUrl) {
      try {
        console.log('🔍 Starting vision analysis...')
        petComplexity = await analyzePetFeatures(imageUrl)
        console.log('✅ Pet Complexity Analysis:', {
          heterochromia: petComplexity.hasHeterochromia,
          complexPattern: petComplexity.complexPattern,
          pets: petComplexity.multiplePets,
          breed: petComplexity.breed
        })
      } catch (error: any) {
        console.error('⚠️ Vision analysis failed, continuing without it:', error.message)
        // Continue with default values
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

    // STEP D: GET STYLE TIER CONFIG and ADJUST STRENGTH
    const tierConfig = getStyleTierConfig(style) || getDefaultTierConfig()
    const baseStrength = tierConfig.strength
    const adjustedStrength = adjustStrengthForComplexity(baseStrength, {
      hasHeterochromia: petComplexity.hasHeterochromia,
      complexPattern: petComplexity.complexPattern,
      multiplePets: petComplexity.multiplePets
    })
    
    console.log(`🎯 Style Tier ${tierConfig.tier}: ${style}`)
    console.log(`   Base strength: ${baseStrength.toFixed(2)} → Adjusted: ${adjustedStrength.toFixed(2)}`)
    console.log(`   Guidance: ${tierConfig.guidance}`)
    console.log(`   Expected similarity: ${tierConfig.expectedSimilarity}`)
    
    // STEP E: CONSTRUCT TIER-APPROPRIATE PROMPT
    let finalPrompt = ''
    const styleName = styleConfig.label || '3D Pixar'
    
    if (imageUrl) {
      // Build feature preservation prefix
      let featurePrefix = ''
      
      // Add breed constraint if detected
      if (petComplexity.breed !== 'unknown') {
        featurePrefix += `${petComplexity.breed}, `
      }
      
      // Add heterochromia constraint
      if (petComplexity.hasHeterochromia && petComplexity.heterochromiaDetails) {
        featurePrefix += `with heterochromia (${petComplexity.heterochromiaDetails}), `
      }
      
      // Tier-specific prompt strategy
      if (tierConfig.tier <= 2) {
        // Tier 1-2: 写实/轻艺术 - 强调特征保留
        finalPrompt = `${featurePrefix}preserve exact fur colors, patterns, and facial features from reference image. ${userPrompt}${styleConfig.promptSuffix}. Keep original appearance, only apply ${styleName} artistic style.`
      } else {
        // Tier 3-4: 强艺术 - 平衡风格和特征
        // 清理可能冲突的颜色描述
        const cleanSuffix = styleConfig.promptSuffix
          .replace(/warm/gi, '')
          .replace(/bright/gi, '')
          .replace(/soft white fur/gi, 'fur')
        
        finalPrompt = `${featurePrefix}${userPrompt}${cleanSuffix}. Based on reference image, maintain core breed characteristics and distinctive features.`
      }
      
      // Add complexity-specific reminders
      if (petComplexity.complexPattern) {
        finalPrompt += ` Preserve intricate patterns and markings.`
      }
      if (petComplexity.multiplePets > 1) {
        finalPrompt += ` Image contains ${petComplexity.multiplePets} pets, keep all visible.`
      }
    } else {
      // TEXT-TO-IMAGE MODE
      finalPrompt = `${userPrompt}${styleConfig.promptSuffix}. Professional quality, highly detailed.`
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
    // Generate Art Card title
    const artCardTitle = generateArtCardTitle(petName, styleConfig.label || style)
    
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
        pet_name: petName || null,
        art_card_title: artCardTitle,
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
      // STEP F: Call Replicate API with tier-optimized parameters
      // Use frontend strength if provided, otherwise use tier-based calculation
      const finalStrength = strength || adjustedStrength
      
      const { publicUrl: publicImageUrl, storagePath} = await generateWithReplicate(
        finalPrompt, 
        user.id, 
        generation.id,
        processedImageUrl,  // Pre-processed image (already correct dimensions)
        finalStrength,  // Use frontend or calculated strength
        tierConfig.guidance  // Dynamic guidance based on tier
      )
      
      console.log(`🎨 Final Generation Params: strength=${finalStrength.toFixed(2)} (${strength ? 'frontend' : 'calculated'}), guidance=${tierConfig.guidance}`)

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
            visionAnalysis: petComplexity.keyFeatures || undefined,
            petComplexity: petComplexity,
            tierConfig: {
              tier: tierConfig.tier,
              baseStrength: baseStrength,
              adjustedStrength: adjustedStrength,
              guidance: tierConfig.guidance
            },
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
