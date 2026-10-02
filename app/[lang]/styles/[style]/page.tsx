import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { STYLES } from '@/lib/styles';
import type { Locale } from '@/lib/i18n-config';
import { DEFAULT_OG_IMAGE_URL, DEFAULT_TWITTER_IMAGE_URL, SEO_SITE_URL } from '@/lib/seo/metadata';
import { Breadcrumb } from '@/components/seo/breadcrumb';
import { FAQPageSchema } from '@/components/home-schema';
import { findPortraitStyle, getStyleFaqs, toStyleSlug } from '@/lib/seo/styles';

interface StylePageProps {
  params: Promise<{ lang: Locale; style: string }>;
}

export async function generateStaticParams() {
  return STYLES.map((style) => ({
    lang: 'en',
    style: toStyleSlug(style.id),
  }));
}

export async function generateMetadata({ params }: StylePageProps): Promise<Metadata> {
  const { lang, style } = await params;
  const selectedStyle = findPortraitStyle(style);

  if (!selectedStyle) {
    return {
      title: 'Style Not Found | PixPaw AI',
    };
  }

  const title = `${selectedStyle.label} AI Pet Portrait Style | PixPaw AI`;
  const description = `Explore the ${selectedStyle.label} pet portrait style. Learn how to prepare your photo, review AI-generated details, and compare download options.`;
  const pageUrl = `${SEO_SITE_URL}/${lang}/styles/${toStyleSlug(selectedStyle.id)}/`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: pageUrl,
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: `${selectedStyle.label} style - PixPaw AI`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_TWITTER_IMAGE_URL],
    },
  };
}

export default async function StylePage({ params }: StylePageProps) {
  const { lang, style } = await params;
  const selectedStyle = findPortraitStyle(style);

  if (!selectedStyle) {
    notFound();
  }

  const canonicalSlug = toStyleSlug(selectedStyle.id);
  const faqs = getStyleFaqs(selectedStyle);
  const steps = [
    'Choose a clear pet photo with the face visible.',
    `Select ${selectedStyle.label} in the style picker.`,
    'Generate, review, and choose a download option.',
  ];
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to create a ${selectedStyle.label} pet portrait`,
    step: steps.map((text) => ({ '@type': 'HowToStep', text })),
  };

  return (
    <main className="min-h-screen bg-cream py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <FAQPageSchema faqs={faqs} />

      <div className="container mx-auto max-w-4xl px-4">
        <Breadcrumb
          items={[
            { name: 'Home', url: `/${lang}` },
            { name: 'Styles', url: `/${lang}/gallery` },
            { name: selectedStyle.label, url: `/${lang}/styles/${canonicalSlug}/` },
          ]}
        />
        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
          {selectedStyle.label} AI Pet Portrait Style
        </h1>
        <p className="mb-8 text-lg text-gray-700">
          {selectedStyle.description || 'A curated style that transforms your pet photo into high-quality art.'}
        </p>

        <section className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-3 text-2xl font-semibold text-gray-900">How to use this style</h2>
          <ol className="list-decimal space-y-2 pl-6 text-gray-700">
            {steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </section>

        <section className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-3 text-2xl font-semibold text-gray-900">FAQ</h2>
          {faqs.map((faq) => (
            <div key={faq.question} className="mb-4 last:mb-0">
              <h3 className="mb-1 text-xl font-semibold text-gray-900">{faq.question}</h3>
              <p className="text-gray-700">{faq.answer}</p>
            </div>
          ))}
          <Link href={`/${lang}/pricing/`} className="mt-4 inline-block font-semibold text-coral underline">
            Compare credits and download options
          </Link>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href={`/${lang}`} className="rounded-full bg-coral px-6 py-3 font-semibold text-white hover:bg-orange-600">
            Try This Style
          </Link>
          <Link href={`/${lang}/gallery`} className="rounded-full border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:border-gray-400">
            View Gallery
          </Link>
        </div>
      </div>
    </main>
  );
}
