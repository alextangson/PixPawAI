import sharp from 'sharp'
import satori from 'satori'
import { createAdminClient } from '@/lib/supabase/server'
import { PREMIUM_SLOGANS, getSloganByIndex } from '@/lib/constants/slogans'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface GenerateShareCardParams {
  generationId: string
  imageUrl: string
  title?: string
  sloganIndex?: number
}

interface ShareCardResult {
  success: boolean
  shareCardUrl?: string
  slogan?: string
  sloganIndex?: number
  error?: string
}

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

/**
 * Generate a premium Leica/Polaroid-style share card
 * Optimized for performance and gallery-quality aesthetics
 * Uses satori for proper font rendering on serverless
 */
export async function generateShareCard({
  generationId,
  imageUrl,
  title,
  sloganIndex
}: GenerateShareCardParams): Promise<ShareCardResult> {
  try {
    // Load fonts first
    await loadFonts()
    
    console.log('🎨 Starting premium share card generation...')
    console.log('📸 Image URL:', imageUrl)

    // 1. Select slogan
    const selectedIndex = typeof sloganIndex === 'number' && sloganIndex >= 0 && sloganIndex < PREMIUM_SLOGANS.length
      ? sloganIndex
      : Math.floor(Math.random() * PREMIUM_SLOGANS.length)
    const selectedSlogan = getSloganByIndex(selectedIndex)

    // 2. Download and process the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // 3. Get image metadata
    const metadata = await sharp(imageBuffer, { failOnError: false }).metadata()
    const sourceWidth = metadata.width || 1024
    const sourceHeight = metadata.height || 1024

    console.log(`📐 Source image: ${sourceWidth}x${sourceHeight}`)

    // 4. GOLDEN RATIO DESIGN PARAMETERS
    // Target minimum width for print quality
    const MIN_WIDTH = 2000
    const scaleFactor = sourceWidth < MIN_WIDTH ? MIN_WIDTH / sourceWidth : 1
    
    // Scale up for premium quality
    const scaledWidth = Math.round(sourceWidth * scaleFactor)
    const scaledHeight = Math.round(sourceHeight * scaleFactor)
    
    // Golden ratio padding
    const horizontalPadding = Math.round(scaledWidth * 0.08) // 8% of width
    const footerHeight = Math.round(scaledWidth * 0.25) // 25% of width
    
    // Final canvas dimensions
    const canvasWidth = scaledWidth + (horizontalPadding * 2)
    const canvasHeight = scaledHeight + horizontalPadding + footerHeight

    console.log(`🖼️  Canvas size: ${canvasWidth}x${canvasHeight}`)
    console.log(`📏 Padding: H=${horizontalPadding}px, Footer=${footerHeight}px`)

    // 5. Prepare high-quality scaled image
    const scaledImageBuffer = await sharp(imageBuffer, { failOnError: false })
      .resize(scaledWidth, scaledHeight, {
        fit: 'cover',
        kernel: sharp.kernel.lanczos3 // High-quality scaling
      })
      .toBuffer()

    // 6. CREATE PREMIUM TYPOGRAPHY with satori
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

    const cardTitle = title || 'My Pet Portrait'
    
    // Calculate responsive font sizes based on canvas width
    const titleFontSize = Math.round(canvasWidth * 0.02) // 2% of width
    const dateFontSize = Math.round(canvasWidth * 0.012) // 1.2% of width
    const urlFontSize = Math.round(canvasWidth * 0.018) // 1.8% of width
    const sloganFontSize = Math.round(canvasWidth * 0.014) // 1.4% of width

    // Generate footer SVG with satori (proper font embedding)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const footerSvg = await satori(
      ({
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            backgroundColor: 'white',
            padding: `0 ${horizontalPadding}px`,
          },
          children: [
            // LEFT SECTION: Title + Date
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  width: '35%',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: `${titleFontSize}px`,
                        fontWeight: 600,
                        fontFamily: 'Inter',
                        color: '#222222',
                        letterSpacing: '0.5px',
                      },
                      children: cardTitle,
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: `${dateFontSize}px`,
                        fontWeight: 400,
                        fontFamily: 'Inter',
                        color: '#888888',
                        marginTop: '8px',
                      },
                      children: currentDate,
                    },
                  },
                ],
              },
            },
            // CENTER SECTION: Separator + URL + Slogan
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '40%',
                  borderLeft: '2px solid #DDDDDD',
                  paddingLeft: '20px',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: `${urlFontSize}px`,
                        fontWeight: 600,
                        fontFamily: 'Inter',
                        color: '#FF8C42',
                        letterSpacing: '1px',
                      },
                      children: 'PixPawAI.com',
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: `${sloganFontSize}px`,
                        fontWeight: 400,
                        fontStyle: 'italic',
                        fontFamily: 'Playfair Display',
                        color: '#888888',
                        marginTop: '8px',
                        textAlign: 'center',
                      },
                      children: selectedSlogan,
                    },
                  },
                ],
              },
            },
            // RIGHT SECTION: Logo area
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  width: '25%',
                },
                children: {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: `${Math.round(canvasWidth * 0.04)}px`,
                      color: '#FF8C42',
                    },
                    children: '🐾',
                  },
                },
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
            weight: 600,
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

    // 7. COMPOSITE THE PREMIUM CARD
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
          input: scaledImageBuffer,
          top: horizontalPadding,
          left: horizontalPadding
        },
        {
          input: Buffer.from(footerSvg),
          top: scaledHeight + horizontalPadding,
          left: 0
        }
      ])
      .jpeg({ 
        quality: 90,
        chromaSubsampling: '4:4:4', // Highest quality chroma sampling
        mozjpeg: true // Use mozjpeg for better compression
      })
      .toBuffer()

    console.log(`✅ Card generated: ${shareCardBuffer.length} bytes`)

    // 8. Upload to Supabase Storage
    const adminSupabase = createAdminClient()
    const fileName = `${generationId}-${Date.now()}-s${selectedIndex}.jpg`
    
    const { data: uploadData, error: uploadError } = await adminSupabase
      .storage
      .from('shared-cards')
      .upload(fileName, shareCardBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000', // 1 year cache
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // 9. Get public URL
    const { data: { publicUrl } } = adminSupabase
      .storage
      .from('shared-cards')
      .getPublicUrl(uploadData.path)

    console.log('🎉 Share card uploaded:', publicUrl)

    return {
      success: true,
      shareCardUrl: publicUrl,
      slogan: selectedSlogan,
      sloganIndex: selectedIndex
    }

  } catch (error) {
    console.error('❌ Share card generation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
