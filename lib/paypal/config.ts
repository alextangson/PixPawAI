/**
 * PayPal Configuration
 * 
 * Environment setup for PayPal REST API
 * Supports both Sandbox (testing) and Production
 */

// PayPal API Base URLs
export const PAYPAL_API_BASE = 
  process.env.PAYPAL_ENVIRONMENT === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

// PayPal Credentials (Server-side only)
export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
export const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
export const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID!;

// Pricing Configuration (matches your dictionaries)
export const PRICING_TIERS = {
  starter: {
    amount: '4.99',
    credits: 15,
    name: 'Starter Pack',
    description: '15 High-Resolution Generations',
  },
  pro: {
    amount: '19.99',
    credits: 50,
    name: 'Pro Bundle',
    description: '50 Generation Credits with Premium Features',
  },
  master: {
    amount: '39.99', // Sale price (was $49.99)
    credits: 200, // 200 Ultra-HD Generations
    name: 'Master Plan',
    description: '200 Professional Generations',
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;

// Validate tier
export function isValidTier(tier: string): tier is PricingTier {
  return tier in PRICING_TIERS;
}

// Get PayPal Access Token
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    console.log('✅ [PayPal] Using cached access token');
    return cachedAccessToken.token;
  }

  console.log('🔑 [PayPal] Fetching new access token...');
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[PayPal] Failed to get access token:', error);
    throw new Error('Failed to authenticate with PayPal');
  }

  const data = await response.json();
  
  // Cache token (expires in 9 hours, we cache for 8.5 hours)
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 1800) * 1000,
  };

  console.log('✅ [PayPal] New access token cached');
  return data.access_token;
}

// Warmup function - call this to pre-fetch token
export async function warmupPayPalToken() {
  try {
    await getPayPalAccessToken();
    console.log('🔥 [PayPal] Token warmed up successfully');
  } catch (error) {
    console.error('⚠️ [PayPal] Token warmup failed:', error);
  }
}

// Verify PayPal webhook signature
export async function verifyPayPalWebhookSignature(
  webhookEvent: any,
  headers: {
    transmissionId: string;
    transmissionTime: string;
    transmissionSig: string;
    certUrl: string;
    authAlgo: string;
  }
): Promise<boolean> {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          transmission_id: headers.transmissionId,
          transmission_time: headers.transmissionTime,
          cert_url: headers.certUrl,
          auth_algo: headers.authAlgo,
          transmission_sig: headers.transmissionSig,
          webhook_id: PAYPAL_WEBHOOK_ID,
          webhook_event: webhookEvent,
        }),
      }
    );

    const result = await response.json();
    return result.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('[PayPal] Webhook signature verification failed:', error);
    return false;
  }
}
