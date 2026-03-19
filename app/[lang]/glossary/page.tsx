import type { Metadata } from 'next';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n-config';
import { DEFAULT_OG_IMAGE_URL, DEFAULT_TWITTER_IMAGE_URL, SEO_SITE_URL } from '@/lib/seo/metadata';
import { DefinedTermSetSchema } from '@/components/seo/page-schema';
import { Breadcrumb } from '@/components/seo/breadcrumb';

const GLOSSARY_TERMS = [
  {
    term: 'AI Pet Portrait',
    definition:
      'A stylized artwork generated from a pet photo using AI models that preserve key facial features while applying an artistic look.',
  },
  {
    term: 'Prompt',
    definition:
      'The instruction text used by AI to control style, mood, and composition in the generated portrait.',
  },
  {
    term: 'Style',
    definition:
      'A predefined visual direction such as Royal, Retro Pop Art, or Vermeer that changes how the final portrait looks.',
  },
  {
    term: 'Upscale',
    definition:
      'Increasing image resolution while retaining detail, useful for print-ready pet portraits.',
  },
  {
    term: 'Commercial Use',
    definition:
      'A license mode that allows generated pet portraits to be used for business purposes, marketing, or merchandise.',
  },
  {
    term: 'Noindex',
    definition:
      'A robots directive telling search engines not to include a page in search results.',
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const pageUrl = `${SEO_SITE_URL}/${lang}/glossary`;

  return {
    title: 'AI Pet Art Glossary | PixPaw AI',
    description:
      'Learn key AI pet portrait terms like prompt, style, upscale, and licensing in this quick glossary.',
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: 'AI Pet Art Glossary | PixPaw AI',
      description:
        'Learn key AI pet portrait terms like prompt, style, upscale, and licensing.',
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: 'PixPaw AI glossary',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AI Pet Art Glossary | PixPaw AI',
      description:
        'Learn key AI pet portrait terms like prompt, style, upscale, and licensing.',
      images: [DEFAULT_TWITTER_IMAGE_URL],
    },
  };
}

export default async function GlossaryPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;

  const pageUrl = `${SEO_SITE_URL}/${lang}/glossary`;

  return (
    <main className="min-h-screen bg-cream py-16">
      <DefinedTermSetSchema
        name="AI Pet Art Glossary"
        url={pageUrl}
        terms={GLOSSARY_TERMS}
      />
      <div className="container mx-auto max-w-4xl px-4">
        <Breadcrumb
          items={[
            { name: 'Home', url: `/${lang}` },
            { name: 'Glossary', url: `/${lang}/glossary` },
          ]}
        />
        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">AI Pet Art Glossary</h1>
        <p className="mb-8 text-lg text-gray-700">
          Quick definitions for common terms used in AI pet portrait creation.
        </p>

        <div className="space-y-4">
          {GLOSSARY_TERMS.map((item) => (
            <article key={item.term} className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-2xl font-semibold text-gray-900">{item.term}</h2>
              <p className="text-gray-700">{item.definition}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={`/${lang}/blog`}
            className="rounded-full border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:border-gray-400"
          >
            Read Tutorials
          </Link>
          <Link
            href={`/${lang}`}
            className="rounded-full bg-coral px-6 py-3 font-semibold text-white hover:bg-orange-600"
          >
            Create Portrait
          </Link>
        </div>
      </div>
    </main>
  );
}
