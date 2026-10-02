/**
 * Advanced PayPal Buttons Component
 * 
 * Uses PayPal JavaScript SDK for embedded checkout
 * Supports multiple funding sources:
 * - PayPal account
 * - Credit/Debit cards
 * - Apple Pay
 * - Google Pay
 * - Venmo
 * 
 * This provides a better UX than redirecting to PayPal
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Zap, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface CreditPaymentReceipt {
  orderId: string;
  tier: 'starter' | 'pro' | 'master';
  credits: number;
}

interface PayPalButtonsAdvancedProps {
  tier: 'starter' | 'pro' | 'master';
  price: string;
  credits: number;
  onSuccess?: (payment: CreditPaymentReceipt) => void;
  onError?: (error: string) => void;
}

// Load PayPal SDK dynamically
declare global {
  interface Window {
    paypal?: any;
  }
}

export function PayPalButtonsAdvanced({
  tier,
  price,
  credits,
  onSuccess,
  onError,
}: PayPalButtonsAdvancedProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  // Load PayPal SDK
  useEffect(() => {
    // Check if Client ID is configured
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      console.error('❌ NEXT_PUBLIC_PAYPAL_CLIENT_ID not configured');
      setError('Payment system not configured. Please contact support.');
      return;
    }

    if (window.paypal) {
      console.log('✅ PayPal SDK already loaded');
      setSdkReady(true);
      return;
    }

    let active = true;
    console.log('📦 Loading PayPal SDK...');
    const script = document.createElement('script');
    // PayPal SDK with all payment methods enabled
    // components: buttons (standard buttons), funding-eligibility (detect available methods)
    // enable-funding: explicitly enable card, venmo, paylater
    // intent: capture (immediate payment)
    // The site currently supports English only. Locale changes labels, not buyer eligibility.
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons,funding-eligibility&enable-funding=card,venmo,paylater&locale=en_US`;
    script.async = true;
    script.onload = () => {
      if (!active) return;
      console.log('✅ PayPal SDK loaded successfully');
      setSdkReady(true);
    };
    script.onerror = (err) => {
      if (!active) return;
      console.error('❌ Failed to load PayPal SDK:', err);
      setError('Failed to load PayPal. Please refresh and try again.');
    };
    
    document.body.appendChild(script);

    return () => {
      active = false;
      script.onload = null;
      script.onerror = null;
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Render PayPal buttons when SDK is ready
  useEffect(() => {
    if (!sdkReady || !buttonContainerRef.current || !window.paypal) {
      return;
    }

    let active = true;
    let buttons: any;
    const captures = new Map<string, Promise<void>>();
    setError(null);
    setProcessing(false);
    setCreatingOrder(false);

    // Clear container
    buttonContainerRef.current.innerHTML = '';

    // Create PayPal buttons
    const paypal = window.paypal;

    try {
      // Use smart buttons (PayPal automatically shows all available payment methods)
      buttons = paypal.Buttons({
      // Style configuration
      // layout: 'vertical' will stack all available payment methods
      style: {
        layout: 'vertical',
        shape: 'rect',
        height: 48,
        tagline: false,
      },

      // Create order
      createOrder: async () => {
        if (!active) throw new Error('Checkout session closed.');
        setCreatingOrder(true);
        setError(null);

        try {
          console.log('🚀 Creating PayPal order for tier:', tier);
          
          const response = await fetch('/api/payments/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tier }),
          });

          const data = await response.json();
          if (!active) throw new Error('Checkout session closed.');

          if (!response.ok) {
            throw new Error(data.error || 'Failed to create order');
          }

          if (!data.orderId) {
            throw new Error('Order ID not received from server');
          }

          console.log('🎉 Order created successfully:', data.orderId);
          setCreatingOrder(false);
          return data.orderId;
        } catch (err: any) {
          if (active) {
            setError(err.message);
            setCreatingOrder(false);
          }
          throw err;
        }
      },

      // Keep capture in flight after unmount; suppress stale UI, never abort fulfillment.
      onApprove: (data: { orderID: string }) => {
        if (!active) return;
        if (captures.has(data.orderID)) return captures.get(data.orderID);
        setProcessing(true);
        const capture = async () => {
          try {
            const response = await fetch('/api/payments/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const result = await response.json();
            const payment = result.payment;
            if (!response.ok || result.success !== true ||
                payment?.orderId !== data.orderID ||
                !['starter', 'pro', 'master'].includes(payment?.tier) ||
                !Number.isSafeInteger(payment?.credits) || payment.credits <= 0) {
              throw new Error(result.error || 'Payment could not be confirmed. Please contact support before paying again.');
            }
            if (!active) {
              // Fulfillment may finish after closing checkout. Re-read the
              // current user's balance without updating this obsolete session.
              window.dispatchEvent(new Event('credits-updated'));
              return;
            }
            setProcessing(false);
            confetti({
              particleCount: 150, spread: 80, origin: { y: 0.6 },
              colors: ['#FF6B6B', '#FFA500', '#FFD700', '#90EE90'],
            });
            onSuccess?.(payment);
          } catch (err: any) {
            captures.delete(data.orderID); // A confirmed failure may retry this same order.
            if (!active) return;
            setError(err.message);
            setProcessing(false);
            onError?.(err.message);
          }
        };
        // Schedule after registration so even synchronous failures cannot leave a stale entry.
        const pending = Promise.resolve().then(capture);
        captures.set(data.orderID, pending);
        return pending;
      },

      // On cancel
      onCancel: (data: any) => {
        if (!active) return;
        console.log('Payment cancelled by user:', data);
        setProcessing(false);
        setError('Payment cancelled. No charges were made.');
      },

      // On error
      onError: (err: any) => {
        if (!active) return;
        console.error('❌ PayPal SDK error:', err);
        setError('Payment error. Please try again or contact support.');
        setProcessing(false);
        onError?.(err.toString());
      },
      });

      // Render the smart buttons (PayPal will automatically show all available methods)
      buttons.render(buttonContainerRef.current)
        .then(() => {
          if (active) console.log('✅ PayPal buttons rendered successfully');
        })
        .catch((err: any) => {
          if (!active) return;
          console.error('❌ PayPal buttons render error:', err);
          // Don't show error if container was removed (component unmounted)
          if (buttonContainerRef.current) {
            setError('Failed to initialize payment buttons. Please refresh and try again.');
          }
        });

    } catch (err: any) {
      console.error('❌ PayPal buttons initialization error:', err);
      setError('Payment system error. Please refresh the page.');
    }

    // Cleanup function
    return () => {
      active = false;
      try {
        Promise.resolve(buttons?.close()).catch(() => {});
      } catch { /* A failed SDK close must not re-enable this session. */ }
    };

  }, [sdkReady, tier, credits, onSuccess, onError]);

  return (
    <div className="space-y-3">
      {creatingOrder && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 flex items-center gap-3 shadow-md">
          <div className="relative">
            <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
            <div className="absolute inset-0 bg-orange-400 rounded-full blur-md opacity-30"></div>
          </div>
          <div>
            <p className="text-sm text-orange-900 font-bold">
              Preparing secure checkout...
            </p>
            <p className="text-xs text-orange-700">
              This may take a few seconds
            </p>
          </div>
        </div>
      )}

      {processing && !creatingOrder && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-4 flex items-center gap-3 shadow-md">
          <div className="relative">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-30"></div>
          </div>
          <div>
            <p className="text-sm text-blue-900 font-bold">
              Processing your payment...
            </p>
            <p className="text-xs text-blue-700">
              Almost done!
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-4 shadow-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-red-900 font-bold mb-1">Payment Issue</p>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-xs text-red-700 font-semibold underline hover:text-red-900 transition-colors"
              >
                → Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {!sdkReady ? (
        <div className="flex items-center justify-center py-12 bg-gray-50 rounded-xl">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin mr-2" />
          <p className="text-gray-600">Loading secure checkout...</p>
        </div>
      ) : (
        <div ref={buttonContainerRef} className="space-y-2" />
      )}
    </div>
  );
}
