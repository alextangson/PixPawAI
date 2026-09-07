import type { Metadata } from "next";
import { CREDIT_PACK_OFFERS, buildCreditPackAggregateOffer } from "@/lib/seo/pricing";
import { HD_UNLOCK } from "@/lib/payments/catalog";

interface PricingLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ lang: string }> 
}): Promise<Metadata> {
  const { lang } = await params;

  // Built from the shared pricing constant so the meta copy cannot drift from
  // what the active payment providers charge.
  const packSummary = CREDIT_PACK_OFFERS
    .map((offer) => `${offer.name} $${offer.price} (${offer.description})`)
    .join(', ');

  return {
    title: 'Pricing | PixPaw AI - AI Pet Portrait Generator',
    description: `Create a pet portrait free, unlock one watermark-free HD portrait for $${HD_UNLOCK.amount}, order canvas keepsakes from $64.99, or choose a credit pack: ${packSummary}.`,
    keywords: ['pet portrait pricing', 'AI pet art pricing', 'pet portrait generator cost', 'HD pet portrait download', 'AI pet portrait credits'],
    alternates: {
      canonical: `https://pixpawai.com/${lang}/pricing/`,
    },
    openGraph: {
      title: 'Pricing | PixPaw AI - AI Pet Portrait Generator',
      description: `Start free, then choose a $${HD_UNLOCK.amount} HD download, a canvas keepsake, or generation credits from $${CREDIT_PACK_OFFERS[0].price}.`,
      type: 'website',
      url: `https://pixpawai.com/${lang}/pricing`,
    },
  };
}

export default async function PricingLayout({ children, params }: PricingLayoutProps) {
  // Await params to satisfy Next.js 15 requirements
  await params;
  
  return (
    <>
      {/* Pricing Page Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'PixPaw AI pricing options',
            itemListElement: [
              { '@type': 'Offer', position: 1, name: 'Free Pet Portrait', price: '0', priceCurrency: 'USD' },
              { '@type': 'Offer', position: 2, name: 'HD Digital Portrait', price: HD_UNLOCK.amount, priceCurrency: 'USD' },
              { '@type': 'Offer', position: 3, name: 'Canvas Keepsake', price: '64.99', priceCurrency: 'USD' },
              ...buildCreditPackAggregateOffer().offers.map((offer, index) => ({
                ...offer,
                position: index + 4,
              })),
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
