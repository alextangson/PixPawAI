import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import sharp from 'sharp'
import { PREMIUM_SLOGANS, getSloganByIndex } from '@/lib/constants/slogans'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Helper function to create SVG text without satori (more reliable in serverless)
function createFooterSVG(
  title: string,
  date: string,
  slogan: string,
  width: number,
  height: number
): string {
  // Escape XML special characters
  const escapeXml = (str: string) => 
    str.replace(/[<>&'"]/g, (c) => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;'
    }[c] || c))

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&amp;family=Playfair+Display:ital@1&amp;display=swap');
          .title { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 44px; fill: #1F2937; }
          .date { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 30px; fill: #666666; }
          .slogan { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 400; font-size: 48px; fill: #374151; text-anchor: middle; }
          .url { font-family: 'Inter', sans-serif; font-weight: 500; font-size: 24px; fill: #999999; text-anchor: end; }
        </style>
      </defs>
      
      <!-- White background -->
      <rect width="${width}" height="${height}" fill="white"/>
      
      <!-- Title and Date (70px from top) -->
      <text x="80" y="114" class="title">${escapeXml(title)}</text>
      <text x="80" y="154" class="date">${escapeXml(date)}</text>
      
      <!-- First separator line -->
      <rect x="80" y="204" width="${width - 160}" height="2" fill="#EEEEEE"/>
      
      <!-- Slogan (centered) -->
      <text x="${width / 2}" y="310" class="slogan">${escapeXml(slogan)}</text>
      
      <!-- Second separator line -->
      <rect x="80" y="360" width="${width - 160}" height="2" fill="#EEEEEE"/>
      
      <!-- URL (bottom right) -->
      <text x="${width - 80}" y="${height - 30}" class="url">PixPawAI.com</text>
    </svg>
  `.trim()
}

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

    // 7. Design Parameters (Polaroid-style Compact Layout)
    const canvasWidth = 1360 // Fixed canvas width
    const canvasHeight = 1780 // Polaroid ratio (reduced from 2080)
    const imageRadius = 20 // Rounded corners for image (subtle)
    const cardRadius = 12 // Rounded corners for entire card (subtle)
    const logoHeight = 100 // Compact logo for Polaroid style

    // 8. Prepare the main image - smart crop to 1:1 square
    const resizedImage = await sharp(imageBuffer)
      .resize(imageSize, imageSize, { 
        fit: 'cover', // Smart crop to fill square
        position: 'attention', // AI-powered smart cropping
        kernel: sharp.kernel.lanczos3
      })
      .toBuffer()

    // 9. Generate current date
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })

    // 10. Generate footer SVG with pure SVG (no satori - more reliable in serverless)
    const footerHeight = 550
    console.log('[SVG] Generating footer with pure SVG...')
    const footerSvg = createFooterSVG(
      finalTitle,
      currentDate,
      selectedSlogan,
      canvasWidth,
      footerHeight
    )
    console.log('[SVG] ✅ Footer SVG generated, length:', footerSvg.length)

    // 11. Load and prepare logo image (using high-res 256px logo)
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
    
    // 12. Composite the final share card
    
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
    
    // Single composite operation with satori-generated footer
    const shareCardBuffer = await sharp(roundedBg)
      .composite([
        {
          input: roundedImage,
          top: imageY,
          left: imageX
        },
        {
          input: Buffer.from(footerSvg), // Satori-generated SVG with embedded fonts
          top: 1230, // Position at image bottom
          left: 0
        },
        {
          input: resizedLogo,
          top: logoY,
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
