import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface QualityCheckResult {
  isSafe: boolean
  unsafeReason: 'none' | 'nudity' | 'gore' | 'hate' | 'violence'
  hasPet: boolean
  petType: string
  quality: 'excellent' | 'good' | 'poor' | 'unusable'
  issues: string[]
  hasHeterochromia: boolean
  heterochromiaDetails: string
  breed: string
  complexPattern: boolean
  multiplePets: number
  detectedColors: string
}

async function analyzeImageQuality(imageUrl: string): Promise<QualityCheckResult> {
  const QWEN_API_KEY = process.env.SILICONFLOW_API_KEY
  
  if (!QWEN_API_KEY) {
    throw new Error('QWEN API KEY not configured')
  }
  
  // Validate image URL
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('Invalid imageUrl provided')
  }
  
  // Check if imageUrl is accessible
  try {
    const urlTest = new URL(imageUrl)
    if (!['http:', 'https:'].includes(urlTest.protocol)) {
      throw new Error('Image URL must be http or https')
    }
  } catch (urlError) {
    console.error('❌ Invalid image URL format:', imageUrl.substring(0, 100))
    throw new Error(`Invalid image URL: ${urlError instanceof Error ? urlError.message : 'Invalid URL format'}`)
  }
  
  const prompt = `You are a pet photo quality inspector, content moderator, and feature analyst.

STEP 1: Content Safety Check (CRITICAL - CHECK FIRST)
Does this image contain any of the following inappropriate content?
- Human nudity or sexual content (exposed genitals, breasts, buttocks)
- Gore, violence, or blood (injuries, weapons, dead animals)
- Hate symbols or offensive gestures

IMPORTANT NOTES:
- Hairless pets (Sphynx cats, Chinese Crested dogs) are SAFE and ALLOWED
- Pet anatomy (nose close-ups, paw pads, belly fur, pink skin) is SAFE and ALLOWED
- Pet nursing or natural behaviors are SAFE and ALLOWED
- Humans holding/petting animals (hands/arms visible) is SAFE and ALLOWED

If unsafe content detected, set "isSafe": false and specify reason.
If safe, set "isSafe": true and "unsafeReason": "none", then continue to Step 2.

STEP 2: Photo Quality Check
- Is there a pet in this photo? (yes/no)
- If yes, what type? (be specific: dog, cat, rabbit, bird, hamster, guinea pig, snake, lizard, turtle, fish, ferret, chinchilla, hedgehog, parrot, etc.)
- Photo quality? (excellent/good/poor/unusable)
- Issues? (blurry, too_small, poor_lighting, obstructed, no_pet)

STEP 3: If quality is acceptable (excellent/good), analyze features:
- Heterochromia? (left eye color, right eye color)
- Breed? (if distinctive)
- Complex patterns? (spots, stripes, markings)
- Multiple pets? (count)

Output ONLY this JSON:
{
  "isSafe": true,
  "unsafeReason": "none",
  "hasPet": true,
  "petType": "dog",
  "quality": "good",
  "issues": [],
  "hasHeterochromia": false,
  "heterochromiaDetails": "",
  "breed": "Golden Retriever",
  "complexPattern": false,
  "multiplePets": 1,
  "detectedColors": "golden fur"
}

If UNSAFE content detected:
{
  "isSafe": false,
  "unsafeReason": "nudity",
  "hasPet": false,
  "petType": "none",
  "quality": "unusable",
  "issues": ["inappropriate_content"],
  "hasHeterochromia": false,
  "heterochromiaDetails": "",
  "breed": "",
  "complexPattern": false,
  "multiplePets": 0,
  "detectedColors": ""
}

If quality is poor/unusable but safe:
{
  "isSafe": true,
  "unsafeReason": "none",
  "hasPet": true,
  "petType": "dog",
  "quality": "poor",
  "issues": ["blurry", "too_small"],
  "hasHeterochromia": false,
  "heterochromiaDetails": "",
  "breed": "unknown",
  "complexPattern": false,
  "multiplePets": 1,
  "detectedColors": ""
}

If no pet detected but safe:
{
  "isSafe": true,
  "unsafeReason": "none",
  "hasPet": false,
  "petType": "none",
  "quality": "unusable",
  "issues": ["no_pet"],
  "hasHeterochromia": false,
  "heterochromiaDetails": "",
  "breed": "",
  "complexPattern": false,
  "multiplePets": 0,
  "detectedColors": ""
}`

  try {
    const response = await fetch('https://api.siliconflow.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-VL-72B-Instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = 'Failed to read error response'
      }
      
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500),
        imageUrl: imageUrl.substring(0, 100) + '...',
        promptLength: prompt.length
      }
      
      console.error('❌ Qwen API Error Details:', errorDetails)
      
      // Log to a monitoring service if available
      // For now, we'll throw a more descriptive error
      const errorMessage = errorText 
        ? `Qwen API error (${response.status}): ${errorText.substring(0, 200)}`
        : `Qwen API error: ${response.status} ${response.statusText}`
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''
    
    console.log('🔍 Qwen Quality Check Raw Response:', content)
    console.log('📊 Qwen Full API Response:', JSON.stringify(data, null, 2))
    
    // Parse JSON response
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      
      console.log('📝 Extracted JSON string:', jsonStr)
      
      const parsed = JSON.parse(jsonStr) as QualityCheckResult
      console.log('✅ Parsed Quality Check:', parsed)
      
      return parsed
    } catch (parseError) {
      console.error('❌ Failed to parse JSON from Qwen:', content)
      console.error('Parse error:', parseError)
      
      // If parsing fails, check if content contains indicators of no pet
      const lowerContent = content.toLowerCase()
      const noPetDetected = lowerContent.includes('no pet') || lowerContent.includes('not a pet') || 
          lowerContent.includes('no animal') || lowerContent.includes('not an animal')
      
      if (noPetDetected) {
        return {
          isSafe: true,
          unsafeReason: 'none',
          hasPet: false,
          petType: 'none',
          quality: 'unusable',
          issues: ['no_pet'],
          hasHeterochromia: false,
          heterochromiaDetails: '',
          breed: '',
          complexPattern: false,
          multiplePets: 0,
          detectedColors: ''
        }
      }
      
      // Otherwise, proceed with caution - mark as poor quality to show warning
      console.warn('⚠️ Qwen parsing failed, returning fallback result. Raw content length:', content.length)
      console.warn('⚠️ First 200 chars of content:', content.substring(0, 200))
      
      return {
        isSafe: true,
        unsafeReason: 'none',
        hasPet: true,
        petType: 'unknown',
        quality: 'poor',
        issues: ['unclear_detection', 'qwen_parsing_failed'],
        hasHeterochromia: false,
        heterochromiaDetails: '',
        breed: 'unknown',
        complexPattern: false,
        multiplePets: 1,
        detectedColors: ''
      }
    }
  } catch (error) {
    console.error('❌ Qwen API Error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      imageUrl: imageUrl.substring(0, 100) + '...'
    })
    
    // Log error to database (non-blocking)
    try {
      const adminSupabase = createAdminClient()
      const { error: insertError } = await adminSupabase
        .from('api_error_logs')
        .insert({
          api_endpoint: '/api/check-quality',
          error_type: 'qwen_api_error',
          error_message: errorMessage.substring(0, 500), // Limit length
          image_url: imageUrl.substring(0, 200), // Truncated for privacy
          error_details: {
            stack: errorStack?.substring(0, 1000), // Truncated
            imageUrlPrefix: imageUrl.substring(0, 100),
            promptLength: prompt.length
          },
          request_body: {
            hasImageUrl: !!imageUrl,
            imageUrlLength: imageUrl.length
          }
        })
      
      if (insertError) {
        console.error('⚠️ Error log insert failed:', insertError)
      }
    } catch (logError) {
      // Non-critical: if logging fails, just continue
      console.error('⚠️ Failed to log error to database:', logError)
    }
    
    // On API error, skip quality check and proceed (assume safe)
    // But log the error for debugging
    return {
      isSafe: true,
      unsafeReason: 'none',
      hasPet: true,
      petType: 'unknown',
      quality: 'good',
      issues: ['qwen_api_error'],
      hasHeterochromia: false,
      heterochromiaDetails: '',
      breed: 'unknown',
      complexPattern: false,
      multiplePets: 1,
      detectedColors: ''
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl } = body
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      )
    }
    
    const result = await analyzeImageQuality(imageUrl)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Quality check error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    const isApiError = errorMessage.includes('Qwen API error') || errorMessage.includes('API')
    
    // Log error to database (non-blocking)
    try {
      const adminSupabase = createAdminClient()
      const { error: insertError } = await adminSupabase
        .from('api_error_logs')
        .insert({
          api_endpoint: '/api/check-quality',
          error_type: 'quality_check_error',
          error_message: errorMessage.substring(0, 500),
          error_details: {
            stack: errorStack?.substring(0, 1000),
            isApiError
          },
          request_body: {
            hasImageUrl: !!body?.imageUrl,
            imageUrlLength: body?.imageUrl?.length || 0
          }
        })
      
      if (insertError) {
        console.error('⚠️ Error log insert failed:', insertError)
      }
    } catch (logError) {
      // Non-critical: if logging fails, just continue
      console.error('⚠️ Failed to log error to database:', logError)
    }
    
    // Return detailed error for debugging (in production, you might want to hide details)
    return NextResponse.json(
      { 
        error: 'Failed to check image quality',
        details: isApiError ? errorMessage : undefined, // Only expose API errors
        // Return safe fallback result instead of error
        isSafe: true,
        unsafeReason: 'none' as const,
        hasPet: true,
        petType: 'unknown',
        quality: 'good' as const,
        issues: ['quality_check_failed'],
        hasHeterochromia: false,
        heterochromiaDetails: '',
        breed: 'unknown',
        complexPattern: false,
        multiplePets: 1,
        detectedColors: ''
      },
      { status: 200 } // Return 200 with fallback data instead of 500
    )
  }
}
