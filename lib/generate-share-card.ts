import sharp from 'sharp'
import { createAdminClient } from '@/lib/supabase/server'
import { PREMIUM_SLOGANS, getSloganByIndex } from '@/lib/constants/slogans'

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

/**
 * Generate a premium Leica/Polaroid-style share card
 * Optimized for performance and gallery-quality aesthetics
 */
export async function generateShareCard({
  generationId,
  imageUrl,
  title,
  sloganIndex
}: GenerateShareCardParams): Promise<ShareCardResult> {
  try {
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

    // 6. CREATE PREMIUM TYPOGRAPHY SVG
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
    const logoSize = Math.round(canvasWidth * 0.06) // 6% of width

    // Premium Typography SVG with 3-section layout
    const textSVG = `
      <svg width="${canvasWidth}" height="${footerHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style type="text/css">
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;600&amp;family=Playfair+Display:ital,wght@1,400;1,600&amp;display=swap');
          </style>
        </defs>
        
        <!-- LEFT SECTION: Title + Date -->
        <g>
          <text 
            x="${horizontalPadding}" 
            y="${footerHeight * 0.35}" 
            font-family="Inter, Arial, sans-serif" 
            font-size="${titleFontSize}" 
            font-weight="600" 
            fill="#222222"
            letter-spacing="0.5"
          >${cardTitle}</text>
          <text 
            x="${horizontalPadding}" 
            y="${footerHeight * 0.50}" 
            font-family="Inter, Arial, sans-serif" 
            font-size="${dateFontSize}" 
            font-weight="300" 
            fill="#888888"
          >${currentDate}</text>
        </g>

        <!-- CENTER SECTION: Separator + URL + Slogan -->
        <g>
          <!-- Vertical separator line -->
          <line 
            x1="${canvasWidth * 0.38}" 
            y1="${footerHeight * 0.25}" 
            x2="${canvasWidth * 0.38}" 
            y2="${footerHeight * 0.55}" 
            stroke="#DDDDDD" 
            stroke-width="2"
          />
          
          <!-- Website URL -->
          <text 
            x="${canvasWidth * 0.5}" 
            y="${footerHeight * 0.35}" 
            text-anchor="middle" 
            font-family="Inter, Arial, sans-serif" 
            font-size="${urlFontSize}" 
            font-weight="600" 
            fill="#FF8C42"
            letter-spacing="1"
          >PixPawAI.com</text>
          
          <!-- Slogan -->
          <text 
            x="${canvasWidth * 0.5}" 
            y="${footerHeight * 0.50}" 
            text-anchor="middle" 
            font-family="Playfair Display, Georgia, serif" 
            font-size="${sloganFontSize}" 
            font-style="italic" 
            fill="#888888"
          >${selectedSlogan}</text>
        </g>

        <!-- RIGHT SECTION: Logo -->
        <g>
          <!-- Premium logo circle background -->
          <circle 
            cx="${canvasWidth - horizontalPadding - logoSize/2}" 
            cy="${footerHeight * 0.40}" 
            r="${logoSize * 0.5}" 
            fill="#FF8C42" 
            opacity="0.15"
          />
          <!-- Paw emoji as logo -->
          <text 
            x="${canvasWidth - horizontalPadding - logoSize/2}" 
            y="${footerHeight * 0.40 + logoSize * 0.25}" 
            text-anchor="middle" 
            font-family="Arial, sans-serif" 
            font-size="${logoSize}" 
            fill="#FF8C42"
          >🐾</text>
        </g>

        <!-- Subtle bottom border line -->
        <line 
          x1="${horizontalPadding}" 
          y1="${footerHeight * 0.70}" 
          x2="${canvasWidth - horizontalPadding}" 
          y2="${footerHeight * 0.70}" 
          stroke="#F0F0F0" 
          stroke-width="1"
        />
      </svg>
    `

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
          input: Buffer.from(textSVG),
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
