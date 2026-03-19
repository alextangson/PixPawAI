import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n-config';
import { DEFAULT_OG_IMAGE_URL, DEFAULT_TWITTER_IMAGE_URL, SEO_SITE_URL } from '@/lib/seo/metadata';
import { BreadcrumbSchema, ItemListSchema } from '@/components/seo/page-schema';
import { SHOP_PRODUCTS } from '@/lib/seo/shop-products';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const pageUrl = `${SEO_SITE_URL}/${lang}/shop`;

  return {
    title: 'Custom Pet Portrait Gifts & Prints | PixPaw AI Shop',
    description:
      'Shop custom pet portrait gifts, prints, mugs, and pillows made from your AI artwork. Create, preview, and order unique pet merch.',
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: 'Custom Pet Portrait Gifts & Prints | PixPaw AI Shop',
      description:
        'Turn your AI pet portraits into physical gifts, wall art, and merch.',
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: 'PixPaw AI shop',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Custom Pet Portrait Gifts & Prints | PixPaw AI Shop',
      description:
        'Turn your AI pet portraits into physical gifts, wall art, and merch.',
      images: [DEFAULT_TWITTER_IMAGE_URL],
    },
  };
}

function ShopProductsSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'PixPaw AI Custom Pet Products',
    numberOfItems: SHOP_PRODUCTS.length,
    itemListElement: SHOP_PRODUCTS.map((product, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.image,
        offers: {
          '@type': 'Offer',
          price: product.priceValue.toString(),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const pageUrl = `${SEO_SITE_URL}/${lang}/shop`;

  return (
    <>
      <ShopProductsSchema />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: `${SEO_SITE_URL}/${lang}` },
          { name: 'Shop', url: pageUrl },
        ]}
      />
      {children}
    </>
  );
}
