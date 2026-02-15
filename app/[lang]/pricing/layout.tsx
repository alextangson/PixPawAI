import type { Metadata } from "next";
import { type Locale } from '@/lib/i18n-config';

interface PricingLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ lang: Locale }> 
}): Promise<Metadata> {
  const { lang } = await params;
  
  return {
    title: 'Pricing | PixPaw AI - AI Pet Portrait Generator',
    description: 'Choose the perfect plan for your pet portrait needs. Starter $4.99 (15 credits), Pro $19.99 (50 credits), Master $39.99 (200 credits). Transform your pet photos into stunning AI art.',
    keywords: ['pet portrait pricing', 'AI pet art pricing', 'pet portrait generator cost', 'PixPaw AI pricing', 'AI pet portrait credits'],
    alternates: {
      canonical: `https://pixpawai.com/${lang}/pricing`,
    },
    openGraph: {
      title: 'Pricing | PixPaw AI - AI Pet Portrait Generator',
      description: 'Choose the perfect plan for your pet portrait needs. Starting at $4.99.',
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
            '@type': 'Product',
            name: 'PixPaw AI - Pet Portrait Generation Credits',
            description: 'AI-powered pet portrait generation service with artistic rendering. Transform your pet photos into stunning stylized portraits.',
            brand: {
              '@type': 'Brand',
              name: 'PixPaw AI',
            },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'USD',
              lowPrice: '4.99',
              highPrice: '39.99',
              offerCount: '3',
              offers: [
                {
                  '@type': 'Offer',
                  name: 'Starter Bundle',
                  price: '4.99',
                  priceCurrency: 'USD',
                  description: '15 credits - Perfect for trying out',
                },
                {
                  '@type': 'Offer',
                  name: 'Pro Bundle',
                  price: '19.99',
                  priceCurrency: 'USD',
                  description: '50 credits - Best value for most users',
                },
                {
                  '@type': 'Offer',
                  name: 'Master Bundle',
                  price: '39.99',
                  priceCurrency: 'USD',
                  description: '200 credits - For power users',
                },
              ],
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '10000',
              bestRating: '5',
              worstRating: '1',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
