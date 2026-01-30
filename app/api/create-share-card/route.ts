import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import sharp from 'sharp'
import { PREMIUM_SLOGANS, getSloganByIndex } from '@/lib/constants/slogans'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { createCanvas, registerFont } from 'canvas'

// Register fonts once at module level
let fontsRegistered = false

function registerFonts() {
  if (fontsRegistered) return
  
  const fontsDir = join(process.cwd(), 'public', 'fonts')
  
  try {
    registerFont(join(fontsDir, 'Inter-Regular.ttf'), { family: 'Inter', weight: '400' })
    registerFont(join(fontsDir, 'Inter-Bold.ttf'), { family: 'Inter', weight: '700' })
    registerFont(join(fontsDir, 'PlayfairDisplay-Italic.ttf'), { family: 'Playfair Display', style: 'italic' })
    fontsRegistered = true
    console.log('[Font Registration] ✅ Fonts registered with canvas')
  } catch (error) {
    console.error('[Font Registration] ❌ Error:', error)
    throw error
  }
}

// Helper function to create footer image with canvas (reliable font rendering)
async function createFooterImage(
  title: string,
  date: string,
  slogan: string,
  width: number,
  height: number
): Promise<Buffer> {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  
  // White background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  
  // Title (bold, 44px)
  ctx.fillStyle = '#1F2937'
  ctx.font = 'bold 44px Inter'
  ctx.fillText(title, 80, 114)
  
  // Date (regular, 30px)
  ctx.fillStyle = '#666666'
  ctx.font = '400 30px Inter'
  ctx.fillText(date, 80, 154)
  
  // First separator line
  ctx.fillStyle = '#EEEEEE'
  ctx.fillRect(80, 204, width - 160, 2)
  
  // Slogan (italic, 48px, centered)
  ctx.fillStyle = '#374151'
  ctx.font = 'italic 48px "Playfair Display"'
  ctx.textAlign = 'center'
  ctx.fillText(slogan, width / 2, 310)
  
  // Second separator line
  ctx.fillStyle = '#EEEEEE'
  ctx.fillRect(80, 360, width - 160, 2)
  
  // URL (medium, 24px, right-aligned)
  ctx.fillStyle = '#999999'
  ctx.font = '500 24px Inter'
  ctx.textAlign = 'end'
  ctx.fillText('PixPawAI.com', width - 80, height - 30)
  
  return canvas.toBuffer('image/png')
}

export async function POST(request: NextRequest) {
  try {
    // Register fonts with canvas
    registerFonts()
    
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

    // 10. Generate footer with canvas (reliable font rendering)
    const footerHeight = 550
    console.log('[Canvas] Generating footer with canvas...')
    const footerBuffer = await createFooterImage(
      finalTitle,
      currentDate,
      selectedSlogan,
      canvasWidth,
      footerHeight
    )
    console.log('[Canvas] ✅ Footer image generated')

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
          input: footerBuffer, // Canvas-generated footer with proper fonts
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
