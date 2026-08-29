import { PRICING_TIERS } from '@/lib/paypal/config';

/**
 * Single source of truth for credit-pack prices used in JSON-LD.
 * Derived from PRICING_TIERS (the same config PayPal charges against) so the
 * homepage Product schema and the pricing page schema can never diverge.
 */
export interface CreditPackOffer {
  name: string;
  price: string;
  description: string;
}

export const CREDIT_PACK_OFFERS: CreditPackOffer[] = Object.values(PRICING_TIERS).map(
  (tier) => ({
    name: tier.name,
    price: tier.amount,
    description: `${tier.credits} credits`,
  })
);

/**
 * schema.org AggregateOffer covering every credit pack we actually sell.
 * Kept conservative on purpose: real prices only, no aggregateRating.
 */
export function buildCreditPackAggregateOffer() {
  const prices = CREDIT_PACK_OFFERS.map((offer) => Number(offer.price));

  return {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: Math.min(...prices).toFixed(2),
    highPrice: Math.max(...prices).toFixed(2),
    offerCount: String(CREDIT_PACK_OFFERS.length),
    offers: CREDIT_PACK_OFFERS.map((offer) => ({
      '@type': 'Offer',
      name: offer.name,
      price: offer.price,
      priceCurrency: 'USD',
      description: offer.description,
    })),
  };
}
