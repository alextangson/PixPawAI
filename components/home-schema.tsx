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
    description: 'Transform your pet into stunning AI-generated art in Pixar style',
    url: 'https://pixpawai.com',
    logo: 'https://pixpawai.com/brand/png/logo-orange-256.png',
    sameAs: [
      // Add social media profiles when available
      // 'https://twitter.com/pixpawai',
      // 'https://facebook.com/pixpawai',
      // 'https://instagram.com/pixpawai',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
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
    description: 'Turn your pet into a Pixar star in 30 seconds with AI-powered pet portraits',
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
 * Product Schema - For premium features
 * https://schema.org/Product
 */
export function ProductSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'PixPaw AI - Pet Portrait Generation',
    description: 'AI-powered pet portrait generation service with Pixar-style 3D rendering',
    brand: {
      '@type': 'Brand',
      name: 'PixPaw AI',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '39.99',
      offerCount: '4',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free Trial',
          price: '0',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          name: 'Starter Bundle',
          price: '9.99',
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
          name: 'Master Bundle',
          price: '39.99',
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
      <ProductSchema />
      {faqs && faqs.length > 0 && <FAQPageSchema faqs={faqs} />}
    </>
  );
}
