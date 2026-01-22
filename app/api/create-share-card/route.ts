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

    // 6. Fixed dimensions - 1:1 image, Polaroid style
    const imageSize = 1150 // Square image (balanced size)
    const cardWidth = 1200 // Card width (unchanged)
    const cardHeight = 1600 // Card height (3:4 ratio)

    // 7. Design Parameters (Polaroid-style Compact Layout)
    const padding = 80
    const canvasWidth = 1360 // Fixed canvas width
    const canvasHeight = 1780 // Polaroid ratio (reduced from 2080)
    const imageRadius = 20 // Rounded corners for image (subtle)
    const cardRadius = 12 // Rounded corners for entire card (subtle)

    // 8. Prepare the main image - smart crop to 1:1 square
    const resizedImage = await sharp(imageBuffer)
      .resize(imageSize, imageSize, { 
        fit: 'cover', // Smart crop to fill square
        position: 'attention', // AI-powered smart cropping
        kernel: sharp.kernel.lanczos3
      })
      .toBuffer()

    // 9. Create SINGLE SVG with all text and lines (Performance Optimized)
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })

    // Font sizes (Refined for compact Polaroid style)
    const titleFontSize = 44 // Title (reduced from 52)
    const dateFontSize = 30 // Date (reduced from 36)
    const sloganFontSize = 48 // Prominent slogan
    const urlFontSize = 24 // Clear URL
    const logoHeight = 100 // Compact logo for Polaroid style

    // Escape XML/HTML special characters to prevent encoding issues
    const escapeXml = (text: string): string => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
    }

    // Escape text content to prevent encoding issues
    const escapedTitle = escapeXml(finalTitle)
    const escapedDate = escapeXml(currentDate)
    const escapedSlogan = escapeXml(selectedSlogan)

    // Single unified SVG for entire canvas (1360x1780) - Polaroid compact layout
    // Image bottom at y=1230 (80+1150), equal spacing: 70px between image-title and title group-line1
    const unifiedSVG = `
      <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
        <!-- Title: y=1300 (70px below image, left-aligned) -->
        <text 
          x="110" 
          y="1300" 
          font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" 
          font-size="${titleFontSize}" 
          font-weight="700" 
          fill="#1F2937"
        >${escapedTitle}</text>
        
        <!-- Date: y=1350 (50px below title) -->
        <text 
          x="110" 
          y="1350" 
          font-family="Inter, -apple-system, sans-serif" 
          font-size="${dateFontSize}" 
          fill="#666666"
        >${escapedDate}</text>

        <!-- First Separator Line: y=1420 (70px below date, matching image-to-title spacing) -->
        <path 
          d="M 80 1420 L 1280 1420" 
          stroke="#EEEEEE" 
          stroke-width="2"
        />

        <!-- Slogan: y=1495 (Vertically centered between 1420-1570, Italic) -->
        <text 
          x="680" 
          y="1495" 
          text-anchor="middle"
          font-family="Georgia, 'Times New Roman', serif" 
          font-size="${sloganFontSize}" 
          font-weight="400"
          font-style="italic"
          fill="#374151"
        >${escapedSlogan}</text>

        <!-- Second Separator Line: y=1570 (150px spacing for slogan area) -->
        <path 
          d="M 80 1570 L 1280 1570" 
          stroke="#EEEEEE" 
          stroke-width="2"
        />

        <!-- URL: y=1720 (Right-aligned, Below Logo) -->
        <text 
          x="1280" 
          y="1720" 
          text-anchor="end"
          font-family="Inter, -apple-system, sans-serif" 
          font-size="${urlFontSize}" 
          font-weight="500" 
          fill="#999999"
        >PixPawAI.com</text>
      </svg>
    `

    // 10. Load and prepare logo image (using high-res 256px logo)
    const logoPath = join(process.cwd(), 'public', 'brand', 'png', 'logo-orange-256.png')
    const logoBuffer = await readFile(logoPath)
    
    // Resize logo
    const resizedLogo = await sharp(logoBuffer)
      .resize({ height: logoHeight, fit: 'contain' })
      .toBuffer()
    
    // Get logo dimensions for positioning
    const logoMetadata = await sharp(resizedLogo).metadata()
    const logoWidth = logoMetadata.width || 0
    
    // Logo position: x=1280 (right-aligned with separator line), y=1600 (above URL)
    const logoX = 1280 - logoWidth // Right aligned to match URL and separator
    const logoY = 1600 // Positioned below second separator line (1570)
    
    // 11. Composite the final share card (Single SVG Approach - Performance Optimized)
    
    // Create rounded rectangle background
    const roundedBg = Buffer.from(`
      <svg width="${canvasWidth}" height="${canvasHeight}">
        <rect x="0" y="0" width="${canvasWidth}" height="${canvasHeight}" rx="${cardRadius}" ry="${cardRadius}" fill="white"/>
      </svg>
    `)
    
    // Create rounded mask for square image
    const imageMask = Buffer.from(`
      <svg width="${imageSize}" height="${imageSize}">
        <rect x="0" y="0" width="${imageSize}" height="${imageSize}" rx="${imageRadius}" ry="${imageRadius}" fill="white"/>
      </svg>
    `)
    
    // Apply rounded corners to image
    const roundedImage = await sharp(resizedImage)
      .composite([{
        input: imageMask,
        blend: 'dest-in'
      }])
      .png()
      .toBuffer()
    
    // Image position: left-aligned with title/date (x=110)
    const imageX = 110 // Left-aligned with title and date
    const imageY = 80 // Top padding
    // Image bottom: imageY + imageSize = 80 + 1150 = 1230
    
    // Single composite operation (Performance: 3 layers in one pass)
    const shareCardBuffer = await sharp(roundedBg)
      .composite([
        {
          input: roundedImage,
          top: imageY,
          left: imageX
        },
        {
          input: Buffer.from(unifiedSVG), // All text and lines in one SVG
          top: 0,
          left: 0
        },
        {
          input: resizedLogo,
          top: logoY, // y=1830
          left: logoX
        }
      ])
      .png({ quality: 95 })
      .toBuffer()

    // 11. Upload to Supabase Storage (shared-cards bucket)
    const fileName = `${generation_id}-${Date.now()}-custom.png`
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('shared-cards')
      .upload(fileName, shareCardBuffer, {
        contentType: 'image/png',
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
