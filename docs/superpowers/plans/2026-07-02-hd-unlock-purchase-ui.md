# HD Unlock Purchase UI (Block ②) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the shipped $9.99 HD-unlock backend into revenue by presenting the purchase at the download-intent peak: when an un-entitled user clicks "Download High-Res", offer watermark-free HD ($9.99, PayPal) vs the free watermarked download — and auto-deliver the clean original after payment.

**Architecture:** A new `HdUnlockDialog` intercepts the download-gate 403 in `result-modal.tsx` instead of silently downloading the watermarked file. Inside it, a new focused `PayPalButtonsHdUnlock` component drives `/api/hd-unlock/create-order` + `/api/hd-unlock/capture-order` (both already live) and returns the `downloadPath` PayPal capture hands back (`/api/generations/[id]/hd?orderId=...`) — the dialog then fetches that gated URL and downloads the clean original, closing the guest-orderId dependency flagged in Block ①. A light left-action-bar reorder makes Download the primary action and calms the credit-era "Share to Gallery" CTA. Merch push (right panel) and referral card are untouched.

**Tech Stack:** Next.js 15 App Router, React 18 client components, `@/components/ui/dialog` (Radix), PayPal JS SDK (browser, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`), `canvas-confetti`, GA4 via `trackEvent`/`trackPurchase` in `components/analytics.tsx`.

**Spec:** `docs/superpowers/specs/2026-07-01-monetization-flip-design.md` (Block ②). Block ① backend is merged and live (merge de15942); this plan consumes routes `/api/hd-unlock/create-order`, `/api/hd-unlock/capture-order`, `/api/generations/[id]/hd`.

**User-approved design decisions:**
- HD entry point = **download-intent gate** (not a standalone persistent CTA).
- Scope = **add HD + light reorder** (merch stays hero; do NOT touch merch push or referral card; do NOT touch pricing page — that's Block ④).
- **New focused PayPal component**, not a refactor of the revenue-critical `paypal-buttons-advanced.tsx` (no sandbox creds locally — `PAYPAL_ENVIRONMENT=production` — so refactoring the credits path would need real-money regression testing). Duplication of ~SDK boilerplate is accepted debt; a DRY refactor is a separate future task.

**Testing note:** This repo has no React component test runner (only `node:test` for pure `lib/` logic via `npm run test:unit`). Component/UI behavior is verified by `npx tsc --noEmit` (no new errors vs the 82 pre-existing jest-typing baseline) + `npm run build` + manual browser verification against the live backend. Do NOT scaffold a new test framework — out of scope. The one piece of pure logic extracted (the post-capture download-path handling) is trivial and inlined; no unit test is added for UI glue, consistent with the codebase.

**Known accepted gaps:**
- The gate only intercepts the **full-res** download ("Download High-Res"). "Create Art Card" is unaffected (it's a share asset, not the product).
- Logged-in non-owner strangers who somehow open a result modal for another user's generation are already blocked server-side by the `/hd` gate; the dialog just surfaces the purchase.
- No email receipt for the HD unlock (Resend integration is Block ③).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `components/payment/paypal-buttons-hd-unlock.tsx` | Create | PayPal buttons bound to `/api/hd-unlock/*`; input `generationId`; `onSuccess(downloadPath)` |
| `components/hd-unlock-dialog.tsx` | Create | The download-gate choice UI: thumbnail + $9.99 + PayPal + free-watermark fallback + success/auto-download |
| `components/result-modal.tsx` | Modify | Split `handleDownloadOriginal` so the 403 branch opens `HdUnlockDialog`; light left-action-bar reorder; render the dialog |

---

### Task 1: `PayPalButtonsHdUnlock` component

**Files:**
- Create: `components/payment/paypal-buttons-hd-unlock.tsx`

Mirrors `components/payment/paypal-buttons-advanced.tsx` (SDK load + smart-buttons render + status UI) but bound to the HD-unlock endpoints and a `generationId`. On capture success it calls `onSuccess(downloadPath)` where `downloadPath` is the value returned by `/api/hd-unlock/capture-order` (`/api/generations/<gen>/hd?orderId=<orderId>`).

- [ ] **Step 1: Create the component**

```tsx
/**
 * PayPal Buttons — HD Unlock ($9.99 per-generation watermark-free download)
 *
 * Sibling of paypal-buttons-advanced.tsx (credits). Kept separate on purpose:
 * the credits component is revenue-critical and can only be regression-tested
 * against production PayPal, so we don't refactor it to share this. A DRY pass
 * is tracked as a follow-up.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PayPalButtonsHdUnlockProps {
  generationId: string;
  /** Called after capture succeeds. `downloadPath` = /api/generations/<id>/hd?orderId=<orderId> */
  onSuccess: (downloadPath: string) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export function PayPalButtonsHdUnlock({
  generationId,
  onSuccess,
  onError,
}: PayPalButtonsHdUnlockProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const isRenderingRef = useRef(false);

  // Load PayPal SDK (idempotent — reuses window.paypal if another component already loaded it)
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      console.error('❌ NEXT_PUBLIC_PAYPAL_CLIENT_ID not configured');
      setError('Payment system not configured. Please contact support.');
      return;
    }
    if (window.paypal) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons,funding-eligibility&enable-funding=card,venmo,paylater`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setError('Failed to load PayPal. Please refresh and try again.');
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  // Render buttons
  useEffect(() => {
    if (!sdkReady || !buttonContainerRef.current || !window.paypal) return;
    if (isRenderingRef.current) return;
    isRenderingRef.current = true;
    buttonContainerRef.current.innerHTML = '';

    const paypal = window.paypal;
    try {
      const buttons = paypal.Buttons({
        style: { layout: 'vertical', shape: 'rect', height: 44, tagline: false },

        createOrder: async () => {
          setCreatingOrder(true);
          setError(null);
          try {
            const response = await fetch('/api/hd-unlock/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ generationId }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create order');
            if (!data.orderId) throw new Error('Order ID not received from server');
            setCreatingOrder(false);
            return data.orderId;
          } catch (err: any) {
            setError(err.message);
            setCreatingOrder(false);
            throw err;
          }
        },

        onApprove: async (data: any) => {
          setProcessing(true);
          try {
            const response = await fetch('/api/hd-unlock/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Payment capture failed');
            if (!result.downloadPath) throw new Error('Download path missing from capture response');
            setProcessing(false);
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#FF6B6B', '#FFA500', '#FFD700', '#90EE90'],
            });
            onSuccess(result.downloadPath);
          } catch (err: any) {
            setError(err.message);
            setProcessing(false);
            onError?.(err.message);
          }
        },

        onCancel: () => {
          setProcessing(false);
          setError('Payment cancelled. No charges were made.');
        },

        onError: (err: any) => {
          setError('Payment error. Please try again or contact support.');
          setProcessing(false);
          onError?.(err.toString());
        },
      });

      buttons
        .render(buttonContainerRef.current)
        .then(() => {
          isRenderingRef.current = false;
        })
        .catch(() => {
          isRenderingRef.current = false;
          if (buttonContainerRef.current) {
            setError('Failed to initialize payment buttons. Please refresh and try again.');
          }
        });
    } catch {
      isRenderingRef.current = false;
      setError('Payment system error. Please refresh the page.');
    }

    return () => {
      isRenderingRef.current = false;
    };
  }, [sdkReady, generationId, onSuccess, onError]);

  return (
    <div className="space-y-3">
      {creatingOrder && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
          <p className="text-sm text-orange-900 font-medium">Preparing secure checkout…</p>
        </div>
      )}
      {processing && !creatingOrder && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-sm text-blue-900 font-medium">Unlocking your HD download…</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-1 text-xs text-red-700 font-semibold underline hover:text-red-900"
              >
                → Try again
              </button>
            </div>
          </div>
        </div>
      )}
      {!sdkReady ? (
        <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin mr-2" />
          <p className="text-gray-600 text-sm">Loading secure checkout…</p>
        </div>
      ) : (
        <div ref={buttonContainerRef} className="space-y-2" />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify types + build**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `82` (unchanged baseline — the pre-existing jest-typing errors in `lib/**/__tests__`; zero should reference `paypal-buttons-hd-unlock`). Confirm with:
Run: `npx tsc --noEmit 2>&1 | grep "paypal-buttons-hd-unlock" || echo "no errors in new file"`
Expected: `no errors in new file`

- [ ] **Step 3: Commit**

```bash
git add components/payment/paypal-buttons-hd-unlock.tsx
git commit -m "feat(hd-unlock): PayPal buttons component bound to hd-unlock endpoints"
```

---

### Task 2: `HdUnlockDialog` component

**Files:**
- Create: `components/hd-unlock-dialog.tsx`

The download-gate choice UI. Props: open state, the generation's `generationId`, a preview `imageUrl` (the watermarked webp already shown in the modal — used as the thumbnail), and two callbacks: `onFreeDownload` (user chose the free watermarked path) and `onClose`. On PayPal success it fetches the returned `downloadPath`, triggers the clean-original download itself, shows a brief success state, then closes.

- [ ] **Step 1: Create the component**

```tsx
/**
 * HD Unlock Dialog — the download-intent gate.
 *
 * Shown when an un-entitled user clicks "Download High-Res". Offers the
 * $9.99 watermark-free HD download (PayPal) vs the free watermarked file.
 * On successful purchase it fetches the gated download URL (using the orderId
 * PayPal capture returns) and downloads the clean original directly — so guests
 * with no session still receive what they paid for.
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Sparkles, ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
import { PayPalButtonsHdUnlock } from '@/components/payment/paypal-buttons-hd-unlock';
import { trackEvent, trackPurchase } from '@/components/analytics';

interface HdUnlockDialogProps {
  isOpen: boolean;
  generationId: string;
  imageUrl: string;
  onFreeDownload: () => void;
  onClose: () => void;
}

export function HdUnlockDialog({
  isOpen,
  generationId,
  imageUrl,
  onFreeDownload,
  onClose,
}: HdUnlockDialogProps) {
  const [unlocked, setUnlocked] = useState(false);

  const handleSuccess = async (downloadPath: string) => {
    // GA4 conversion — mark hd_unlock as a key event alongside credits purchase.
    trackPurchase({
      transactionId: generationId,
      value: 9.99,
      currency: 'USD',
      items: [{ item_id: 'hd_unlock', item_name: 'HD Portrait Unlock', price: 9.99, quantity: 1 }],
    });
    setUnlocked(true);
    try {
      const res = await fetch(downloadPath);
      if (res.ok) {
        const { downloadUrl } = await res.json();
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `pixpaw-${generationId}-hd.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('HD download after unlock failed:', err);
    }
    // Give the browser a moment to start the download, then close.
    setTimeout(onClose, 2500);
  };

  const handleFree = () => {
    onFreeDownload();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 bg-white overflow-hidden !z-[9999]">
        <DialogTitle className="sr-only">Download in HD</DialogTitle>
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 hover:bg-gray-100 transition-colors z-[10000]"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {unlocked ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl mb-5">
              <CheckCircle className="w-11 h-11 text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlocked! 🎉</h3>
            <p className="text-gray-600">Your watermark-free HD download is starting…</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <img
                src={imageUrl}
                alt="Your portrait"
                className="w-20 h-20 rounded-lg object-cover shadow-md flex-shrink-0"
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  Download in HD
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Full resolution, <span className="font-semibold">no watermark</span> — yours to print & keep.
                </p>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-black text-coral">$9.99</span>
              <span className="text-sm text-gray-500">one-time · this portrait</span>
            </div>

            <ul className="space-y-2 mb-5">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Sparkles className="w-4 h-4 text-coral flex-shrink-0" />
                Original-resolution PNG, watermark removed
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                Personal print license · secure PayPal checkout
              </li>
            </ul>

            <PayPalButtonsHdUnlock generationId={generationId} onSuccess={handleSuccess} />

            <button
              onClick={handleFree}
              className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
            >
              or download the free version (with watermark)
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit 2>&1 | grep "hd-unlock-dialog" || echo "no errors in new file"`
Expected: `no errors in new file`

- [ ] **Step 3: Commit**

```bash
git add components/hd-unlock-dialog.tsx
git commit -m "feat(hd-unlock): Hd unlock dialog (download-intent gate UI)"
```

---

### Task 3: Wire the gate into the result modal + light reorder

**Files:**
- Modify: `components/result-modal.tsx` (import + state near line 90-118; `handleDownloadOriginal` at lines 311-341; left action-bar buttons at lines 559-611; render the dialog near the closing fragment)

- [ ] **Step 1: Import the dialog**

In `components/result-modal.tsx`, with the other component imports near the top (after the `dropdown-menu` import block ends at line 18), add:

```tsx
import { HdUnlockDialog } from '@/components/hd-unlock-dialog'
```

- [ ] **Step 2: Add dialog state**

In the component body, next to the other `useState` hooks (e.g. after `const [isDownloading, setIsDownloading] = useState(false)` around line 117), add:

```tsx
  const [hdDialogOpen, setHdDialogOpen] = useState(false)
```

- [ ] **Step 3: Split `handleDownloadOriginal` so 403 opens the gate**

Replace the whole `handleDownloadOriginal` function (currently lines 311-341) with the version below. The entitled path is unchanged; the previously-silent free-download branch is extracted into `downloadFreeWatermarked()` (called by the dialog's fallback link), and the 403 path now opens the dialog instead of downloading:

```tsx
  const downloadFreeWatermarked = async () => {
    setIsDownloading(true)
    try {
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
      console.error('Free download failed:', error)
      window.open(generatedImageUrl, '_blank')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadOriginal = async () => {
    setIsDownloading(true)
    try {
      // Entitled users (paid tier owner / admin / prior HD unlock) get the clean original.
      const res = await fetch(`/api/generations/${generationId}/hd`)
      if (res.ok) {
        const { downloadUrl } = await res.json()
        triggerDownload(downloadUrl, `pixpaw-${generationId}-hd.png`)
        return
      }
      // Un-entitled: surface the download-intent gate ($9.99 HD vs free watermarked).
      trackEvent('hd_unlock_view', { generation_id: generationId })
      setHdDialogOpen(true)
    } catch (error) {
      console.error('Download gate check failed:', error)
      // Network hiccup on the gate check — fall back to the free download rather than blocking.
      await downloadFreeWatermarked()
    } finally {
      setIsDownloading(false)
    }
  }
```

Note: `triggerDownload`, `addWatermarkAndDownload`, `trackEvent`, `generationMetadata`, `generatedImageUrl`, `generationId`, `setIsDownloading` are all already defined/imported in this file — do not redefine them.

- [ ] **Step 4: Light left-action-bar reorder**

In the `!isShared` branch of the action buttons (currently lines 559-591), swap the emphasis so **Download is the primary action** and **Share to Gallery is calmer**. Replace the block:

```tsx
                  {!isShared ? (
                    <>
                      <Button
                        onClick={handleShareClick}
                        disabled={showShareInput}
                        className="w-full sm:col-span-2 bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold h-12 text-base shadow-lg"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Share to Gallery (+1 Credit)
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full sm:col-span-2 border-2 hover:bg-gray-50 font-medium h-11"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          <DropdownMenuItem onClick={handleDownloadOriginal}>
                            <Download className="w-4 h-4 mr-2" />
                            Original High-Res
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleCreateArtCard}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Create Art Card
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
```

with (Download promoted to the filled primary button; Share demoted to outline; menu items unchanged):

```tsx
                  {!isShared ? (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="w-full sm:col-span-2 bg-gray-900 hover:bg-gray-800 text-white font-bold h-12 text-base shadow-lg"
                          >
                            <Download className="w-5 h-5 mr-2" />
                            Download High-Res
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          <DropdownMenuItem onClick={handleDownloadOriginal}>
                            <Download className="w-4 h-4 mr-2" />
                            Original High-Res
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleCreateArtCard}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Create Art Card
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        onClick={handleShareClick}
                        disabled={showShareInput}
                        variant="outline"
                        className="w-full sm:col-span-2 border-2 border-coral/40 text-coral hover:bg-coral/5 font-semibold h-11"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Share to Gallery (+1 Credit)
                      </Button>
                    </>
                  ) : (
```

(The `isShared` branch at lines 592-610 is unchanged — it already offers Create Art Card + Download Original after sharing.)

- [ ] **Step 5: Render the dialog**

The component returns a fragment `<> … </>` (opens at line 442, and the Art Card modal / referral modal render before the closing `</>`). Add the dialog just before the closing `</>` of the returned fragment, alongside the other modals:

```tsx
      <HdUnlockDialog
        isOpen={hdDialogOpen}
        generationId={generationId}
        imageUrl={generatedImageUrl}
        onFreeDownload={downloadFreeWatermarked}
        onClose={() => setHdDialogOpen(false)}
      />
```

To place it correctly: find the closing `</>` that matches the `return (` `<>` at line 442 (it is the last `</>` before the final `)` of the component). Insert the block immediately above that closing `</>`.

- [ ] **Step 6: Verify types + build**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `82` (unchanged baseline)
Run: `npx tsc --noEmit 2>&1 | grep -E "result-modal|hd-unlock" || echo "no errors in touched files"`
Expected: `no errors in touched files`
Run: `npm run build 2>&1 | tail -5`
Expected: compiles (the `/en/blog` static-gen failure from missing build-time WordPress/Supabase env is pre-existing and unrelated — confirm the build reaches "Compiled successfully" / "Linting and checking validity of types" before any such failure).

- [ ] **Step 7: Commit**

```bash
git add components/result-modal.tsx
git commit -m "feat(hd-unlock): download-intent gate + light action-bar reorder in result modal"
```

---

### Task 4: Manual browser verification (against live backend)

**Files:** none (verification only). Requires `.env.local` pulled from Vercel (Supabase + PayPal live keys already present) and `npm run dev`.

- [ ] **Step 1: Free user hits the gate, not a silent download**

Sign in as a non-paid test account (e.g. `hd-unlock-test@pixpaw.test`), generate a portrait, click **Love it → Download High-Res**. Expected: the `HdUnlockDialog` opens (does NOT silently download). GA `hd_unlock_view` fires (check DevTools Network `collect?` or GA DebugView).

- [ ] **Step 2: Free fallback still works**

In the dialog, click **"or download the free version (with watermark)"**. Expected: the watermarked PNG downloads; GA `download_free` fires; dialog closes.

- [ ] **Step 3: HD purchase → auto-delivery (real PayPal, then refund)**

Re-open the gate, complete the $9.99 PayPal purchase with a real account. Expected: confetti → success state "Unlocked! 🎉" → the **watermark-free** clean original downloads automatically → dialog closes after ~2.5s. Verify the downloaded PNG has no logo. Confirm in Supabase `hd_unlocks` the row is `status='completed'` with `payer_email`. GA4 `purchase` (value 9.99, item_id `hd_unlock`) appears in DebugView.
**Then refund** that $9.99 in the PayPal dashboard (this is a live-money test).

- [ ] **Step 4: Re-download after unlock is free (entitlement persists)**

With the same logged-in buyer, click **Download High-Res** again. Expected: NO dialog — the clean original downloads directly (the `/hd` gate now returns 200 for the buyer via `user_id` match).

- [ ] **Step 5: Reorder sanity + regression**

Confirm the left action bar now shows **Download High-Res** as the filled primary button and **Share to Gallery** as the calmer outline button; the right-panel merch push and referral card are visually unchanged. Confirm credits purchase still works (open pricing → PayPal modal renders — no need to buy). Run `npm run test:unit` → 15/15 still pass.

- [ ] **Step 6: Deploy + production spot-check**

Merge to `main` (Vercel auto-deploys). On production: generate as a guest, click Download High-Res → gate opens; pick the free option → watermarked download works. (Skip the live guest purchase unless you want a second real-money test — Step 3 already proved the paid path.) Update `SITE_RENOVATION_PLAN.md` Stage 4 to note the HD purchase UI shipped. (The "Block ② TODO" comment that was in `result-modal.tsx` is already removed as part of Task 3 Step 3's `handleDownloadOriginal` rewrite — the guest-orderId dependency is now closed by the dialog's post-capture download; nothing to remove here.) Commit:

```bash
git add SITE_RENOVATION_PLAN.md
git commit -m "docs: mark HD unlock purchase UI shipped in renovation plan"
```
