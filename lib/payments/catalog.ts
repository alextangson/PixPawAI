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
    amount: '39.99',
    credits: 200,
    name: 'Master Plan',
    description: '200 Professional Generations',
  },
} as const;

export const HD_UNLOCK = {
  amount: '9.99',
  name: 'HD Portrait Unlock',
  description: 'Watermark-free high-resolution portrait download + personal print license',
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;

export function isValidTier(tier: unknown): tier is PricingTier {
  return typeof tier === 'string' && Object.prototype.hasOwnProperty.call(PRICING_TIERS, tier);
}
