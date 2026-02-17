/**
 * Structured Data (JSON-LD) for Homepage
 * Helps search engines understand the site structure and content
 * https://developers.google.com/search/docs/appearance/structured-data
 */

interface HomeSchemaProps {
  lang: string;
}

/**
 * Organization Schema - Brand Information
 * https://schema.org/Organization
 */
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PixPaw AI',
    description: 'Transform your pet photos into stunning AI-generated art in artistic styles',
    url: 'https://pixpawai.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://pixpawai.com/brand/png/logo-orange-256.png',
      width: 256,
      height: 256,
    },
    sameAs: [
      // Social media profiles to be added when available
      // 'https://twitter.com/pixpawai',
      // 'https://facebook.com/pixpawai',
      // 'https://instagram.com/pixpawai',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@pixpawai.com',
      availableLanguage: ['English'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * WebSite Schema - Search Functionality
 * https://schema.org/WebSite
 */
export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PixPaw AI',
    url: 'https://pixpawai.com',
    description: 'Turn your pet into a stunning portrait in 30 seconds with AI-powered pet portraits',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://pixpawai.com/en/gallery?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQPage Schema - Frequently Asked Questions
 * https://schema.org/FAQPage
 */
interface FAQSchemaProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQPageSchema({ faqs }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
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

/**
 * SoftwareApplication Schema - AI Generator App
 * https://schema.org/SoftwareApplication
 */
export function SoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PixPaw AI - AI Pet Portrait Generator',
    description: 'Transform your pet photos into stunning AI-generated portraits in a variety of artistic styles. Create magical pet art in 30 seconds.',
    url: 'https://pixpawai.com',
    applicationCategory: 'AI Generator',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free to try with premium options available',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '10000',
      bestRating: '5',
      worstRating: '1',
    },
    screenshot: 'https://pixpawai.com/hero/carousel/hero-carousel-birthday.webp',
    featureList: [
      'AI-powered pet portrait generation',
      'Artistic style portraits',
      '4K high-resolution downloads',
      'Multiple art styles available',
      'Custom merchandise printing',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Product Schema - For premium features
 * https://schema.org/Product
 */
export function ProductSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'PixPaw AI',
    description: 'AI-powered pet portrait generation service with artistic rendering',
    brand: {
      '@type': 'Brand',
      name: 'PixPaw AI',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '4.99',
      highPrice: '49.99',
      offerCount: '4',
      offers: [
        {
          '@type': 'Offer',
          name: 'Starter Pack',
          price: '4.99',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          name: 'Pro Bundle',
          price: '19.99',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          name: 'Master Plan',
          price: '49.99',
          priceCurrency: 'USD',
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
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Main Home Schema Component
 * Combines all structured data for the homepage
 */
export function HomeSchema({ lang, faqs }: HomeSchemaProps & { faqs?: FAQSchemaProps['faqs'] }) {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <SoftwareApplicationSchema />
      <ProductSchema />
      {faqs && faqs.length > 0 && <FAQPageSchema faqs={faqs} />}
    </>
  );
}
