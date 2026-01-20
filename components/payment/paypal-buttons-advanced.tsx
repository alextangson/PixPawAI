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

interface PayPalButtonsAdvancedProps {
  tier: 'starter' | 'pro' | 'master';
  price: string;
  credits: number;
  onSuccess?: (payment: any) => void;
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
  const isRenderingRef = useRef(false); // Prevent duplicate renders

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

    console.log('📦 Loading PayPal SDK...');
    const script = document.createElement('script');
    // PayPal SDK with all payment methods enabled
    // components: buttons (standard buttons), funding-eligibility (detect available methods)
    // enable-funding: explicitly enable card, venmo, paylater
    // intent: capture (immediate payment)
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons,funding-eligibility&enable-funding=card,venmo,paylater`;
    script.async = true;
    script.onload = () => {
      console.log('✅ PayPal SDK loaded successfully');
      setSdkReady(true);
    };
    script.onerror = (err) => {
      console.error('❌ Failed to load PayPal SDK:', err);
      setError('Failed to load PayPal. Please refresh and try again.');
    };
    
    document.body.appendChild(script);

    return () => {
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

    // Prevent duplicate rendering
    if (isRenderingRef.current) {
      console.log('⚠️ PayPal buttons already rendering, skipping...');
      return;
    }

    isRenderingRef.current = true;

    // Clear container
    buttonContainerRef.current.innerHTML = '';

    // Create PayPal buttons
    const paypal = window.paypal;

    try {
      // Use smart buttons (PayPal automatically shows all available payment methods)
      const buttons = paypal.Buttons({
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
          console.log('✅ Create order response:', data);

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
          console.error('❌ Create order error:', err);
          setError(err.message);
          setCreatingOrder(false);
          throw err;
        }
      },

      // On approve (user completed payment)
      onApprove: async (data: any) => {
        console.log('💰 Payment approved! Order ID:', data.orderID);
        setProcessing(true);
        
        try {
          console.log('🔄 Capturing payment...');
          const response = await fetch('/api/payments/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
          });

          const result = await response.json();
          console.log('Capture response:', result);

          if (!response.ok) {
            throw new Error(result.error || 'Payment capture failed');
          }

          // Success! Trigger parent callback
          console.log('✅ Payment successful! Credits added.');
          setProcessing(false);

          // Trigger confetti
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#FF6B6B', '#FFA500', '#FFD700', '#90EE90'],
          });

          // Callback to parent (PaymentModal will show success overlay)
          onSuccess?.(result.payment);

        } catch (err: any) {
          console.error('❌ Capture error:', err);
          setError(err.message);
          setProcessing(false);
          onError?.(err.message);
        }
      },

      // On cancel
      onCancel: (data: any) => {
        console.log('Payment cancelled by user:', data);
        setProcessing(false);
        setError('Payment cancelled. No charges were made.');
      },

      // On error
      onError: (err: any) => {
        console.error('❌ PayPal SDK error:', err);
        setError('Payment error. Please try again or contact support.');
        setProcessing(false);
        onError?.(err.toString());
      },
      });

      // Render the smart buttons (PayPal will automatically show all available methods)
      buttons.render(buttonContainerRef.current)
        .then(() => {
          console.log('✅ PayPal buttons rendered successfully');
          isRenderingRef.current = false;
        })
        .catch((err: any) => {
          console.error('❌ PayPal buttons render error:', err);
          isRenderingRef.current = false;
          // Don't show error if container was removed (component unmounted)
          if (buttonContainerRef.current) {
            setError('Failed to initialize payment buttons. Please refresh and try again.');
          }
        });

    } catch (err: any) {
      console.error('❌ PayPal buttons initialization error:', err);
      isRenderingRef.current = false;
      setError('Payment system error. Please refresh the page.');
    }

    // Cleanup function
    return () => {
      isRenderingRef.current = false;
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
