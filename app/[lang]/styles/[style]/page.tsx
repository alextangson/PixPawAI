import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { STYLES } from '@/lib/styles';
import type { Locale } from '@/lib/i18n-config';
import { DEFAULT_OG_IMAGE_URL, DEFAULT_TWITTER_IMAGE_URL, SEO_SITE_URL } from '@/lib/seo/metadata';
import { Breadcrumb } from '@/components/seo/breadcrumb';

interface StylePageProps {
  params: Promise<{ lang: Locale; style: string }>;
}

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function fromSlug(slug: string) {
  return STYLES.find((style) => toSlug(style.id) === slug || toSlug(style.label) === slug);
}

export async function generateStaticParams() {
  return STYLES.map((style) => ({
    lang: 'en',
    style: toSlug(style.id),
  }));
}

export async function generateMetadata({ params }: StylePageProps): Promise<Metadata> {
  const { lang, style } = await params;
  const selectedStyle = fromSlug(style);

  if (!selectedStyle) {
    return {
      title: 'Style Not Found | PixPaw AI',
    };
  }

  const title = `${selectedStyle.label} AI Pet Portrait Style | PixPaw AI`;
  const description = `Explore the ${selectedStyle.label} style for AI pet portraits. See what it looks like and create your own in seconds.`;
  const pageUrl = `${SEO_SITE_URL}/${lang}/styles/${style}/`;

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
  const selectedStyle = fromSlug(style);

  if (!selectedStyle) {
    notFound();
  }

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to create a ${selectedStyle.label} pet portrait`,
    step: [
      { '@type': 'HowToStep', text: 'Upload a clear pet photo with good lighting.' },
      { '@type': 'HowToStep', text: `Select the ${selectedStyle.label} style.` },
      { '@type': 'HowToStep', text: 'Generate and download your final portrait.' },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the ${selectedStyle.label} style?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: selectedStyle.description || `${selectedStyle.label} is one of PixPaw AI's curated pet portrait styles.`,
        },
      },
      {
        '@type': 'Question',
        name: `How do I get the best ${selectedStyle.label} result?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use a well-lit photo where your pet face is clearly visible, then generate multiple options if needed.',
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-cream py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="container mx-auto max-w-4xl px-4">
        <Breadcrumb
          items={[
            { name: 'Home', url: `/${lang}` },
            { name: 'Styles', url: `/${lang}/gallery` },
            { name: selectedStyle.label, url: `/${lang}/styles/${style}` },
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
            <li>Choose a clear pet photo with the face visible.</li>
            <li>Select <strong>{selectedStyle.label}</strong> in the style picker.</li>
            <li>Generate and download your portrait in seconds.</li>
          </ol>
        </section>

        <section className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-3 text-2xl font-semibold text-gray-900">FAQ</h2>
          <h3 className="mb-1 text-xl font-semibold text-gray-900">What is this style best for?</h3>
          <p className="mb-4 text-gray-700">
            It works great for social sharing, prints, and personalized gifts.
          </p>
          <h3 className="mb-1 text-xl font-semibold text-gray-900">Can I try other styles too?</h3>
          <p className="text-gray-700">
            Yes, you can switch styles and regenerate to compare results.
          </p>
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
