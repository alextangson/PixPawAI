import sharp from 'sharp'
import { readFile } from 'fs/promises'
import path from 'path'

const LOGO_PATH = path.join(process.cwd(), 'public/brand/png/logo-orange-256.png')
const LOGO_WIDTH_RATIO = 0.16
const MARGIN_RATIO = 0.02
const LOGO_OPACITY = 0.7

let logoSource: Buffer | null = null

/**
 * Composite the PixPaw logo onto the bottom-right corner of an image.
 * Returns a PNG buffer with the same dimensions as the input.
 */
export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer)
  const { width, height, hasAlpha } = await image.metadata()
  if (!width || !height) {
    throw new Error('applyWatermark: cannot read image dimensions')
  }

  if (!logoSource) {
    logoSource = await readFile(LOGO_PATH)
  }

  const logoWidth = Math.round(width * LOGO_WIDTH_RATIO)
  // dest-in against a semi-transparent tile = uniform 70% opacity
  const logo = await sharp(logoSource)
    .resize({ width: logoWidth })
    .ensureAlpha()
    .composite([
      {
        input: Buffer.from([255, 255, 255, Math.round(255 * LOGO_OPACITY)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer()

  const logoHeight = (await sharp(logo).metadata()).height ?? logoWidth
  const margin = Math.round(width * MARGIN_RATIO)

  const watermarked = image.composite([
    {
      input: logo,
      left: width - logoWidth - margin,
      top: height - logoHeight - margin,
    },
  ])

  if (!hasAlpha) {
    watermarked.removeAlpha()
  }

  return watermarked.png().toBuffer()
}
