import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import sharp from 'sharp'

// 20 Cinematic Slogans for Random Selection
const SLOGANS = [
  "Every paw has a story to tell",
  "Turning paws into movie stars",
  "Captured with AI, Loved for Real",
  "Cinema-grade portraits for your best friend",
  "Where art meets unconditional love",
  "A digital hug in every pixel",
  "Your pet, reimagined as a masterpiece",
  "From camera roll to red carpet",
  "Because every pet deserves the spotlight",
  "Paws that paint a thousand words",
  "Made with AI magic, sealed with love",
  "Your furry friend's cinematic debut",
  "Pixar-quality memories, one click away",
  "When technology meets tail wags",
  "Art that makes your heart skip a beat",
  "Transform moments into movie scenes",
  "The future of pet portraits is here",
  "Where pixels become precious memories",
  "Your pet's journey to stardom starts now",
  "Creating legends, one paw at a time"
]

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { generation_id, title, slogan_index } = body

    if (!generation_id) {
      return NextResponse.json({ error: 'generation_id is required' }, { status: 400 })
    }

    // 2. Fetch the generation record
    const { data: generation, error: genError } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generation_id)
      .eq('user_id', user.id)
      .single()

    if (genError || !generation) {
      return NextResponse.json({ error: 'Generation not found or unauthorized' }, { status: 404 })
    }

    if (!generation.output_url) {
      return NextResponse.json({ error: 'Generated image URL not found' }, { status: 400 })
    }

    // 3. Select a random slogan (or use the provided index)
    let selectedSloganIndex: number
    if (typeof slogan_index === 'number' && slogan_index >= 0 && slogan_index < SLOGANS.length) {
      selectedSloganIndex = slogan_index
    } else {
      selectedSloganIndex = Math.floor(Math.random() * SLOGANS.length)
    }
    const selectedSlogan = SLOGANS[selectedSloganIndex]

    // 4. Download the generated image from Supabase Storage
    const imageResponse = await fetch(generation.output_url)
    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch generated image' }, { status: 500 })
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // 5. Get image metadata
    const imageMetadata = await sharp(imageBuffer).metadata()
    const originalWidth = imageMetadata.width || 1024
    const originalHeight = imageMetadata.height || 1024

    // 6. Design Parameters (Leica/Polaroid Style)
    const borderSize = 60 // Uniform white border on top/left/right
    const footerHeight = 200 // Large white footer
    const canvasWidth = originalWidth + (borderSize * 2)
    const canvasHeight = originalHeight + borderSize + footerHeight

    // 7. Prepare the main image with resize to fit canvas
    const resizedImage = await sharp(imageBuffer)
      .resize(originalWidth, originalHeight, { fit: 'cover' })
      .toBuffer()

    // 8. Create text overlays using SVG
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })

    const cardTitle = title || generation.title || 'My Pet Portrait'

    // SVG for text layout (3-column footer)
    const textSVG = `
      <svg width="${canvasWidth}" height="${footerHeight}">
        <!-- Left Column: Title + Date -->
        <text 
          x="80" 
          y="80" 
          font-family="Arial, sans-serif" 
          font-size="22" 
          font-weight="600" 
          fill="#2D2D2D"
        >${cardTitle}</text>
        <text 
          x="80" 
          y="110" 
          font-family="Arial, sans-serif" 
          font-size="16" 
          fill="#666666"
        >${currentDate}</text>

        <!-- Center Column: URL + Slogan -->
        <text 
          x="${canvasWidth / 2}" 
          y="70" 
          text-anchor="middle" 
          font-family="Arial, sans-serif" 
          font-size="24" 
          font-weight="700" 
          fill="#FF8C42"
        >PixPawAI.com</text>
        <text 
          x="${canvasWidth / 2}" 
          y="105" 
          text-anchor="middle" 
          font-family="Georgia, serif" 
          font-size="16" 
          font-style="italic" 
          fill="#555555"
        >${selectedSlogan}</text>

        <!-- Right Column: Logo placeholder -->
        <circle cx="${canvasWidth - 100}" cy="85" r="40" fill="#FF8C42" opacity="0.2"/>
        <text 
          x="${canvasWidth - 100}" 
          y="95" 
          text-anchor="middle" 
          font-family="Arial, sans-serif" 
          font-size="28" 
          font-weight="900" 
          fill="#FF8C42"
        >🐾</text>
      </svg>
    `

    // 9. Composite the final share card
    const shareCardBuffer = await sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([
        {
          input: resizedImage,
          top: borderSize,
          left: borderSize
        },
        {
          input: Buffer.from(textSVG),
          top: originalHeight + borderSize,
          left: 0
        }
      ])
      .jpeg({ quality: 95 })
      .toBuffer()

    // 10. Upload to Supabase Storage (shared-cards bucket)
    const fileName = `${generation_id}-${Date.now()}-slogan-${selectedSloganIndex}.jpg`
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('shared-cards')
      .upload(fileName, shareCardBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload share card' }, { status: 500 })
    }

    // 11. Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('shared-cards')
      .getPublicUrl(uploadData.path)

    // 12. Return the result
    return NextResponse.json({
      success: true,
      share_card_url: publicUrl,
      slogan: selectedSlogan,
      slogan_index: selectedSloganIndex,
      dimensions: {
        width: canvasWidth,
        height: canvasHeight
      }
    })

  } catch (error) {
    console.error('Create share card error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// GET endpoint to fetch available slogans
export async function GET(request: NextRequest) {
  return NextResponse.json({
    slogans: SLOGANS,
    total: SLOGANS.length
  })
}
