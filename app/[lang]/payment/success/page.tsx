import type { Metadata } from 'next';
import { CreemPaymentStatus } from '@/components/payment/creem-payment-status';
import { verifyCreemRedirectSignature, type CreemRedirectParams } from '@/lib/creem/config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Payment confirmation | PixPaw AI',
  robots: { index: false, follow: false, nocache: true },
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  const redirectParams: CreemRedirectParams = {
    checkout_id: first(query.checkout_id),
    customer_id: first(query.customer_id),
    order_id: first(query.order_id),
    product_id: first(query.product_id),
    request_id: first(query.request_id),
    subscription_id: first(query.subscription_id),
    signature: first(query.signature),
  };
  let signatureValid = false;
  try {
    signatureValid = verifyCreemRedirectSignature(redirectParams);
  } catch {
    // A missing production API key is a configuration failure, never a successful return.
  }

  return (
    <CreemPaymentStatus
      locale={lang}
      requestId={redirectParams.request_id ?? null}
      signatureValid={signatureValid}
    />
  );
}
