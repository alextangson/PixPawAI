import type { Metadata } from 'next';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n-config';
import { DEFAULT_OG_IMAGE_URL, DEFAULT_TWITTER_IMAGE_URL, SEO_SITE_URL } from '@/lib/seo/metadata';
import { WebPageSchema, ItemListSchema } from '@/components/seo/page-schema';
import { Breadcrumb } from '@/components/seo/breadcrumb';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const pageUrl = `${SEO_SITE_URL}/${lang}/use-cases/`;

  return {
    title: 'PixPaw AI Use Cases: Gifts, Memorials, Social',
    description:
      'See practical ways pet parents use PixPaw AI for gifts, memorial portraits, social content, and home decor.',
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: 'PixPaw AI Use Cases: Gifts, Memorials, Social',
      description:
        'Discover practical ways to use AI pet portraits in daily life and gifting.',
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: 'PixPaw AI use cases',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'PixPaw AI Use Cases: Gifts, Memorials, Social',
      description:
        'Discover practical ways to use AI pet portraits in daily life and gifting.',
      images: [DEFAULT_TWITTER_IMAGE_URL],
    },
  };
}

const useCases = [
  {
    title: 'Memorial Portraits',
    body: 'Create respectful artwork that helps families remember pets who passed away.',
  },
  {
    title: 'Custom Gift Creation',
    body: 'Turn pet photos into birthday, holiday, and anniversary gifts in minutes.',
  },
  {
    title: 'Social Media Content',
    body: 'Generate bold, shareable portraits for Instagram, TikTok, and pet communities.',
  },
  {
    title: 'Home Decor & Prints',
    body: 'Use high-resolution downloads for wall art, posters, and framed keepsakes.',
  },
];

export default async function UseCasesPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;

  const pageUrl = `${SEO_SITE_URL}/${lang}/use-cases/`;

  return (
    <main className="min-h-screen bg-cream py-16">
      <WebPageSchema
        name="PixPaw AI Use Cases"
        description="See practical ways pet parents use PixPaw AI for gifts, memorial portraits, social content, and home decor."
        url={pageUrl}
      />
      <ItemListSchema
        name="PixPaw AI Use Cases"
        description="Practical ways to use AI pet portraits"
        url={pageUrl}
        items={useCases.map((uc) => ({ name: uc.title }))}
      />
      <div className="container mx-auto max-w-5xl px-4">
        <Breadcrumb
          items={[
            { name: 'Home', url: `/${lang}` },
            { name: 'Use Cases', url: `/${lang}/use-cases` },
          ]}
        />
        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
          PixPaw AI Use Cases
        </h1>
        <p className="mb-10 text-lg text-gray-700">
          Real reasons pet parents use PixPaw AI every day.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          {useCases.map((item) => (
            <article key={item.title} className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-2xl font-semibold text-gray-900">{item.title}</h2>
              <p className="text-gray-700">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href={`/${lang}`}
            className="inline-flex rounded-full bg-coral px-8 py-3 font-semibold text-white hover:bg-orange-600"
          >
            Create Your Pet Portrait
          </Link>
        </div>
      </div>
    </main>
  );
}
