# HD Unlock + Server-Side Watermark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "watermark-free HD download" a sellable $9.99 product by watermarking free assets server-side, moving clean originals to a private bucket, and adding a PayPal-backed per-generation unlock.

**Architecture:** The generation pipeline (`app/api/generate/route.ts`) currently uploads a clean original PNG to a **public** bucket — the paid product is free to anyone who opens devtools. We flip this: at generation time, sharp composites a logo watermark onto the original; the watermarked PNG + webp go to the public bucket, the clean original goes to a new **private** bucket (`generated-originals`). A new `hd_unlocks` table records $9.99 PayPal purchases per generation. A gated route `/api/generations/[id]/hd` is the ONLY path to a clean-original signed URL — entitled callers are: admins, generation owners with a paid tier (parity with today's client-side rule), and completed-unlock buyers. Credits system, generate quota logic, and the credits PayPal routes are untouched.

**Tech Stack:** Next.js 15 App Router, sharp 0.34 (already a dependency), Supabase (Postgres + Storage), PayPal REST v2 (existing helpers in `lib/paypal/config.ts`), `node:test` via `tsx` for unit tests (Node 26 local).

**Spec:** `docs/superpowers/specs/2026-07-01-monetization-flip-design.md` — this plan implements Block ① (plus the ①-scoped analytics item `download_free` from Block ⑥). Blocks ②③④⑤ get their own plans after this ships.

**Deviation from spec (deliberate):** the spec says "扩展 create-order/capture-order". We instead create sibling routes under `app/api/hd-unlock/` and leave the credits routes byte-identical — the credits path keeps working for existing users and regression risk drops to zero. Same PayPal helpers are reused.

**Known accepted gaps:**
- Legacy generations (created before this ships) keep their clean originals in the public bucket. New code paths handle them via fallbacks; we do not migrate old files.
- Server can't fire GA4 events; `hd_unlock` purchase events ship with the result-modal HD purchase UI in the Block ② plan. Only `download_free` lands here.
- A generation can theoretically be unlocked twice by two different buyers; both get what they paid for. No dedup beyond the pre-purchase `alreadyUnlocked` check.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260701_create_hd_unlocks.sql` | Create | `hd_unlocks` table + private `generated-originals` bucket |
| `lib/watermark.ts` | Create | Pure image transform: buffer in → watermarked PNG buffer out |
| `lib/__tests__/watermark.test.ts` | Create | Unit tests for the watermark transform |
| `lib/hd-unlock/entitlement.ts` | Create | Pure entitlement decision (no I/O) |
| `lib/hd-unlock/__tests__/entitlement.test.ts` | Create | Unit tests for entitlement rules |
| `lib/paypal/config.ts` | Modify | Add `HD_UNLOCK` price constant |
| `app/api/hd-unlock/create-order/route.ts` | Create | Create $9.99 PayPal order for a generation (guest OK) |
| `app/api/hd-unlock/capture-order/route.ts` | Create | Capture payment, mark unlock completed |
| `app/api/generations/[id]/hd/route.ts` | Create | Gated signed-URL issuer for clean originals |
| `app/api/generate/route.ts` | Modify | Watermark pipeline + private-bucket upload + new metadata/response fields |
| `components/result-modal.tsx` | Modify | Downloads go through the gate; `download_free` event |
| `components/upload-modal-wizard.tsx` | Modify | Pass `watermarkedUrl` through to the modal |
| `components/payment/payment-modal.tsx` | Modify | Remove false 2K/4K resolution claims |
| `package.json` | Modify | `tsx` devDependency + `test:unit` script |

---

### Task 1: Migration — `hd_unlocks` table + private bucket

**Files:**
- Create: `supabase/migrations/20260701_create_hd_unlocks.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ============================================
-- HD Unlocks - per-generation watermark-free download purchases
-- ============================================
-- Created: 2026-07-01
-- Purpose: Track $9.99 one-time HD unlock purchases (PayPal),
--          and create the private bucket for clean originals.
-- ============================================

CREATE TABLE IF NOT EXISTS public.hd_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,

  -- PayPal references
  paypal_order_id TEXT NOT NULL UNIQUE,
  paypal_capture_id TEXT,
  payer_email TEXT,

  -- Buyer, when logged in (guests buy with PayPal email only)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  amount_usd NUMERIC(6,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_hd_unlocks_generation_id ON public.hd_unlocks(generation_id);
CREATE INDEX idx_hd_unlocks_user_id ON public.hd_unlocks(user_id);

-- Server-only table: RLS on, no policies — service role bypasses RLS,
-- anon/authenticated clients get nothing.
ALTER TABLE public.hd_unlocks ENABLE ROW LEVEL SECURITY;

-- Private bucket for clean (un-watermarked) originals.
-- No storage policies => only the service-role client can read/sign.
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-originals', 'generated-originals', false)
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push`

If the project isn't linked to the Supabase CLI, paste the SQL into the Supabase Dashboard → SQL Editor and run it there (this is how earlier migrations in this repo were applied).

- [ ] **Step 3: Verify**

In the SQL editor (or `npx supabase db execute` if linked):

```sql
SELECT count(*) FROM public.hd_unlocks;                          -- expect: 0
SELECT id, public FROM storage.buckets WHERE id = 'generated-originals'; -- expect: 1 row, public = false
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260701_create_hd_unlocks.sql
git commit -m "feat(hd-unlock): add hd_unlocks table and private originals bucket"
```

---

### Task 2: Watermark utility (TDD)

**Files:**
- Create: `lib/watermark.ts`
- Test: `lib/__tests__/watermark.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add tsx and the test script**

Run: `npm install -D tsx`

In `package.json` `"scripts"`, after `"lint": "next lint",` add:

```json
    "test:unit": "tsx --test lib/__tests__/*.test.ts",
```

(Existing `.mjs` tests in `tests/` use `node:test` too; the repo's `lib/prompt-system/__tests__/*.test.ts` files are jest-syntax with no runner installed — leave them alone, they are out of scope.)

- [ ] **Step 2: Write the failing test**

Create `lib/__tests__/watermark.test.ts`:

```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module '../watermark'`

- [ ] **Step 4: Implement the watermark utility**

Create `lib/watermark.ts`. Visual parameters replicate the legacy client-side watermark (`components/result-modal.tsx:253-273`): same logo asset, ~160px wide on a 1024px image (ratio 0.16), bottom-right, ~20px margin (ratio 0.02), 70% opacity.

```ts
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
  const { width, height } = await image.metadata()
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

  return image
    .composite([
      {
        input: logo,
        left: width - logoWidth - margin,
        top: height - logoHeight - margin,
      },
    ])
    .png()
    .toBuffer()
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS — 3 tests

- [ ] **Step 6: Commit**

```bash
git add lib/watermark.ts lib/__tests__/watermark.test.ts package.json package-lock.json
git commit -m "feat(hd-unlock): server-side watermark utility with unit tests"
```

---

### Task 3: Wire watermark into the generation pipeline

**Files:**
- Modify: `app/api/generate/route.ts` (imports; `uploadBase64ToStorage` ~line 295; `generateWithReplicate` storage block ~lines 477-502 and return type ~line 356; metadata update ~lines 1284-1306; success response ~lines 1418-1426)

- [ ] **Step 1: Import the utility**

At the top of `app/api/generate/route.ts`, next to the other `@/lib` imports, add:

```ts
import { applyWatermark } from '@/lib/watermark'
```

- [ ] **Step 2: Let `uploadBase64ToStorage` target any bucket**

Change the signature (currently `async function uploadBase64ToStorage(base64Data: string, userId: string, generationId: string, format: 'png' | 'webp' = 'png')`) to:

```ts
async function uploadBase64ToStorage(
  base64Data: string,
  userId: string,
  generationId: string,
  format: 'png' | 'webp' = 'png',
  bucket: string = 'generated-results'
): Promise<{ publicUrl: string; storagePath: string }> {
```

and replace the two hardcoded `.from('generated-results')` calls inside it (upload at ~line 314, getPublicUrl at ~line 328) with `.from(bucket)`. Note: `getPublicUrl` on a private bucket returns a URL that 403s — callers of the private bucket use `storagePath` only.

- [ ] **Step 3: Watermark + three uploads in `generateWithReplicate`**

Update the return type annotation (~line 356) from
`Promise<{ publicUrl: string; storagePath: string; originalPath?: string }>` to:

```ts
Promise<{
  publicUrl: string
  storagePath: string
  originalPath?: string
  watermarkedUrl?: string
  watermarkedPath?: string
}>
```

Replace the block from `// Use sharp to compress image...` (~line 477) through the `return { ... }` (~line 502) with:

```ts
    // Server-side watermark: public assets are watermarked at rest.
    // The clean original goes to the PRIVATE bucket and is only reachable
    // through /api/generations/[id]/hd (paid tier / admin / HD unlock).
    const watermarkedBuffer = await applyWatermark(originalBuffer)

    const sharp = require('sharp')
    const compressedBuffer = await sharp(watermarkedBuffer)
      .webp({ quality: 80 })
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .toBuffer()

    // Watermarked webp — fast preview (public)
    const compressedResult = await uploadBase64ToStorage(
      compressedBuffer.toString('base64'), userId, generationId, 'webp')

    // Watermarked full-res PNG — free download (public)
    const watermarkedResult = await uploadBase64ToStorage(
      watermarkedBuffer.toString('base64'), userId, `${generationId}_wm`, 'png')

    // Clean original PNG — private bucket, gated
    const originalResult = await uploadBase64ToStorage(
      originalBuffer.toString('base64'), userId, `${generationId}_original`, 'png',
      'generated-originals')

    console.log(`✅ Image compression: Original=${(originalBuffer.length / 1024 / 1024).toFixed(2)}MB, Compressed=${(compressedBuffer.length / 1024 / 1024).toFixed(2)}MB`)

    return {
      publicUrl: compressedResult.publicUrl,
      storagePath: compressedResult.storagePath,
      originalPath: originalResult.storagePath,
      watermarkedUrl: watermarkedResult.publicUrl,
      watermarkedPath: watermarkedResult.storagePath,
    }
```

- [ ] **Step 4: Thread the new fields through record + response**

At the destructuring call site (~line 1266) add the new fields:

```ts
      const { publicUrl: publicImageUrl, storagePath, originalPath, watermarkedUrl, watermarkedPath } = await generateWithReplicate(
```

In the `.update({ ... metadata: { ... } })` success block (~lines 1291-1305), inside `metadata`, right after `originalImagePath: originalPath,` add:

```ts
            originalBucket: 'generated-originals', // clean original lives in the private bucket
            watermarkedPath: watermarkedPath,      // full-res watermarked PNG (public, free download)
```

In the success response (~lines 1418-1426), after `outputUrl: publicImageUrl,` add:

```ts
        watermarkedUrl, // full-res watermarked PNG public URL for free download
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: compiles with no type errors.

- [ ] **Step 6 (recommended, needs `REPLICATE_API_TOKEN` in `.env.local`): one real dev generation**

Run `npm run dev`, generate one portrait through the UI, then confirm in Supabase Dashboard → Storage:
- `generated-results/{id}/…-{genId}.webp` and `…-{genId}_wm.png` exist and are visibly watermarked (bottom-right logo);
- `generated-originals/{id}/…-{genId}_original.png` exists and is clean;
- opening the `_original` file's public-style URL returns 400/403 (bucket is private).

- [ ] **Step 7: Commit**

```bash
git add app/api/generate/route.ts
git commit -m "feat(hd-unlock): watermark public assets at generation, store clean originals privately"
```

---

### Task 4: HD unlock pricing + create-order route

**Files:**
- Modify: `lib/paypal/config.ts`
- Create: `app/api/hd-unlock/create-order/route.ts`

- [ ] **Step 1: Add the price constant**

In `lib/paypal/config.ts`, directly below the `PRICING_TIERS` block (~line 39), add:

```ts
// One-time per-generation HD unlock (watermark-free download)
export const HD_UNLOCK = {
  amount: '9.99',
  name: 'HD Portrait Unlock',
  description: 'Watermark-free high-resolution portrait download + personal print license',
} as const;
```

- [ ] **Step 2: Create the route**

Create `app/api/hd-unlock/create-order/route.ts`. Guests may buy — no auth wall; rate limiting mirrors the credits routes.

```ts
/**
 * HD Unlock - Create PayPal Order
 *
 * Method: POST
 * Body: { generationId: string }
 * Guest-friendly: no auth required; the unlock binds to the generation,
 * buyer identity comes from PayPal at capture time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PAYPAL_API_BASE, HD_UNLOCK, getPayPalAccessToken } from '@/lib/paypal/config';
import { checkRateLimitSmart } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const rateLimit = await checkRateLimitSmart(request, 'payment', user?.id);
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many payment attempts. Please wait ${Math.ceil(retryAfter / 60)} minutes.`,
          retryAfter,
        },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
      );
    }

    const body = await request.json();
    const { generationId } = body;
    if (!generationId || typeof generationId !== 'string') {
      return NextResponse.json({ error: 'generationId is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: generation } = await admin
      .from('generations')
      .select('id, status')
      .eq('id', generationId)
      .single();

    if (!generation || generation.status !== 'succeeded') {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    const { data: existing } = await admin
      .from('hd_unlocks')
      .select('id')
      .eq('generation_id', generationId)
      .eq('status', 'completed')
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'This portrait is already unlocked', alreadyUnlocked: true },
        { status: 409 }
      );
    }

    const accessToken = await getPayPalAccessToken();
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: 'PIXPAW-HD-UNLOCK',
          description: HD_UNLOCK.description,
          custom_id: generationId,
          amount: { currency_code: 'USD', value: HD_UNLOCK.amount },
        },
      ],
      application_context: {
        brand_name: 'PixPaw AI',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    };

    const paypalResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!paypalResponse.ok) {
      const errorData = await paypalResponse.json();
      console.error('[HD Unlock Create Order] PayPal error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create PayPal order. Please try again.' },
        { status: 500 }
      );
    }

    const orderData = await paypalResponse.json();

    const { error: insertError } = await admin.from('hd_unlocks').insert({
      generation_id: generationId,
      paypal_order_id: orderData.id,
      user_id: user?.id ?? null,
      amount_usd: parseFloat(HD_UNLOCK.amount),
      status: 'pending',
    });

    if (insertError) {
      console.error('[HD Unlock Create Order] DB insert failed:', insertError);
      return NextResponse.json(
        { error: 'Payment system error. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`✅ [HD Unlock] Order created: ${orderData.id} for generation ${generationId}`);
    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      amount: HD_UNLOCK.amount,
    });
  } catch (error: any) {
    console.error('[HD Unlock Create Order] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Payment system error. Please contact support.' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Build + smoke test**

Run: `npm run build` → expect no type errors.

With `npm run dev` running and PayPal sandbox creds in `.env.local`:

```bash
curl -s -X POST http://localhost:3000/api/hd-unlock/create-order \
  -H 'Content-Type: application/json' \
  -d '{"generationId":"<uuid of the Task 3 test generation>"}'
```

Expected: `{"success":true,"orderId":"<paypal id>","amount":"9.99"}` and a `pending` row in `hd_unlocks`.
Also verify a bogus id: `-d '{"generationId":"00000000-0000-0000-0000-000000000000"}'` → 404.

- [ ] **Step 4: Commit**

```bash
git add lib/paypal/config.ts app/api/hd-unlock/create-order/route.ts
git commit -m "feat(hd-unlock): PayPal create-order route for \$9.99 per-generation unlock"
```

---

### Task 5: HD unlock capture route

**Files:**
- Create: `app/api/hd-unlock/capture-order/route.ts`

- [ ] **Step 1: Create the route**

```ts
/**
 * HD Unlock - Capture PayPal Order
 *
 * Method: POST
 * Body: { orderId: string }
 * On success marks the unlock completed and returns the gated download path.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PAYPAL_API_BASE, getPayPalAccessToken } from '@/lib/paypal/config';
import { checkRateLimitSmart } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const rateLimit = await checkRateLimitSmart(request, 'payment', user?.id);
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
      );
    }

    const body = await request.json();
    const { orderId } = body;
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: unlock } = await admin
      .from('hd_unlocks')
      .select('*')
      .eq('paypal_order_id', orderId)
      .single();

    if (!unlock) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const downloadPath = `/api/generations/${unlock.generation_id}/hd?orderId=${orderId}`;

    if (unlock.status === 'completed') {
      return NextResponse.json({ success: true, alreadyCompleted: true, downloadPath });
    }

    const accessToken = await getPayPalAccessToken();
    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation',
        },
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error('[HD Unlock Capture] PayPal error:', errorData);
      await admin
        .from('hd_unlocks')
        .update({ status: 'failed' })
        .eq('id', unlock.id);
      return NextResponse.json(
        { error: 'Payment capture failed. No charges were made.' },
        { status: 400 }
      );
    }

    const captureData = await captureResponse.json();
    const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const payerEmail = captureData.payer?.email_address;

    const { error: updateError } = await admin
      .from('hd_unlocks')
      .update({
        status: 'completed',
        paypal_capture_id: captureId,
        payer_email: payerEmail,
        user_id: unlock.user_id ?? user?.id ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', unlock.id);

    if (updateError) {
      // Payment succeeded but our record didn't update — log loudly for manual reconciliation
      console.error(`🚨 CRITICAL: HD unlock ${unlock.id} captured (${captureId}) but status update failed:`, updateError);
    }

    console.log(`💰 [HD Unlock] Captured ${captureId} for generation ${unlock.generation_id} (${payerEmail})`);
    return NextResponse.json({ success: true, downloadPath });
  } catch (error: any) {
    console.error('[HD Unlock Capture] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Payment processing error. Please contact support if you were charged.' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Build**

Run: `npm run build` → expect no type errors. (Full capture needs a buyer approval in the PayPal sandbox UI — covered in Task 8.)

- [ ] **Step 3: Commit**

```bash
git add app/api/hd-unlock/capture-order/route.ts
git commit -m "feat(hd-unlock): PayPal capture route marks unlock completed"
```

---

### Task 6: Entitlement logic (TDD) + gated HD download route

**Files:**
- Create: `lib/hd-unlock/entitlement.ts`
- Test: `lib/hd-unlock/__tests__/entitlement.test.ts`
- Create: `app/api/generations/[id]/hd/route.ts`
- Modify: `package.json` (extend `test:unit` glob)

- [ ] **Step 1: Extend the test script**

In `package.json`, change `test:unit` to:

```json
    "test:unit": "tsx --test lib/__tests__/*.test.ts lib/hd-unlock/__tests__/*.test.ts",
```

- [ ] **Step 2: Write the failing tests**

Create `lib/hd-unlock/__tests__/entitlement.test.ts`:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { isEntitledToHd, HdUnlockRecord, HdViewer } from '../entitlement'

const anon: HdViewer = { userId: null, tier: null, role: null, isOwner: false }
const completedUnlock: HdUnlockRecord = {
  status: 'completed',
  paypal_order_id: 'PP-123',
  user_id: 'buyer-uuid',
}

test('anonymous with no unlock is denied', () => {
  assert.equal(isEntitledToHd(null, anon, null), false)
})

test('admin is always entitled', () => {
  const admin: HdViewer = { userId: 'u1', tier: null, role: 'admin', isOwner: false }
  assert.equal(isEntitledToHd(null, admin, null), true)
})

test('owner with a paid tier is entitled (legacy parity)', () => {
  const owner: HdViewer = { userId: 'u1', tier: 'pro', role: 'user', isOwner: true }
  assert.equal(isEntitledToHd(null, owner, null), true)
})

test('owner on free tier is denied', () => {
  const owner: HdViewer = { userId: 'u1', tier: null, role: 'user', isOwner: true }
  assert.equal(isEntitledToHd(null, owner, null), false)
})

test('non-owner with a paid tier is denied', () => {
  const stranger: HdViewer = { userId: 'u2', tier: 'master', role: 'user', isOwner: false }
  assert.equal(isEntitledToHd(null, stranger, null), false)
})

test('guest with matching orderId on a completed unlock is entitled', () => {
  assert.equal(isEntitledToHd(completedUnlock, anon, 'PP-123'), true)
})

test('guest with wrong orderId is denied', () => {
  assert.equal(isEntitledToHd(completedUnlock, anon, 'PP-999'), false)
})

test('pending unlock grants nothing', () => {
  const pending: HdUnlockRecord = { ...completedUnlock, status: 'pending' }
  assert.equal(isEntitledToHd(pending, anon, 'PP-123'), false)
})

test('logged-in buyer of the unlock is entitled without orderId', () => {
  const buyer: HdViewer = { userId: 'buyer-uuid', tier: null, role: 'user', isOwner: false }
  assert.equal(isEntitledToHd(completedUnlock, buyer, null), true)
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module '../entitlement'` (watermark tests still pass)

- [ ] **Step 4: Implement**

Create `lib/hd-unlock/entitlement.ts`:

```ts
export interface HdUnlockRecord {
  status: 'pending' | 'completed' | 'failed'
  paypal_order_id: string
  user_id: string | null
}

export interface HdViewer {
  userId: string | null
  tier: string | null
  role: string | null
  isOwner: boolean
}

const PAID_TIERS = ['starter', 'pro', 'master']

/**
 * Single source of truth for who may download a clean (un-watermarked) original.
 * Mirrors the legacy client-side rule (admin / paid-tier owner) and adds
 * per-generation HD unlock purchases (guest via orderId, or the logged-in buyer).
 */
export function isEntitledToHd(
  unlock: HdUnlockRecord | null,
  viewer: HdViewer,
  orderIdParam: string | null
): boolean {
  if (viewer.role === 'admin') return true
  if (viewer.isOwner && viewer.tier !== null && PAID_TIERS.includes(viewer.tier)) return true
  if (unlock && unlock.status === 'completed') {
    if (orderIdParam !== null && orderIdParam === unlock.paypal_order_id) return true
    if (viewer.userId !== null && viewer.userId === unlock.user_id) return true
  }
  return false
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS — 12 tests (3 watermark + 9 entitlement)

- [ ] **Step 6: Create the gated route**

Create `app/api/generations/[id]/hd/route.ts`:

```ts
/**
 * Gated HD download - the ONLY path to a clean-original signed URL.
 *
 * Method: GET /api/generations/[id]/hd?orderId=<paypal order id (guests)>
 * Returns: { downloadUrl } (signed, 60s) or 403.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isEntitledToHd, HdViewer } from '@/lib/hd-unlock/entitlement'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: generationId } = await params
    const orderIdParam = request.nextUrl.searchParams.get('orderId')

    const admin = createAdminClient()
    const { data: generation } = await admin
      .from('generations')
      .select('id, user_id, metadata, output_storage_path')
      .eq('id', generationId)
      .single()

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let viewer: HdViewer = { userId: null, tier: null, role: null, isOwner: false }
    if (user) {
      const { data: profile } = await admin
        .from('profiles')
        .select('tier, role')
        .eq('id', user.id)
        .single()
      viewer = {
        userId: user.id,
        tier: profile?.tier ?? null,
        role: profile?.role ?? null,
        isOwner: generation.user_id === user.id,
      }
    }

    let unlockQuery = admin
      .from('hd_unlocks')
      .select('status, paypal_order_id, user_id')
      .eq('generation_id', generationId)
      .eq('status', 'completed')
    if (orderIdParam) {
      unlockQuery = unlockQuery.eq('paypal_order_id', orderIdParam)
    } else if (user) {
      unlockQuery = unlockQuery.eq('user_id', user.id)
    }
    const { data: unlocks } = await unlockQuery.limit(1)
    const unlock = unlocks?.[0] ?? null

    if (!isEntitledToHd(unlock, viewer, orderIdParam)) {
      return NextResponse.json(
        { error: 'HD download not unlocked for this portrait' },
        { status: 403 }
      )
    }

    // New generations: clean original in the private bucket.
    // Legacy generations: fall back to the public-bucket original, then to the preview.
    const bucket = generation.metadata?.originalBucket ?? 'generated-results'
    const filePath = generation.metadata?.originalImagePath ?? generation.output_storage_path
    const { data: signed, error: signError } = await admin.storage
      .from(bucket)
      .createSignedUrl(filePath, 60)

    if (signError || !signed?.signedUrl) {
      console.error('[HD Download] Failed to sign URL:', signError)
      return NextResponse.json({ error: 'Failed to create download link' }, { status: 500 })
    }

    return NextResponse.json({ downloadUrl: signed.signedUrl })
  } catch (error: any) {
    console.error('[HD Download] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 7: Build + smoke test**

Run: `npm run build` → no type errors.

With dev server up:

```bash
# no entitlement → 403
curl -s "http://localhost:3000/api/generations/<test generation uuid>/hd"
# fake orderId → 403
curl -s "http://localhost:3000/api/generations/<test generation uuid>/hd?orderId=FAKE"
```

Expected: both return `{"error":"HD download not unlocked for this portrait"}` with status 403.

- [ ] **Step 8: Commit**

```bash
git add lib/hd-unlock/ app/api/generations/ package.json
git commit -m "feat(hd-unlock): entitlement rules and gated HD download route"
```

---

### Task 7: Result modal downloads through the gate + `download_free` event + remove false resolution claims

**Files:**
- Modify: `components/result-modal.tsx` (props type ~line 65; `handleDownloadOriginal` ~lines 300-325)
- Modify: `components/upload-modal-wizard.tsx` (~line 1745; plus storing `watermarkedUrl` from the generate response)
- Modify: `components/payment/payment-modal.tsx` (lines 49 and 61-63)

- [ ] **Step 1: Extend the modal props type**

In `components/result-modal.tsx`, inside `generationMetadata?: { ... }` (~lines 65-73), after `originalImagePath?: string` add:

```ts
    watermarkedUrl?: string // Full-res server-watermarked PNG (public) for free download
```

- [ ] **Step 2: Route downloads through the gate**

Replace `handleDownloadOriginal` (~lines 300-325) with:

```ts
  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadOriginal = async () => {
    setIsDownloading(true)
    try {
      // Entitled users (paid tier owner / admin / HD unlock) get the clean original.
      const res = await fetch(`/api/generations/${generationId}/hd`)
      if (res.ok) {
        const { downloadUrl } = await res.json()
        triggerDownload(downloadUrl, `pixpaw-${generationId}-hd.png`)
        return
      }

      // Everyone else: free watermarked download.
      trackEvent('download_free', { generation_id: generationId })
      const watermarkedUrl = generationMetadata?.watermarkedUrl
      if (watermarkedUrl) {
        // Server-watermarked at rest — download directly.
        triggerDownload(watermarkedUrl, `pixpaw-${generationId}.png`)
        return
      }

      // Legacy generations (pre server-watermark): keep the client-side path.
      await addWatermarkAndDownload(generatedImageUrl, `pixpaw-${generationId}.png`)
    } catch (error) {
      console.error('Download failed:', error)
      window.open(generatedImageUrl, '_blank')
    } finally {
      setIsDownloading(false)
    }
  }
```

Leave `addWatermarkAndDownload` in place — it is the legacy fallback. `setIsDownloading` inside it is now redundant but harmless.

- [ ] **Step 3: Pass `watermarkedUrl` from the wizard**

In `components/upload-modal-wizard.tsx`:

3a. At line 61, below `const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('')`, add:

```ts
  const [watermarkedUrl, setWatermarkedUrl] = useState<string>('')
```

3b. In the generation success block (line 819: `setGeneratedImageUrl(result.outputUrl)`), immediately after that line add:

```ts
      setWatermarkedUrl(result.watermarkedUrl || '')
```

3c. Both reset sites call `setGeneratedImageUrl('')` (lines 259 and ~1740). Next to each, add:

```ts
        setWatermarkedUrl('')
```

3d. In the `generationMetadata={{ ... }}` prop (~lines 1745-1750), change the last entry `strength: strength` to:

```ts
                strength: strength,
                watermarkedUrl: watermarkedUrl || undefined
```

- [ ] **Step 4: Remove the false resolution claims**

In `components/payment/payment-modal.tsx`:
- Line 49: delete `'2K High Resolution (2048px)',`
- Line 61: change `'200 Ultra-HD Generations'` to `'200 Generation Credits'`
- Line 63: delete `'4K Resolution (4096px)',`

(Generation output is fixed at ~1024px — `megapixels: "1"` in `app/api/generate/route.ts:391`. Nothing upscales. These claims were false advertising; the Block ④ pricing-page plan removes their pricing-page copies.)

- [ ] **Step 5: Build + manual verification**

Run: `npm run build` → no type errors.

In `npm run dev`:
1. Generate as a guest → result modal → Download Original High-Res → downloaded PNG has the bottom-right logo watermark; GA `download_free` event visible in the browser console/network (`collect?` request) or GA4 DebugView.
2. Log in as an admin or paid-tier account (if one exists locally) → same download → clean PNG, no watermark.

- [ ] **Step 6: Commit**

```bash
git add components/result-modal.tsx components/upload-modal-wizard.tsx components/payment/payment-modal.tsx
git commit -m "feat(hd-unlock): gate modal downloads, add download_free event, drop false 2K/4K claims"
```

---

### Task 8: End-to-end sandbox verification

**Files:** none (verification only). PayPal sandbox credentials must be in `.env.local` (`PAYPAL_ENVIRONMENT` unset or ≠ `production`).

- [ ] **Step 1: Fresh generation → storage layout**

Generate a new portrait as a guest. In Supabase Storage confirm the three objects from Task 3 Step 6 (watermarked webp + `_wm.png` public; `_original.png` private and not fetchable via public URL).

- [ ] **Step 2: Free path is watermarked**

Download via the modal as a guest → PNG carries the watermark. Open the browser network tab during the whole flow → no URL serving a clean original appears.

- [ ] **Step 3: Guest HD purchase (sandbox)**

The purchase UI ships in the Block ② plan, so drive the API directly:

```bash
# 1. create
curl -s -X POST http://localhost:3000/api/hd-unlock/create-order \
  -H 'Content-Type: application/json' -d '{"generationId":"<gen uuid>"}'
# → note orderId

# 2. approve in browser (sandbox buyer account):
#    https://www.sandbox.paypal.com/checkoutnow?token=<orderId>

# 3. capture
curl -s -X POST http://localhost:3000/api/hd-unlock/capture-order \
  -H 'Content-Type: application/json' -d '{"orderId":"<orderId>"}'
# → expect {"success":true,"downloadPath":"/api/generations/<gen>/hd?orderId=<orderId>"}

# 4. gated download
curl -s "http://localhost:3000<downloadPath>"
# → expect {"downloadUrl":"https://...token=..."} — fetch it, verify the PNG has NO watermark
```

Also re-run step 4 with a wrong orderId → 403. Check `hd_unlocks` row: `status=completed`, `payer_email` filled.

- [ ] **Step 4: Regression sweep**

- Credits purchase flow still works (open pricing → PayPal modal → sandbox purchase → credits added).
- A legacy (pre-deploy) generation still downloads via the modal (client-watermark fallback).
- `npm run test:unit` → 12 passing; `node --test tests/` → existing SEO tests still pass; `npm run build` clean.

- [ ] **Step 5: Deploy + production spot-check**

Push to main → Vercel deploy. Then: one real production generation (guest), confirm watermark on free download, confirm `generated-originals` object created, confirm GA4 DebugView shows `download_free`. Do NOT run a production PayPal purchase — sandbox coverage is sufficient until the Block ② UI ships.

- [ ] **Step 6: Update the renovation plan status**

In `SITE_RENOVATION_PLAN.md`, under Stage 4, note: HD unlock backend + server watermark shipped (date), pointing at this plan file. Commit:

```bash
git add SITE_RENOVATION_PLAN.md
git commit -m "docs: mark HD unlock backend shipped in renovation plan"
```
