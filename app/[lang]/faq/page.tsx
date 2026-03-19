import type { Metadata } from 'next';
import Link from 'next/link';
import { getDictionary } from '@/lib/dictionary';
import type { Locale } from '@/lib/i18n-config';
import { FAQPageSchema } from '@/components/home-schema';
import { DEFAULT_OG_IMAGE_URL, DEFAULT_TWITTER_IMAGE_URL, SEO_SITE_URL } from '@/lib/seo/metadata';
import { Breadcrumb } from '@/components/seo/breadcrumb';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const pageUrl = `${SEO_SITE_URL}/${lang}/faq/`;

  return {
    title: 'FAQ: AI Pet Portrait Help & Answers | PixPaw AI',
    description:
      'Read frequently asked questions about photo quality, styles, credits, downloads, and refunds for PixPaw AI.',
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: 'FAQ: AI Pet Portrait Help & Answers | PixPaw AI',
      description:
        'Get quick answers about quality, credits, styles, downloads, and refunds.',
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: 'PixPaw AI FAQ',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'FAQ: AI Pet Portrait Help & Answers | PixPaw AI',
      description:
        'Get quick answers about quality, credits, styles, downloads, and refunds.',
      images: [DEFAULT_TWITTER_IMAGE_URL],
    },
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const faqItems = dict.faq?.questions || [];

  return (
    <main className="min-h-screen bg-cream py-16">
      <FAQPageSchema
        faqs={faqItems.map((item: { question: string; answer: string }) => ({
          question: item.question,
          answer: item.answer,
        }))}
      />

      <div className="container mx-auto max-w-4xl px-4">
        <Breadcrumb
          items={[
            { name: 'Home', url: `/${lang}` },
            { name: 'FAQ', url: `/${lang}/faq` },
          ]}
        />
        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mb-10 text-lg text-gray-600">
          Everything you need to know before creating your next AI pet portrait.
        </p>

        <div className="space-y-4">
          {faqItems.map((item: { question: string; answer: string }, index: number) => (
            <section key={index} className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">{item.question}</h2>
              <p className="leading-relaxed text-gray-700">{item.answer}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-gray-900 p-6 text-white">
          <h2 className="mb-2 text-2xl font-bold">Still need help?</h2>
          <p className="mb-4 text-gray-300">Our team replies within 24 hours.</p>
          <Link
            href={`/${lang}/contact`}
            className="inline-flex rounded-full bg-coral px-6 py-3 font-semibold text-white hover:bg-orange-600"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}
