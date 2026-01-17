import { NextRequest, NextResponse } from 'next/server'

interface QualityCheckResult {
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
  
  const prompt = `You are a pet photo quality inspector and feature analyst.

STEP 1: Photo Quality Check
- Is there a pet in this photo? (yes/no)
- If yes, what type? (dog/cat/rabbit/bird/other)
- Photo quality? (excellent/good/poor/unusable)
- Issues? (blurry, too_small, poor_lighting, obstructed, no_pet)

STEP 2: If quality is acceptable (excellent/good), analyze features:
- Heterochromia? (left eye color, right eye color)
- Breed? (if distinctive)
- Complex patterns? (spots, stripes, markings)
- Multiple pets? (count)

Output ONLY this JSON:
{
  "hasPet": true,
  "petType": "dog",
  "quality": "good",
  "issues": [],
  "hasHeterochromia": true,
  "heterochromiaDetails": "left blue, right brown",
  "breed": "Siberian Husky",
  "complexPattern": false,
  "multiplePets": 1,
  "detectedColors": "black and white fur"
}

If quality is poor/unusable:
{
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

If no pet detected:
{
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
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2-VL-72B-Instruct',
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
      })
    })

    if (!response.ok) {
      throw new Error(`Qwen API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''
    
    console.log('🔍 Qwen Quality Check Raw Response:', content)
    
    // Parse JSON response
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      
      const parsed = JSON.parse(jsonStr) as QualityCheckResult
      console.log('✅ Parsed Quality Check:', parsed)
      return parsed
    } catch (parseError) {
      console.error('❌ Failed to parse JSON from Qwen:', content)
      console.error('Parse error:', parseError)
      
      // If parsing fails, check if content contains indicators of no pet
      const lowerContent = content.toLowerCase()
      if (lowerContent.includes('no pet') || lowerContent.includes('not a pet') || 
          lowerContent.includes('no animal') || lowerContent.includes('not an animal')) {
        return {
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
      return {
        hasPet: true,
        petType: 'unknown',
        quality: 'poor',
        issues: ['unclear_detection'],
        hasHeterochromia: false,
        heterochromiaDetails: '',
        breed: 'unknown',
        complexPattern: false,
        multiplePets: 1,
        detectedColors: ''
      }
    }
  } catch (error) {
    console.error('Qwen API Error:', error)
    // On API error, skip quality check and proceed
    return {
      hasPet: true,
      petType: 'unknown',
      quality: 'good',
      issues: [],
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
    return NextResponse.json(
      { error: 'Failed to check image quality' },
      { status: 500 }
    )
  }
}
