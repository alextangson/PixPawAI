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

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Sparkles, ShieldCheck, CheckCircle } from 'lucide-react';
import { PayPalButtonsHdUnlock } from '@/components/payment/paypal-buttons-hd-unlock';
import { trackPurchase } from '@/components/analytics';

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

  // Parent keeps this dialog mounted and only toggles isOpen, so reset the
  // success state each time it opens (else a second unlock in the same session
  // reopens straight to the stale "Unlocked" screen with no purchase path).
  useEffect(() => {
    if (isOpen) setUnlocked(false);
  }, [isOpen, generationId]);

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
