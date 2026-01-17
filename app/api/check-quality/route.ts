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
    
    // #region agent log
    await fetch('http://127.0.0.1:7242/ingest/9c61b946-d6dd-4114-a3ce-0f03f0572130',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'check-quality/route.ts:qwen-response',message:'Qwen API raw response',data:{contentPreview:content.substring(0,200),contentLength:content.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // Parse JSON response
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      
      // #region agent log
      await fetch('http://127.0.0.1:7242/ingest/9c61b946-d6dd-4114-a3ce-0f03f0572130',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'check-quality/route.ts:before-parse',message:'Attempting to parse JSON',data:{jsonStr:jsonStr.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const parsed = JSON.parse(jsonStr) as QualityCheckResult
      console.log('✅ Parsed Quality Check:', parsed)
      
      // #region agent log
      await fetch('http://127.0.0.1:7242/ingest/9c61b946-d6dd-4114-a3ce-0f03f0572130',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'check-quality/route.ts:parsed-success',message:'Successfully parsed JSON',data:{hasPet:parsed.hasPet,quality:parsed.quality,issues:parsed.issues},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      return parsed
    } catch (parseError) {
      console.error('❌ Failed to parse JSON from Qwen:', content)
      console.error('Parse error:', parseError)
      
      // #region agent log
      await fetch('http://127.0.0.1:7242/ingest/9c61b946-d6dd-4114-a3ce-0f03f0572130',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'check-quality/route.ts:parse-failed',message:'JSON parse failed, using fallback',data:{error:parseError instanceof Error ? parseError.message : String(parseError),contentSample:content.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // If parsing fails, check if content contains indicators of no pet
      const lowerContent = content.toLowerCase()
      const noPetDetected = lowerContent.includes('no pet') || lowerContent.includes('not a pet') || 
          lowerContent.includes('no animal') || lowerContent.includes('not an animal')
      
      // #region agent log
      await fetch('http://127.0.0.1:7242/ingest/9c61b946-d6dd-4114-a3ce-0f03f0572130',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'check-quality/route.ts:text-detection',message:'Checking for no-pet keywords',data:{noPetDetected,lowerContentSample:lowerContent.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (noPetDetected) {
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
