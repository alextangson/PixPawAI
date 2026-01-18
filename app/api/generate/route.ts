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
import { getStyleConfigWithFallback } from '@/lib/supabase/styles'
import { getStyleTierConfig, getDefaultTierConfig, adjustStrengthForComplexity } from '@/lib/style-tiers'
import Replicate from 'replicate'
import sharp from 'sharp'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import { logger } from '@/lib/logger'
import { parseUserPrompt, parseQwenFeatures, parseStylePrompt, cleanConflicts, buildPrompt } from '@/lib/prompt-system'
import { startFilteredFeaturesCollection, logFilteredFeature, getFilteredFeatures } from '@/lib/prompt-system/conflict-cleaner'

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
  petType?: string        // 🚨 CRITICAL: Pet type from detailed analysis (cat, dog, snake, etc.)
  detectedColors?: string // 🎨 NEW: Detailed color description (e.g., "white and gray fur with tabby markings")
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
      petType: 'pet',  // Default fallback
      detectedColors: '',
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
                text: '🔍 CRITICAL TASK: Analyze pet characteristics accurately\n\nYou are a pet analysis specialist. Your job is to:\n\n0. PET TYPE IDENTIFICATION (MOST IMPORTANT!):\n   - Identify the specific pet type: cat, dog, bird, rabbit, snake, lizard, turtle, hamster, guinea pig, ferret, fish, etc.\n   - Be specific and accurate\n   - This is the MOST CRITICAL field\n\n1. COLOR ANALYSIS (REQUIRED!):\n   - Describe the PRIMARY fur/feather/scale colors you see\n   - Be specific: "white and gray", "orange tabby", "black with white patches", "golden brown"\n   - Include markings: "tuxedo", "calico", "brindle"\n   - Output in detectedColors field\n\n2. PATTERN ANALYSIS (REQUIRED!):\n   - If complexPattern = true, specify pattern type in patternDetails:\n     * "stripes" or "tabby stripes" (for striped cats/animals)\n     * "spots" or "dalmatian spots" (for spotted animals)\n     * "patches" or "calico patches" (for multi-color patches)\n     * "brindle" (for tiger-stripe dogs)\n     * "merle" (for marbled patterns)\n   - If solid color, leave patternDetails empty\n\n3. HETEROCHROMIA DETECTION (STRICT):\n   ⚠️ ONLY mark as TRUE if you can CLEARLY SEE both eyes AND they are VISIBLY DIFFERENT colors\n   - Look at LEFT eye color (blue, brown, green, amber, etc.)\n   - Look at RIGHT eye color\n   - Are they CLEARLY DIFFERENT? Only then = heterochromia\n   - Example: "left eye blue, right eye brown"\n   - If you can\'t see both eyes clearly: hasHeterochromia = false\n   - If both eyes look the same color: hasHeterochromia = false\n\n4. BREED IDENTIFICATION:\n   - Identify the actual breed of the pet in the photo\n   - Be accurate - do not assume\n   - If unsure, output "unknown"\n\n5. KEY VISUAL FEATURES (IMPORTANT!):\n   - Describe VISIBLE features that define this pet\'s appearance\n   - Focus on: fur texture, distinctive markings, body shape, ear shape\n   - DO NOT describe actions or expressions (no "open mouth", "playing", etc.)\n   - Good examples: "fluffy long fur", "pointed ears", "short legs", "bushy tail"\n   - Bad examples: "open mouth", "happy expression", "looking at camera"\n\nOutput ONLY this JSON (no markdown, no explanation):\n{\n  "petType": "cat",\n  "detectedColors": "white and gray fur with tabby markings",\n  "hasHeterochromia": false,\n  "heterochromiaDetails": "",\n  "complexPattern": true,\n  "patternDetails": "tabby stripes",\n  "multiplePets": 1,\n  "breed": "American Shorthair",\n  "keyFeatures": "striped pattern, short fur, round face"\n}\n\nAnother example (dog):\n{"petType": "dog", "detectedColors": "golden cream colored fur", "hasHeterochromia": false, "heterochromiaDetails": "", "complexPattern": false, "patternDetails": "", "multiplePets": 1, "breed": "Golden Retriever", "keyFeatures": "fluffy long fur, floppy ears"}'
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
        petType: 'pet',  // Default fallback
        detectedColors: '',
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
      petType: 'pet',
      detectedColors: '',
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
  generationId: string,
  format: 'png' | 'webp' = 'png'
): Promise<{ publicUrl: string; storagePath: string }> {
  // Use admin client to bypass RLS policies
  const supabase = createAdminClient()
  
  // Convert Base64 to Buffer
  const buffer = Buffer.from(base64Data, 'base64')

  // Generate file path with correct extension
  const timestamp = Date.now()
  const extension = format === 'webp' ? 'webp' : 'png'
  const filePath = `${userId}/${timestamp}-${generationId}.${extension}`

  // Upload to Supabase Storage (public bucket)
  const { data, error } = await supabase.storage
    .from('generated-results')
    .upload(filePath, buffer, {
      contentType: `image/${format}`,
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
  guidance: number = 2.5,  // Dynamic guidance based on style tier
  negativePrompt?: string  // Optional negative prompt from new system
): Promise<{ publicUrl: string; storagePath: string; originalPath?: string }> {
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
  
  // Add negative prompt if provided (from new prompt system)
  if (negativePrompt && negativePrompt.trim()) {
    input.negative_prompt = negativePrompt
    console.log('🚫 Negative prompt added:', negativePrompt.substring(0, 100) + '...')
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
    const originalBuffer = Buffer.from(arrayBuffer)

    // Use sharp to compress image for fast loading (WebP format, 80% quality)
    const sharp = require('sharp')
    const compressedBuffer = await sharp(originalBuffer)
      .webp({ quality: 80 })
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .toBuffer()

    // Convert compressed image to Base64 for storage
    const compressedBase64 = compressedBuffer.toString('base64')
    
    // Upload compressed image to Supabase Storage for quick preview
    const compressedResult = await uploadBase64ToStorage(compressedBase64, userId, generationId, 'webp')
    
    // Also save original image info in metadata for high-quality download
    // Store original buffer reference for later download if needed
    const originalBase64 = originalBuffer.toString('base64')
    const originalResult = await uploadBase64ToStorage(originalBase64, userId, `${generationId}_original`, 'png')
    
    console.log(`✅ Image compression: Original=${(originalBuffer.length / 1024 / 1024).toFixed(2)}MB, Compressed=${(compressedBuffer.length / 1024 / 1024).toFixed(2)}MB`)
    
    // Return compressed URL for fast display, but include original path in metadata
    return { 
      publicUrl: compressedResult.publicUrl, 
      storagePath: compressedResult.storagePath,
      originalPath: originalResult.storagePath
    }
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
      guidance, // Accept guidance from frontend
      petName = '', // Pet name for Art Card title generation
      testMode = false // Test mode: skip DB operations
    } = body

    if (!style) {
      return NextResponse.json(
        { error: 'Missing required field: style' },
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

    // 3. Get style configuration (Database-first with fallback)
    const styleConfig = await getStyleConfigWithFallback(style)
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
    let finalNegativePrompt = ''
    const styleName = styleConfig.label || '3D Pixar'
    
    // 🔍 DEBUG: Force log environment variable status
    console.log('🔍 DEBUG - Environment Check:', {
      envVar: process.env.NEXT_PUBLIC_USE_NEW_PROMPT_SYSTEM,
      featureFlag: FEATURE_FLAGS.USE_NEW_PROMPT_SYSTEM,
      nodeEnv: process.env.NODE_ENV,
    })
    
    if (FEATURE_FLAGS.USE_NEW_PROMPT_SYSTEM) {
      // ========== NEW PROMPT SYSTEM ==========
      logger.info('PromptGeneration', 'Using NEW prompt system')
      logger.featureFlag('USE_NEW_PROMPT_SYSTEM', true)
      
      // 📊 启动被过滤特征收集（用于数据分析）
      startFilteredFeaturesCollection()
      
      try {
        // 1. Parse user input (from "Add Your Creative Touch" field)
        const userPromptResult = parseUserPrompt(userPrompt || '')
        logger.promptBuild('User Features Parsed (before filter)', userPromptResult)
        
        // 🎯 ENHANCEMENT MODE: User input only for scene/action/composition
        // Base features (breed/color/pattern) come ONLY from Qwen
        const ENHANCEMENT_TYPES = ['action', 'scene', 'composition', 'lighting', 'mood', 'style_modifier']
        const userEnhancementFeatures = userPromptResult.features.filter(f => 
          ENHANCEMENT_TYPES.includes(f.type)
        )
        
        const filteredUserResult = {
          ...userPromptResult,
          features: userEnhancementFeatures
        }
        
        logger.info('EnhancementMode', `Filtered user input: ${userPromptResult.features.length} → ${userEnhancementFeatures.length} (kept: ${ENHANCEMENT_TYPES.join(', ')})`)
        if (userPromptResult.features.length !== userEnhancementFeatures.length) {
          const removed = userPromptResult.features.filter(f => !ENHANCEMENT_TYPES.includes(f.type))
          logger.info('EnhancementMode', `Removed base features from user input: ${removed.map(f => `${f.type}:${f.value}`).join(', ')}`)
          
          // 记录被过滤的基础特征（用于数据分析）
          removed.forEach(feature => {
            logFilteredFeature({
              feature,
              reason: 'enhancement_mode_filter',
              context: {
                originalUserInput: userPrompt,
                styleId: style,
                petType: finalPetType
              }
            })
          })
        }
        
        // 2. Parse Qwen analysis results
        // 🚨 CRITICAL: Use petType from detailed analysis (most accurate)
        // Fallback to request body petType if detailed analysis didn't return it
        const finalPetType = petComplexity.petType || petType || 'pet'
        const qwenFeaturesWithPetType = {
          ...petComplexity,
          petType: finalPetType
        }
        logger.info('PetType Selection', `Using petType: ${finalPetType} (from ${petComplexity.petType ? 'detailed analysis' : 'quick check'})`)
        const qwenFeatures = parseQwenFeatures(qwenFeaturesWithPetType)
        logger.promptBuild('Qwen Features Parsed', qwenFeatures)
        
        // 3. Parse style template (using 'suffix' as source type)
        const styleFeatures = parseStylePrompt(styleConfig.promptSuffix, 'suffix')
        logger.promptBuild('Style Features Parsed', styleFeatures)
        
        // 4. Merge all features (Enhancement Mode: Qwen base + User enhancement + Style)
        // Priority: Base features (Qwen) → Enhancement features (User) → Style features
        const allFeatures = [...qwenFeatures, ...filteredUserResult.features, ...styleFeatures]
        logger.promptBuild('All Features Before Cleaning', { 
          count: allFeatures.length,
          qwenBase: qwenFeatures.length,
          userEnhancement: filteredUserResult.features.length,
          style: styleFeatures.length
        })
        
        // 5. Clean conflicts based on priority (可通过 feature flag 禁用)
        let cleaned = allFeatures
        let conflicts: any[] = []
        
        if (!FEATURE_FLAGS.DISABLE_CONFLICT_CLEANING) {
          // 默认：启用冲突检测（安全模式）
          const result = cleanConflicts(allFeatures)
          cleaned = result.cleaned
          conflicts = result.conflicts
          logger.promptBuild('Conflicts Detected', conflicts)
          logger.promptBuild('Cleaned Features', { count: cleaned.length })
        } else {
          // 实验性：禁用冲突检测（自由模式）
          logger.info('ExperimentalMode', 'Conflict cleaning DISABLED - All features passed to FLUX')
          logger.featureFlag('DISABLE_CONFLICT_CLEANING', true)
        }
        
        // 6. Build final prompts
        const promptResult = buildPrompt(cleaned, {
          includeQuality: true,
          negativePrompt: filteredUserResult.negativePrompt
        })
        
        // Construct final prompt with tier-specific strategy
        // Add aspect ratio guidance for better composition
        const aspectRatioGuide = aspectRatio === '1:1' ? 'square composition' :
                                 aspectRatio === '3:4' ? 'vertical portrait composition' :
                                 aspectRatio === '4:3' ? 'horizontal landscape composition' :
                                 aspectRatio === '16:9' ? 'wide cinematic composition' :
                                 aspectRatio === '9:16' ? 'tall vertical composition' : 'centered composition'
        
        if (tierConfig.tier <= 2) {
          // Tier 1-2: Feature preservation priority
          finalPrompt = `${promptResult.positive}, ${aspectRatioGuide}. Preserve exact features from reference image. Apply ${styleName} style.`
        } else {
          // Tier 3-4: Artistic style priority
          finalPrompt = `${promptResult.positive}, ${aspectRatioGuide}. ${styleName} style interpretation. Based on reference image.`
        }
        
        finalNegativePrompt = promptResult.negative
        
        logger.promptBuild('Final Prompts Built', {
          positive: finalPrompt.substring(0, 150) + '...',
          negative: finalNegativePrompt.substring(0, 100) + '...',
          metadata: promptResult.metadata
        })
        
        console.log('✨ NEW SYSTEM - Final Prompt:', finalPrompt.substring(0, 150) + '...')
        
      } catch (error: any) {
        logger.error('PromptGeneration', `New system failed, falling back to old: ${error.message}`)
        console.error('⚠️ New prompt system error, using fallback:', error)
        
        // Clear finalPrompt to trigger fallback to old system
        finalPrompt = ''
        finalNegativePrompt = ''
      }
    }
    
    // Use old system if new system is disabled OR if new system failed (finalPrompt is empty)
    if (!FEATURE_FLAGS.USE_NEW_PROMPT_SYSTEM || !finalPrompt) {
      // ========== OLD PROMPT SYSTEM (FALLBACK) ==========
      logger.info('PromptGeneration', 'Using OLD prompt system (fallback)')
      
      // Add aspect ratio guidance for better composition
      const aspectRatioGuide = aspectRatio === '1:1' ? 'square composition' :
                               aspectRatio === '3:4' ? 'vertical portrait composition' :
                               aspectRatio === '4:3' ? 'horizontal landscape composition' :
                               aspectRatio === '16:9' ? 'wide cinematic composition' :
                               aspectRatio === '9:16' ? 'tall vertical composition' : 'centered composition'
      
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
          // Tier 1-2: 写实/轻艺术 - 强调特征保留，但也需要清理颜色强制
          const cleanSuffix = styleConfig.promptSuffix
            .replace(/soft white fur/gi, 'fur')
            .replace(/white and pink/gi, 'colorful')
            .replace(/pink and white/gi, 'colorful')
            .replace(/yellow and pink/gi, 'colorful')
            .replace(/orange turtleneck/gi, 'turtleneck')
            .replace(/olive green background/gi, 'solid background')
          
          finalPrompt = `${featurePrefix}preserve exact fur colors, patterns, and facial features from reference image. ${userPrompt}${cleanSuffix}, ${aspectRatioGuide}. Keep original appearance, only apply ${styleName} artistic style.`
        } else {
          // Tier 3-4: 强艺术 - 平衡风格和特征
          // 清理可能冲突的颜色/特征描述，保留艺术风格
          const cleanSuffix = styleConfig.promptSuffix
            .replace(/warm/gi, '')
            .replace(/bright/gi, '')
            .replace(/soft white fur/gi, 'fur')
            .replace(/white and pink/gi, 'colorful')
            .replace(/pink and white/gi, 'colorful')
            .replace(/pastel pink and white/gi, 'pastel')
            .replace(/yellow and pink/gi, 'colorful')
            .replace(/blue and yellow/gi, 'colorful')
            .replace(/orange turtleneck/gi, 'turtleneck')
            .replace(/olive green background/gi, 'solid background')
          
          finalPrompt = `${featurePrefix}${userPrompt}${cleanSuffix}, ${aspectRatioGuide}. Based on reference image, maintain core breed characteristics and distinctive features.`
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
        finalPrompt = `${userPrompt}${styleConfig.promptSuffix}, ${aspectRatioGuide}. Professional quality, highly detailed.`
      }
      
      console.log('📝 OLD SYSTEM - Final Prompt:', finalPrompt.substring(0, 150) + '...')
    }

    // TEST MODE: Skip database operations and credits
    if (testMode) {
      console.log('🧪 TEST MODE: Skipping credits and database operations')
      
      try {
        // Use frontend params or calculated params
        const finalStrength = strength !== undefined ? strength : adjustedStrength
        const finalGuidance = guidance !== undefined ? guidance : tierConfig.guidance
        
        const { publicUrl } = await generateWithReplicate(
          finalPrompt,
          user.id,
          'test-' + crypto.randomUUID(),
          processedImageUrl,
          finalStrength,
          finalGuidance,
          finalNegativePrompt || undefined
        )
        
        console.log(`🎨 TEST MODE - Generation complete: strength=${finalStrength.toFixed(2)}, guidance=${finalGuidance}`)
        
        return NextResponse.json({
          success: true,
          outputUrl: publicUrl,
          testMode: true,
          message: 'Test generation - not saved to database',
          params: {
            strength: finalStrength,
            guidance: finalGuidance,
            aspectRatio
          }
        })
      } catch (error: any) {
        console.error('❌ Test generation failed:', error)
        return NextResponse.json(
          { error: 'Test generation failed', message: error.message },
          { status: 500 }
        )
      }
    }

    // NORMAL MODE: Check credits and create records
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
      const finalGuidance = guidance || tierConfig.guidance
      
      const { publicUrl: publicImageUrl, storagePath, originalPath} = await generateWithReplicate(
        finalPrompt, 
        user.id, 
        generation.id,
        processedImageUrl,  // Pre-processed image (already correct dimensions)
        finalStrength,  // Use frontend or calculated strength
        finalGuidance,  // Use frontend or calculated guidance
        finalNegativePrompt || undefined  // Negative prompt from new system
      )
      
      console.log(`🎨 Final Generation Params: strength=${finalStrength.toFixed(2)} (${strength ? 'frontend' : 'calculated'}), guidance=${finalGuidance} (${guidance ? 'frontend' : 'calculated'})`)

      // 9. Update generation record (status: succeeded)
      // Use admin client to bypass any RLS issues
      const adminSupabase = createAdminClient()
      const { error: updateError } = await adminSupabase
        .from('generations')
        .update({
          status: 'succeeded',
          output_url: publicImageUrl, // Compressed WebP for fast preview
          output_storage_path: storagePath, // ✅ Save storage path for reliable deletion
          input_url: imageUrl || '',  // Original image URL (not pre-processed)
          metadata: {
            ...generation.metadata,
            completedAt: new Date().toISOString(),
            storageUrl: publicImageUrl,
            originalImagePath: originalPath, // High-quality PNG for download
            preprocessedUrl: processedImageUrl !== imageUrl ? processedImageUrl : undefined,
            visionAnalysis: petComplexity.keyFeatures || undefined,
            petComplexity: petComplexity,
            tierConfig: {
              tier: tierConfig.tier,
              baseStrength: baseStrength,
              adjustedStrength: adjustedStrength,
              guidance: finalGuidance
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

      // 9.5. Pre-generate default Art Card for faster UX (non-blocking)
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const defaultCardResponse = await fetch(`${siteUrl}/api/create-share-card`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generation_id: generation.id,
            custom_title: artCardTitle,
            custom_slogan: 'Every paw has a story to tell'
          })
        })
        
        if (defaultCardResponse.ok) {
          const { share_card_url } = await defaultCardResponse.json()
          
          // Update generation with pre-generated card URL
          await adminSupabase
            .from('generations')
            .update({
              metadata: {
                ...generation.metadata,
                preGeneratedCardUrl: share_card_url
              }
            })
            .eq('id', generation.id)
          
          console.log('✅ Pre-generated Art Card:', share_card_url)
        }
      } catch (cardError) {
        // Non-critical, log and continue
        console.error('⚠️ Failed to pre-generate Art Card (non-critical):', cardError)
      }

      // 9.6. Save filtered features log (data collection for Phase 2 analysis)
      if (FEATURE_FLAGS.USE_NEW_PROMPT_SYSTEM) {
        try {
          const filteredFeatures = getFilteredFeatures()
          
          if (filteredFeatures.length > 0) {
            console.log(`📊 Data Collection: ${filteredFeatures.length} features were filtered`)
            
            // Batch insert filtered features
            const logsToInsert = filteredFeatures.map(filtered => ({
              user_id: user.id,
              generation_id: generation.id,
              feature_type: filtered.feature.type,
              feature_value: filtered.feature.value,
              feature_normalized: filtered.feature.normalized,
              feature_priority: filtered.feature.priority,
              feature_source: filtered.feature.source,
              filter_reason: filtered.reason,
              conflict_with_type: filtered.conflictWith?.type || null,
              conflict_with_value: filtered.conflictWith?.value || null,
              original_user_input: filtered.context?.originalUserInput || userPrompt || null,
              style_id: filtered.context?.styleId || style,
              pet_type: filtered.context?.petType || petType || null,
              metadata: {
                feature: filtered.feature,
                conflictWith: filtered.conflictWith,
                context: filtered.context
              }
            }))
            
            const { error: logError } = await adminSupabase
              .from('filtered_features_log')
              .insert(logsToInsert)
            
            if (logError) {
              // Non-critical, just log the error
              console.error('⚠️ Failed to save filtered features log:', logError)
            } else {
              console.log(`✅ Saved ${logsToInsert.length} filtered features to database`)
            }
          }
        } catch (logError) {
          // Non-critical, don't block generation success
          console.error('⚠️ Error in filtered features logging:', logError)
        }
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
