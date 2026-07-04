/**
 * Generate memorial style preview thumbnails.
 *
 * One-off: runs the real flux-dev img2img pipeline (same model as production)
 * on a sample pet photo to produce clean, non-watermarked preview images for
 * the new memorial styles. Output → public/styles/<id>.jpg
 *
 * Usage: node scripts/generate-memorial-previews.js
 */

const fs = require('fs');
const path = require('path');
const Replicate = require('replicate');
const sharp = require('sharp');

// --- Load REPLICATE_API_TOKEN from .env.local (no dotenv dependency) ---
const envPath = path.join(__dirname, '..', '.env.local');
const envText = fs.readFileSync(envPath, 'utf8');
const tokenMatch = envText.match(/^REPLICATE_API_TOKEN=(.+)$/m);
if (!tokenMatch) {
  console.error('❌ REPLICATE_API_TOKEN not found in .env.local');
  process.exit(1);
}
const token = tokenMatch[1].trim().replace(/^["']|["']$/g, '');
const replicate = new Replicate({ auth: token });

const INPUT_PHOTO = path.join(__dirname, '..', 'public', 'hero', 'originals', 'christmas-original.jpg');
const OUT_DIR = path.join(__dirname, '..', 'public', 'styles');

// Identity-preservation base prefix (mirrors the production prompt intent)
const BASE_PREFIX =
  'professional heartfelt pet memorial portrait, preserve the exact fur colors, markings and unique facial features of the pet, keep the pet fully recognizable';

const STYLES = [
  {
    id: 'rainbow-bridge',
    strength: 0.83,
    guidance: 2.5,
    suffix:
      ', sitting peacefully in a serene heavenly meadow, a soft luminous rainbow arcing gently across a dreamy pastel sky, wispy glowing clouds and warm golden backlight, gentle ethereal glow around the pet, delicate wildflowers, tender and comforting memorial atmosphere, soft and painterly, sharp focus on the face, high detail, 8k',
  },
  {
    id: 'guardian-angel',
    strength: 0.83,
    guidance: 2.5,
    suffix:
      ', gentle guardian angel tribute, soft white feathered angel wings behind the pet, a delicate faint golden halo glowing softly above the head, bathed in warm divine white and gold light, soft heavenly clouds, serene and loving expression, luminous ethereal glow, tender and peaceful, sharp focus on the face, high detail, 8k',
  },
  {
    id: 'watercolor-keepsake',
    strength: 0.9,
    guidance: 2.5,
    // Full prompt override — lead hard with the MEDIUM so it repaints rather
    // than staying photographic (0.8 kept photo realism). Painting-forward.
    prompt:
      'a tender hand-painted watercolor painting of this white fluffy dog, soft translucent color washes, wet-on-wet bleeding pigments, visible watercolor paper texture, delicate loose brush strokes, muted pastel palette, timeless keepsake memorial artwork, soft and comforting, preserve the pet fur colors and facial features, fine art watercolor illustration',
    negative:
      'photograph, photo, realistic, hyperrealistic, 3d, cgi, sharp photographic detail, street, road, buildings, pavement, sidewalk',
  },
];

async function outputToBuffer(output) {
  const item = Array.isArray(output) ? output[0] : output;
  if (typeof item === 'string') {
    const res = await fetch(item);
    return Buffer.from(await res.arrayBuffer());
  }
  if (item && typeof item.url === 'function') {
    const res = await fetch(item.url());
    return Buffer.from(await res.arrayBuffer());
  }
  if (item && typeof item.blob === 'function') {
    return Buffer.from(await (await item.blob()).arrayBuffer());
  }
  throw new Error('Unexpected Replicate output shape: ' + JSON.stringify(item).slice(0, 160));
}

async function run() {
  const only = process.argv[2]; // optional: regenerate a single style by id
  const styles = only ? STYLES.filter((s) => s.id === only) : STYLES;
  if (only && styles.length === 0) {
    console.error(`❌ No style with id "${only}"`);
    process.exit(1);
  }

  const imageDataUri = `data:image/jpeg;base64,${fs.readFileSync(INPUT_PHOTO).toString('base64')}`;
  const results = [];

  for (const s of styles) {
    process.stdout.write(`\n🎨 ${s.id} (strength ${s.strength}) ... `);
    try {
      const output = await replicate.run('black-forest-labs/flux-dev', {
        input: {
          prompt: s.prompt || BASE_PREFIX + s.suffix,
          image: imageDataUri,
          prompt_strength: s.strength,
          guidance: s.guidance,
          num_outputs: 1,
          num_inference_steps: 50,
          output_format: 'png',
          output_quality: 90,
          go_fast: false,
          megapixels: '1',
          disable_safety_checker: true,
          ...(s.negative ? { negative_prompt: s.negative } : {}),
        },
      });
      const buf = await outputToBuffer(output);
      const outPath = path.join(OUT_DIR, `${s.id}.jpg`);
      await sharp(buf).resize(800, 800, { fit: 'inside' }).jpeg({ quality: 85 }).toFile(outPath);
      const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
      console.log(`✅ saved ${s.id}.jpg (${kb} KB)`);
      results.push({ id: s.id, ok: true });
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      results.push({ id: s.id, ok: false, error: err.message });
    }
  }

  console.log('\n— Summary —');
  results.forEach((r) => console.log(`  ${r.ok ? '✅' : '❌'} ${r.id}${r.error ? ' — ' + r.error : ''}`));
  if (results.some((r) => !r.ok)) process.exit(1);
}

run().catch((e) => {
  console.error('\n❌ Fatal:', e);
  process.exit(1);
});
