import { NextRequest, NextResponse } from 'next/server'

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
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    if (!imageResponse.ok) {
      console.error('❌ Failed to fetch image:', imageResponse.status, imageResponse.statusText)
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    
    // Check image size (max 10MB)
    if (imageBuffer.byteLength > 10 * 1024 * 1024) {
      throw new Error('Image too large (max 10MB)')
    }
    
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'
    const base64DataUrl = `data:${mimeType};base64,${base64Image}`
    
    console.log('✅ Image converted to base64, size:', (imageBuffer.byteLength / 1024).toFixed(2), 'KB')

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
      imageSize: imageBuffer.byteLength,
      model: 'Qwen/Qwen2.5-VL-72B-Instruct',
      endpoint: 'https://api.siliconflow.com/v1/chat/completions'
    })

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
      signal: AbortSignal.timeout(15000) // 15 second timeout for AI processing
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Qwen API Error Response:', errorText)
      throw new Error(`Qwen API error: ${response.statusText} - ${errorText}`)
    }

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
      // Fallback parsing if JSON not found
      console.warn('Qwen did not return valid JSON, attempting fallback parsing:', content)
      const lowerContent = content.toLowerCase()
      result = {
        hasPet: lowerContent.includes('haspet": true') || lowerContent.includes('yes') && !lowerContent.includes('no pet'),
        isClear: lowerContent.includes('clear') || lowerContent.includes('good'),
        petType: (content.match(/"petType":\s*"(.*?)"/)?.[1] || 'other') as any,
        quality: lowerContent.includes('poor') || lowerContent.includes('blurry') ? 'poor' : 'good'
      }
    }

    console.log('✅ Quick Check Result:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in quick quality check API:', error)
    return NextResponse.json({ 
      error: 'Failed to process quick quality check',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
