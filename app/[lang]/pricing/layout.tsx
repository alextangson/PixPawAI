import type { Metadata } from "next";

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
  
  return {
    title: 'Pricing | PixPaw AI - AI Pet Portrait Generator',
    description: 'Create a pet portrait free, unlock one watermark-free HD portrait for $9.99, order canvas keepsakes from $64.99, or buy generation credit packs with no subscription.',
    keywords: ['pet portrait pricing', 'AI pet art pricing', 'pet portrait generator cost', 'HD pet portrait download', 'custom pet canvas'],
    alternates: {
      canonical: `https://pixpawai.com/${lang}/pricing/`,
    },
    openGraph: {
      title: 'Pricing | PixPaw AI - AI Pet Portrait Generator',
      description: 'Start free, then choose a $9.99 HD download, a canvas keepsake, or extra generation credits.',
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
              { '@type': 'Offer', position: 2, name: 'HD Digital Portrait', price: '9.99', priceCurrency: 'USD' },
              { '@type': 'Offer', position: 3, name: 'Canvas Keepsake', price: '64.99', priceCurrency: 'USD' },
              { '@type': 'Offer', position: 4, name: 'Starter Credit Pack', price: '4.99', priceCurrency: 'USD' },
              { '@type': 'Offer', position: 5, name: 'Pro Credit Pack', price: '19.99', priceCurrency: 'USD' },
              { '@type': 'Offer', position: 6, name: 'Creator Credit Pack', price: '39.99', priceCurrency: 'USD' },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
