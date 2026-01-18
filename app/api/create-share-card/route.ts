import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import sharp from 'sharp'
import { PREMIUM_SLOGANS, getSloganByIndex } from '@/lib/constants/slogans'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { generation_id, custom_title, custom_slogan, slogan_index } = body

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

    // 3. Update title in database if custom_title provided
    let finalTitle = custom_title || generation.title || 'My Pet Portrait'
    if (custom_title && custom_title.trim() !== generation.title) {
      const { error: updateError } = await supabase
        .from('generations')
        .update({ title: custom_title.trim() })
        .eq('id', generation_id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to update title:', updateError)
        // Continue anyway, don't fail the whole request
      } else {
        console.log('✅ Title updated in database:', custom_title)
      }
    }

    // 4. Determine the slogan to use
    let selectedSlogan: string
    if (custom_slogan) {
      // Use the custom slogan provided by user
      selectedSlogan = custom_slogan
    } else if (typeof slogan_index === 'number' && slogan_index >= 0 && slogan_index < PREMIUM_SLOGANS.length) {
      // Use specific slogan by index
      selectedSlogan = getSloganByIndex(slogan_index)
    } else {
      // Random slogan
      selectedSlogan = PREMIUM_SLOGANS[Math.floor(Math.random() * PREMIUM_SLOGANS.length)]
    }

    // 5. Download the generated image from Supabase Storage
    const imageResponse = await fetch(generation.output_url)
    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch generated image' }, { status: 500 })
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // 6. Get image metadata and ensure minimum size
    const imageMetadata = await sharp(imageBuffer).metadata()
    let targetWidth = imageMetadata.width || 1024
    let targetHeight = imageMetadata.height || 1024
    
    // Ensure minimum width of 2000px for high-quality output
    if (targetWidth < 2000) {
      const scaleFactor = 2000 / targetWidth
      targetWidth = 2000
      targetHeight = Math.round(targetHeight * scaleFactor)
    }

    // 7. Design Parameters (Golden Ratio Leica/Polaroid Style)
    const borderSize = Math.round(targetWidth * 0.08) // 8% of image width
    const footerHeight = Math.round(targetWidth * 0.25) // 25% of image width
    const canvasWidth = targetWidth + (borderSize * 2)
    const canvasHeight = targetHeight + borderSize + footerHeight

    // 8. Prepare the main image with high-quality resize
    const resizedImage = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, { 
        fit: 'cover',
        kernel: sharp.kernel.lanczos3 
      })
      .toBuffer()

    // 9. Create text overlays using SVG (Refined Typography)
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })

    // Calculate font sizes proportionally
    const titleFontSize = Math.round(targetWidth * 0.022) // ~44px for 2000px width
    const dateFontSize = Math.round(targetWidth * 0.015) // ~30px
    const urlFontSize = Math.round(targetWidth * 0.013) // ~26px
    const sloganFontSize = Math.round(targetWidth * 0.016) // ~32px
    const logoFontSize = Math.round(targetWidth * 0.015) // ~30px (reduced by 40%)

    // SVG for text layout (3-section footer, refined design)
    const textSVG = `
      <svg width="${canvasWidth}" height="${footerHeight}">
        <!-- Left Section: Title + Date -->
        <text 
          x="${borderSize}" 
          y="${footerHeight * 0.3}" 
          font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" 
          font-size="${titleFontSize}" 
          font-weight="700" 
          fill="#333333"
        >${finalTitle}</text>
        <text 
          x="${borderSize}" 
          y="${footerHeight * 0.45}" 
          font-family="Inter, -apple-system, sans-serif" 
          font-size="${dateFontSize}" 
          fill="#888888"
        >${currentDate}</text>

        <!-- Center: Separator line -->
        <line 
          x1="${borderSize}" 
          y1="${footerHeight * 0.55}" 
          x2="${canvasWidth - borderSize}" 
          y2="${footerHeight * 0.55}" 
          stroke="#E5E5E5" 
          stroke-width="2"
        />

        <!-- Center Section: URL + Slogan -->
        <text 
          x="${borderSize}" 
          y="${footerHeight * 0.7}" 
          font-family="Inter, sans-serif" 
          font-size="${urlFontSize}" 
          font-weight="500" 
          fill="#888888"
        >PixPawAI.com</text>
        <text 
          x="${canvasWidth / 2}" 
          y="${footerHeight * 0.85}" 
          text-anchor="middle"
          font-family="'Pacifico', cursive, Georgia, serif" 
          font-size="${sloganFontSize * 1.1}" 
          fill="#666666"
        >"${selectedSlogan}"</text>
      </svg>
    `

    // 10. Load and prepare logo image
    const logoPath = join(process.cwd(), 'public', 'brand', 'png', 'logo-orange-128.png')
    const logoBuffer = await readFile(logoPath)
    
    // Resize logo to fit in the card (height proportional to footer)
    const logoHeight = Math.floor(footerHeight * 0.3) // Logo takes ~30% of footer height
    const resizedLogo = await sharp(logoBuffer)
      .resize({ height: logoHeight, fit: 'contain' })
      .toBuffer()
    
    // Get logo dimensions to position it correctly
    const logoMetadata = await sharp(resizedLogo).metadata()
    const logoWidth = logoMetadata.width || 0
    
    // Position logo at bottom-right of the card
    const logoX = canvasWidth - borderSize - logoWidth - 20 // 20px from right edge
    const logoY = targetHeight + borderSize + Math.floor(footerHeight * 0.65) // Aligned with slogan
    
    // 10. Composite the final share card
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
          top: targetHeight + borderSize,
          left: 0
        },
        {
          input: resizedLogo,
          top: logoY,
          left: logoX
        }
      ])
      .jpeg({ quality: 90 })
      .toBuffer()

    // 11. Upload to Supabase Storage (shared-cards bucket)
    const fileName = `${generation_id}-${Date.now()}-custom.jpg`
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

    // 12. Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('shared-cards')
      .getPublicUrl(uploadData.path)

    // 13. Update share_card_url in database
    const { error: cardUpdateError } = await supabase
      .from('generations')
      .update({ share_card_url: publicUrl })
      .eq('id', generation_id)
      .eq('user_id', user.id)

    if (cardUpdateError) {
      console.error('Failed to update share_card_url:', cardUpdateError)
      // Continue anyway, user can still download
    }

    console.log('✅ Share card created:', publicUrl)

    // 14. Return the result
    return NextResponse.json({
      success: true,
      share_card_url: publicUrl,
      title: finalTitle,
      slogan: selectedSlogan,
      dimensions: {
        width: canvasWidth,
        height: canvasHeight
      },
      title_updated: custom_title && custom_title.trim() !== generation.title
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
    slogans: PREMIUM_SLOGANS,
    total: PREMIUM_SLOGANS.length
  })
}
