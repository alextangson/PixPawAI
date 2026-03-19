import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n-config';
import { DEFAULT_OG_IMAGE_URL, DEFAULT_TWITTER_IMAGE_URL, SEO_SITE_URL } from '@/lib/seo/metadata';
import { WebPageSchema } from '@/components/seo/page-schema';
import { OrganizationSchema } from '@/components/home-schema';
import { Breadcrumb } from '@/components/seo/breadcrumb';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const pageUrl = `${SEO_SITE_URL}/${lang}/about/`;

  return {
    title: 'About PixPaw AI: Mission, Quality, and Care',
    description:
      'Learn how PixPaw AI helps pet parents turn everyday photos into meaningful art and keepsakes.',
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: 'About PixPaw AI: Mission, Quality, and Care',
      description:
        'Learn how we build AI pet portraits that preserve what makes your pet unique.',
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: 'About PixPaw AI',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'About PixPaw AI: Mission, Quality, and Care',
      description:
        'Learn how we build AI pet portraits that preserve what makes your pet unique.',
      images: [DEFAULT_TWITTER_IMAGE_URL],
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const pageUrl = `${SEO_SITE_URL}/${lang}/about/`;

  return (
    <main className="min-h-screen bg-cream py-16">
      <OrganizationSchema />
      <WebPageSchema
        name="About PixPaw AI"
        description="Learn how PixPaw AI helps pet parents turn everyday photos into meaningful art and keepsakes."
        url={pageUrl}
      />
      <div className="container mx-auto max-w-4xl px-4">
        <Breadcrumb
          items={[
            { name: 'Home', url: `/${lang}` },
            { name: 'About', url: `/${lang}/about` },
          ]}
        />
        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">About PixPaw AI</h1>
        <p className="mb-8 text-lg text-gray-700">
          PixPaw AI is built for pet parents who want to celebrate their companions in a creative way.
          We combine fast AI generation with style curation so each portrait still feels like your pet.
        </p>
        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">
          <section>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">Our Mission</h2>
            <p className="text-gray-700">
              Make custom pet art easy, affordable, and emotionally meaningful in under a minute.
              PixPaw AI generates portraits in 20–40 seconds using curated style prompts
              tested across thousands of pet photos for consistent quality.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">What We Care About</h2>
            <p className="text-gray-700">
              Photo quality, faithful pet features, and styles that look like real art instead of generic filters.
              Every style is hand-tuned by our team to preserve breed-specific features — ear shape, coat pattern,
              and eye color — so the result still looks like your pet.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">How It Works</h2>
            <p className="text-gray-700">
              Upload a clear pet photo, choose from {'>'}10 curated art styles, and receive your portrait in seconds.
              No account required to preview. Portraits are generated using state-of-the-art image-to-image
              AI models optimized for animal subjects.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">Giving Back</h2>
            <p className="text-gray-700">
              We donate 10% of profits to animal shelters and rescue organizations.
              Every portrait you create directly supports pets waiting for their forever home.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
