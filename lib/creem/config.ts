import { createHmac, timingSafeEqual } from 'node:crypto';
import { PRICING_TIERS, type PricingTier } from '@/lib/payments/catalog';

export const CREEM_API_BASE = process.env.CREEM_ENVIRONMENT === 'production'
  ? 'https://api.creem.io'
  : 'https://test-api.creem.io';

const PRODUCT_ENV_KEYS: Record<PricingTier, string> = {
  starter: 'CREEM_STARTER_PRODUCT_ID',
  pro: 'CREEM_PRO_PRODUCT_ID',
  master: 'CREEM_MASTER_PRODUCT_ID',
};

export function getCreemApiKey(): string {
  const value = process.env.CREEM_API_KEY;
  if (!value) throw new Error('CREEM_API_KEY is not configured');
  return value;
}

export function getCreemWebhookSecret(): string {
  const value = process.env.CREEM_WEBHOOK_SECRET;
  if (!value) throw new Error('CREEM_WEBHOOK_SECRET is not configured');
  return value;
}

export function getCreemProductId(tier: PricingTier): string {
  const value = process.env[PRODUCT_ENV_KEYS[tier]];
  if (!value || !/^prod_[A-Za-z0-9]+$/.test(value)) {
    throw new Error(`${PRODUCT_ENV_KEYS[tier]} is not configured`);
  }
  return value;
}

export function getTierForCreemProduct(productId: string): PricingTier | null {
  for (const tier of Object.keys(PRICING_TIERS) as PricingTier[]) {
    try {
      if (getCreemProductId(tier) === productId) return tier;
    } catch {
      // A different, unused tier may not be configured yet.
    }
  }
  return null;
}

function safeHexEqual(expected: string, received: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(received)) return false;
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(received, 'hex');
  return expectedBuffer.length === receivedBuffer.length
    && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyCreemWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac('sha256', getCreemWebhookSecret()).update(rawBody).digest('hex');
  return safeHexEqual(expected, signature);
}

const REDIRECT_KEYS = [
  'checkout_id',
  'customer_id',
  'order_id',
  'product_id',
  'request_id',
  'subscription_id',
] as const;

export type CreemRedirectParams = Partial<Record<(typeof REDIRECT_KEYS)[number], string>> & {
  signature?: string;
};

export function verifyCreemRedirectSignature(params: CreemRedirectParams): boolean {
  if (!params.signature) return false;
  const message = REDIRECT_KEYS
    .filter(key => typeof params[key] === 'string' && params[key] !== '')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  const expected = createHmac('sha256', getCreemApiKey()).update(message).digest('hex');
  return safeHexEqual(expected, params.signature);
}

export function getCreemSuccessUrl(locale: string): string {
  const configured = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) throw new Error('NEXT_PUBLIC_SITE_URL is not configured');
  const siteUrl = new URL(configured);
  if (process.env.NODE_ENV === 'production' && siteUrl.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS in production');
  }
  return new URL(`/${locale}/payment/success`, siteUrl).toString();
}
