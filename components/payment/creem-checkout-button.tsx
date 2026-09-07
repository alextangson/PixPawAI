'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CreditCard, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import type { PricingTier } from '@/lib/payments/catalog';

interface CreemCheckoutButtonProps {
  tier: PricingTier;
}

export function CreemCheckoutButton({ tier }: CreemCheckoutButtonProps) {
  const params = useParams<{ lang?: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/payments/creem/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, locale: params?.lang ?? 'en' }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.checkoutUrl !== 'string') {
        throw new Error(result.error || 'Unable to start checkout.');
      }
      window.location.assign(result.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to start checkout.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-coral to-orange-600 px-5 py-4 text-base font-bold text-white shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex items-center justify-center gap-2">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
          {loading ? 'Preparing secure checkout…' : 'Continue to secure checkout'}
        </span>
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        Secure checkout and tax handling by Creem
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
