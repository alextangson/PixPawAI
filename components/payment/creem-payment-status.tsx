'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import { trackPurchase } from '@/components/analytics';

type Payment = {
  id: string;
  tier: string;
  amount_usd: number | string;
  credits_purchased: number;
  status: string;
  provider_order_id: string;
};

interface CreemPaymentStatusProps {
  locale: string;
  requestId: string | null;
  signatureValid: boolean;
}

export function CreemPaymentStatus({ locale, requestId, signatureValid }: CreemPaymentStatusProps) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signatureValid || !requestId) return;
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/payments/creem/status?requestId=${encodeURIComponent(requestId)}`, {
          cache: 'no-store',
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Payment status is unavailable.');
        if (cancelled) return;
        setPayment(result.payment);
        if (result.payment.status === 'completed') return;
        if (attempts >= 30) {
          setTimedOut(true);
          return;
        }
        timer = setTimeout(check, 1500);
      } catch (statusError) {
        if (!cancelled) setError(statusError instanceof Error ? statusError.message : 'Payment status is unavailable.');
      }
    };

    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [requestId, signatureValid]);

  useEffect(() => {
    if (payment?.status !== 'completed') return;
    const trackingKey = `creem_purchase_tracked:${payment.id}`;
    if (sessionStorage.getItem(trackingKey)) return;
    trackPurchase({
      transactionId: payment.provider_order_id,
      value: Number(payment.amount_usd),
      currency: 'USD',
      items: [{
        item_id: payment.tier,
        item_name: `${payment.tier} credits`,
        price: Number(payment.amount_usd),
        quantity: 1,
        item_category: 'digital',
      }],
    });
    sessionStorage.setItem(trackingKey, '1');
  }, [payment]);

  if (!signatureValid || !requestId) {
    return <StatusCard kind="error" title="We couldn't verify this return link" body="No account changes were made from this page. Open your dashboard or contact support if you were charged." locale={locale} />;
  }
  if (error) {
    return <StatusCard kind="error" title="We couldn't check your payment" body={`${error} Please contact support before paying again if your card was charged.`} locale={locale} />;
  }
  if (payment?.status === 'completed') {
    return <StatusCard kind="success" title="Payment successful" body={`${payment.credits_purchased} credits were added to your account.`} locale={locale} />;
  }
  if (payment?.status === 'refunded') {
    return <StatusCard kind="error" title="Payment refunded" body="This payment has been marked as refunded. Contact support if this is unexpected." locale={locale} />;
  }
  if (timedOut) {
    return <StatusCard kind="pending" title="Payment received, confirmation is taking longer" body="Do not pay again. Your credits will be added automatically after the signed payment notification arrives." locale={locale} />;
  }
  return <StatusCard kind="loading" title="Confirming your payment" body="Creem is securely confirming the transaction and adding your credits." locale={locale} />;
}

function StatusCard({ kind, title, body, locale }: {
  kind: 'success' | 'loading' | 'pending' | 'error';
  title: string;
  body: string;
  locale: string;
}) {
  const Icon = kind === 'success' ? CheckCircle : kind === 'error' ? XCircle : kind === 'pending' ? Clock : Loader2;
  const color = kind === 'success' ? 'text-green-600' : kind === 'error' ? 'text-red-600' : 'text-coral';
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 px-6 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-xl">
        <Icon className={`mx-auto mb-6 h-16 w-16 ${color} ${kind === 'loading' ? 'animate-spin' : ''}`} />
        <h1 className="mb-3 text-3xl font-bold text-gray-900">{title}</h1>
        <p className="mb-8 leading-7 text-gray-600">{body}</p>
        <Link href={`/${locale}/dashboard`} className="inline-flex rounded-xl bg-coral px-6 py-3 font-semibold text-white transition hover:brightness-105">
          Open dashboard
        </Link>
      </div>
    </main>
  );
}
