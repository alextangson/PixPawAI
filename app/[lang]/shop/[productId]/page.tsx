import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SEO_SITE_URL } from '@/lib/seo/metadata';
import { PRINTFUL_PRODUCTS } from '@/lib/printful/config';
import { BreadcrumbSchema } from '@/components/seo/page-schema';
import { ProductDetailClient } from '@/components/shop/product-detail-client';

interface PageProps {
  params: Promise<{ lang: string; productId: string }>;
  searchParams: Promise<{ generationId?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, productId } = await params;
  const product = PRINTFUL_PRODUCTS[productId];
  if (!product) return {};

  const minPrice = Math.round(Math.min(...product.variants.map((v) => v.price)) / 100);
  const pageUrl = `${SEO_SITE_URL}/${lang}/shop/${productId}/`;

  return {
    title: `${product.name} — Custom Pet Portrait | PixPaw AI`,
    description: `${product.description}. Starting from $${minPrice}. Print your AI pet portrait on a ${product.name.toLowerCase()}.`,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${product.name} — Custom Pet Portrait`,
      description: product.description,
      url: pageUrl,
      images: [{ url: `${SEO_SITE_URL}${product.imageUrl}`, width: 600, height: 600, alt: product.name }],
    },
  };
}

export function generateStaticParams() {
  return Object.keys(PRINTFUL_PRODUCTS).map((productId) => ({ productId }));
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { lang, productId } = await params;
  const { generationId } = await searchParams;

  const product = PRINTFUL_PRODUCTS[productId];
  if (!product) notFound();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: `${SEO_SITE_URL}/${lang}` },
          { name: 'Shop', url: `${SEO_SITE_URL}/${lang}/shop` },
          { name: product.name, url: `${SEO_SITE_URL}/${lang}/shop/${productId}` },
        ]}
      />
      <ProductDetailClient
        product={product}
        lang={lang}
        initialGenerationId={generationId}
      />
    </>
  );
}
