import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import sharp from 'sharp'
import satori from 'satori'
import { PREMIUM_SLOGANS, getSloganByIndex } from '@/lib/constants/slogans'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Load fonts once at module level for performance
let fontsLoaded = false
let interRegular: ArrayBuffer
let interBold: ArrayBuffer
let playfairItalic: ArrayBuffer

async function loadFonts() {
  if (fontsLoaded) return
  
  const fontsDir = join(process.cwd(), 'public', 'fonts')
  
  const [regularBuffer, boldBuffer, playfairBuffer] = await Promise.all([
    readFile(join(fontsDir, 'Inter-Regular.ttf')),
    readFile(join(fontsDir, 'Inter-Bold.ttf')),
    readFile(join(fontsDir, 'PlayfairDisplay-Italic.ttf')),
  ])
  
  interRegular = regularBuffer.buffer.slice(regularBuffer.byteOffset, regularBuffer.byteOffset + regularBuffer.byteLength)
  interBold = boldBuffer.buffer.slice(boldBuffer.byteOffset, boldBuffer.byteOffset + boldBuffer.byteLength)
  playfairItalic = playfairBuffer.buffer.slice(playfairBuffer.byteOffset, playfairBuffer.byteOffset + playfairBuffer.byteLength)
  
  fontsLoaded = true
}

export async function POST(request: NextRequest) {
  try {
    // Load fonts first
    await loadFonts()
    
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

    // 10. Use satori to generate footer SVG with embedded fonts
    // Footer height: from y=1230 (image bottom) to y=1780 (canvas bottom) = 550px
    const footerHeight = 550
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const footerSvg = await satori(
      ({
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            padding: '0 80px',
          },
          children: [
            // Title and Date section (70px from top)
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  marginTop: '70px',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '44px',
                        fontWeight: 700,
                        fontFamily: 'Inter',
                        color: '#1F2937',
                      },
                      children: finalTitle,
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '30px',
                        fontFamily: 'Inter',
                        color: '#666666',
                        marginTop: '10px',
                      },
                      children: currentDate,
                    },
                  },
                ],
              },
            },
            // First separator line
            {
              type: 'div',
              props: {
                style: {
                  width: '100%',
                  height: '2px',
                  backgroundColor: '#EEEEEE',
                  marginTop: '50px',
                },
              },
            },
            // Slogan section
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '150px',
                  width: '100%',
                },
                children: {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '48px',
                      fontWeight: 400,
                      fontStyle: 'italic',
                      fontFamily: 'Playfair Display',
                      color: '#374151',
                      textAlign: 'center',
                    },
                    children: selectedSlogan,
                  },
                },
              },
            },
            // Second separator line
            {
              type: 'div',
              props: {
                style: {
                  width: '100%',
                  height: '2px',
                  backgroundColor: '#EEEEEE',
                },
              },
            },
            // Logo and URL section
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  marginTop: '30px',
                  flex: 1,
                },
                children: [
                  // URL
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '24px',
                        fontWeight: 500,
                        fontFamily: 'Inter',
                        color: '#999999',
                        marginTop: 'auto',
                        marginBottom: '30px',
                      },
                      children: 'PixPawAI.com',
                    },
                  },
                ],
              },
            },
          ],
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
      {
        width: canvasWidth,
        height: footerHeight,
        fonts: [
          {
            name: 'Inter',
            data: interRegular,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Inter',
            data: interBold,
            weight: 700,
            style: 'normal',
          },
          {
            name: 'Playfair Display',
            data: playfairItalic,
            weight: 400,
            style: 'italic',
          },
        ],
      }
    )

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
