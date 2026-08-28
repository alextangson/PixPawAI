import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { SILICONFLOW_VISION_MODEL } from '@/lib/vision-config'
import { hasUsablePetIdentity } from '@/lib/pet-generation'

interface QuickQualityCheckResult {
  hasPet: boolean
  isClear: boolean
  petType: string  // Can be any pet type: dog, cat, snake, lizard, etc.
  quality: 'good' | 'poor'
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const QWEN_API_KEY = process.env.SILICONFLOW_API_KEY
    
    if (!QWEN_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Fetch image and convert to base64 (to handle signed URLs)
    console.log('📥 Fetching image from:', imageUrl.substring(0, 100) + '...')
    
    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(20000) // 20 second timeout (increased for large images)
    })
    
    if (!imageResponse.ok) {
      console.error('❌ Failed to fetch image:', imageResponse.status, imageResponse.statusText)
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }
    
    const originalBuffer = Buffer.from(await imageResponse.arrayBuffer())
    
    // Check image size (max 10MB)
    if (originalBuffer.byteLength > 10 * 1024 * 1024) {
      throw new Error('Image too large (max 10MB)')
    }
    
    // Compress and resize image for SiliconFlow API (max 1024x1024 to reduce base64 size)
    // This helps avoid API errors due to large payloads
    const compressedBuffer = await sharp(originalBuffer)
      .resize(1024, 1024, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()
    
    const base64Image = compressedBuffer.toString('base64')
    const base64DataUrl = `data:image/jpeg;base64,${base64Image}`
    
    console.log('✅ Image compressed and converted to base64:', {
      original: (originalBuffer.byteLength / 1024).toFixed(2) + ' KB',
      compressed: (compressedBuffer.byteLength / 1024).toFixed(2) + ' KB',
      base64Size: (base64Image.length / 1024).toFixed(2) + ' KB'
    })

    const prompt = `Quick image check (answer in 3 seconds):
1. Is this a pet (dog/cat/animal)? YES/NO
2. Is the image clear and not blurry? YES/NO
3. Pet type? (be specific: dog, cat, snake, lizard, bird, rabbit, hamster, fish, turtle, etc.)

Output ONLY this JSON (no explanations):
{
  "hasPet": true/false,
  "isClear": true/false,
  "petType": "specific_pet_type",
  "quality": "good"/"poor"
}`

    console.log('⚡ Quick Quality Check Request:', {
      originalSize: originalBuffer.byteLength,
      compressedSize: compressedBuffer.byteLength,
      model: SILICONFLOW_VISION_MODEL,
      endpoint: 'https://api.siliconflow.com/v1/chat/completions'
    })

    // 🔄 Retry logic with exponential backoff
    let lastError: Error | null = null
    const maxRetries = 2
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000) // 1s, 2s max
          console.log(`⏳ Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
        const response = await fetch('https://api.siliconflow.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${QWEN_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: SILICONFLOW_VISION_MODEL,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: base64DataUrl
                    }
                  },
                  {
                    type: 'text',
                    text: prompt
                  }
                ]
              }
            ],
            max_tokens: 100,
            temperature: 0.5
          }),
          signal: AbortSignal.timeout(30000) // 30 second timeout for AI processing (VL models are slow)
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ Qwen API Error Response (attempt ${attempt + 1}):`, errorText)
          
          // Parse error to check if retryable
          try {
            const errorJson = JSON.parse(errorText)
            // Error codes that should not be retried
            const nonRetryableErrors = [400, 401, 403, 404]
            if (nonRetryableErrors.includes(response.status)) {
              throw new Error(`Qwen API error (non-retryable): ${response.statusText} - ${errorText}`)
            }
          } catch (parseError) {
            // If can't parse, treat as retryable
          }
          
          lastError = new Error(`Qwen API error: ${response.statusText} - ${errorText}`)
          continue // Retry
        }
        
        // Success! Break retry loop
        
        // Success! Break retry loop
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content?.trim() || ''
        
        console.log('⚡ Quick Check Raw Response:', content)
        
        // Try to extract JSON
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*?\}/)
        let result: QuickQualityCheckResult

        if (jsonMatch) {
          const jsonText = jsonMatch[1] || jsonMatch[0]
          result = JSON.parse(jsonText)
        } else {
          throw new Error('Pet analysis returned an invalid response')
        }
        if (typeof result.hasPet !== 'boolean' ||
            (result.hasPet && !hasUsablePetIdentity(result))) {
          throw new Error('Incomplete pet analysis')
        }

        console.log('✅ Quick Check Result:', result)
        return NextResponse.json(result)
        
      } catch (attemptError) {
        lastError = attemptError as Error
        if (attempt === maxRetries) {
          // Last attempt failed
          break
        }
        // Continue to next retry
      }
    }
    
    console.error('Quick pet analysis unavailable after retries')
    return NextResponse.json({
      error: 'Pet photo analysis is temporarily unavailable. Please try again.',
      code: 'PET_ANALYSIS_UNAVAILABLE'
    }, { status: 503 })
  } catch (error) {
    console.error('Error in quick quality check API')
    return NextResponse.json({
      error: 'Pet photo analysis is temporarily unavailable. Please try again.',
      code: 'PET_ANALYSIS_UNAVAILABLE'
    }, { status: 503 })
  }
}
