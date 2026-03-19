import type { Metadata } from 'next';
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
  const pageUrl = `${SEO_SITE_URL}/${lang}/alternatives/`;

  return {
    title: 'PixPaw AI Alternatives: Compare Pet Portrait Options',
    description:
      'Compare PixPaw AI with manual illustration, generic filters, and other pet portrait options.',
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: 'PixPaw AI Alternatives: Compare Pet Portrait Options',
      description:
        'See how PixPaw AI compares with artists and filter apps on speed, cost, and output quality.',
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: 'PixPaw AI alternatives',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'PixPaw AI Alternatives: Compare Pet Portrait Options',
      description:
        'See how PixPaw AI compares with artists and filter apps on speed, cost, and output quality.',
      images: [DEFAULT_TWITTER_IMAGE_URL],
    },
  };
}

export default function AlternativesPage() {
  const pageUrl = `${SEO_SITE_URL}/en/alternatives/`;

  return (
    <main className="min-h-screen bg-cream py-16">
      <WebPageSchema
        name="PixPaw AI Alternatives"
        description="Compare PixPaw AI with manual illustration, generic filters, and other pet portrait options."
        url={pageUrl}
      />
      <ItemListSchema
        name="Pet Portrait Alternatives"
        description="Compare different pet portrait creation methods"
        url={pageUrl}
        items={[
          { name: 'PixPaw AI', position: 1 },
          { name: 'Commissioned artist', position: 2 },
          { name: 'Photo filter apps', position: 3 },
        ]}
      />
      <div className="container mx-auto max-w-5xl px-4">
        <Breadcrumb
          items={[
            { name: 'Home', url: '/en' },
            { name: 'Alternatives', url: '/en/alternatives' },
          ]}
        />
        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">PixPaw AI Alternatives</h1>
        <p className="mb-10 text-lg text-gray-700">
          Looking for the best way to create a pet portrait? Here is how PixPaw AI compares with
          commissioned artists, photo filter apps, and other AI generators.
        </p>

        <div className="overflow-x-auto rounded-2xl bg-white p-6 shadow-sm mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Comparison Table</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-900">
                <th className="py-3 pr-4">Option</th>
                <th className="py-3 pr-4">Speed</th>
                <th className="py-3 pr-4">Cost</th>
                <th className="py-3 pr-4">Output Quality</th>
                <th className="py-3">Best For</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-medium">PixPaw AI</td>
                <td className="py-3 pr-4">20–40 sec</td>
                <td className="py-3 pr-4">From $4.99</td>
                <td className="py-3 pr-4">High (curated styles)</td>
                <td className="py-3">Fast, multiple styles, print-ready quality</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-medium">Commissioned artist</td>
                <td className="py-3 pr-4">3–14 days</td>
                <td className="py-3 pr-4">$50–$500+</td>
                <td className="py-3 pr-4">Very high (handmade)</td>
                <td className="py-3">Premium one-of-a-kind pieces</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-medium">Photo filter apps</td>
                <td className="py-3 pr-4">Instant</td>
                <td className="py-3 pr-4">Free–$10</td>
                <td className="py-3 pr-4">Low (generic filters)</td>
                <td className="py-3">Quick social media edits</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Generic AI generators</td>
                <td className="py-3 pr-4">30–120 sec</td>
                <td className="py-3 pr-4">Varies</td>
                <td className="py-3 pr-4">Medium (not pet-optimized)</td>
                <td className="py-3">General-purpose image generation</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Why Choose PixPaw AI?</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-2"><span className="text-coral font-bold">1.</span> Styles are tuned specifically for pets — preserving breed features, coat patterns, and eye color.</li>
            <li className="flex gap-2"><span className="text-coral font-bold">2.</span> Results in under 40 seconds, not days. Try multiple styles before deciding.</li>
            <li className="flex gap-2"><span className="text-coral font-bold">3.</span> Print-ready 2048px output for wall art, gifts, and merchandise.</li>
            <li className="flex gap-2"><span className="text-coral font-bold">4.</span> First-time satisfaction guarantee — unhappy results get an instant credit refund.</li>
            <li className="flex gap-2"><span className="text-coral font-bold">5.</span> 10% of profits donated to animal shelters.</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">When to Pick a Different Option</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              <strong>Go with a commissioned artist</strong> if you want a unique hand-painted piece for a special
              occasion and budget is not a concern.
            </p>
            <p>
              <strong>Use a photo filter app</strong> if you just need a quick Instagram-style effect and don&apos;t
              need art-level quality or print resolution.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
