import test from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { applyWatermark } from '../watermark'

async function solidImage(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 30, b: 30 } },
  }).png().toBuffer()
}

test('output keeps input dimensions', async () => {
  const out = await applyWatermark(await solidImage(512, 512))
  const meta = await sharp(out).metadata()
  assert.equal(meta.width, 512)
  assert.equal(meta.height, 512)
})

test('draws in the bottom-right corner, leaves top-left untouched', async () => {
  const input = await solidImage(512, 512)
  const out = await applyWatermark(input)

  // logo width = 512 * 0.16 ≈ 82px, margin = 512 * 0.02 ≈ 10px
  // → logo occupies roughly x:[420..502] near the bottom edge
  const corner = { left: 415, top: 455, width: 90, height: 50 }
  const cornerBefore = await sharp(input).extract(corner).raw().toBuffer()
  const cornerAfter = await sharp(out).extract(corner).raw().toBuffer()
  assert.notDeepEqual(cornerAfter, cornerBefore)

  const topLeft = { left: 0, top: 0, width: 50, height: 50 }
  const tlBefore = await sharp(input).extract(topLeft).raw().toBuffer()
  const tlAfter = await sharp(out).extract(topLeft).raw().toBuffer()
  assert.deepEqual(tlAfter, tlBefore)
})

test('handles landscape (non-square) images', async () => {
  const out = await applyWatermark(await solidImage(1216, 832))
  const meta = await sharp(out).metadata()
  assert.equal(meta.width, 1216)
  assert.equal(meta.height, 832)
})

test('preserves channel layout (no alpha promotion on opaque input)', async () => {
  const opaqueOut = await applyWatermark(await solidImage(512, 512)) // 3-channel input
  assert.equal((await sharp(opaqueOut).metadata()).channels, 3)

  const rgbaInput = await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 200, g: 30, b: 30, alpha: 0.5 } },
  }).png().toBuffer()
  const rgbaOut = await applyWatermark(rgbaInput)
  assert.equal((await sharp(rgbaOut).metadata()).channels, 4)
})
