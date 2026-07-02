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
