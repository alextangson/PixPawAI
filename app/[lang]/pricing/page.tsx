import { FAQPageSchema } from '@/components/home-schema';
import { getDictionary } from '@/lib/dictionary';
import type { Locale } from '@/lib/i18n-config';
import PricingPageClient from './pricing-page-client';

/**
 * Pricing route server wrapper.
 * FAQPage JSON-LD is emitted here (not in the client page) so crawlers that
 * skip JS still see the same Q/A pairs as the on-page accordion.
 */
export default async function PricingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary((lang as Locale) || 'en');
  const faqItems = (dict.pricing?.faq?.items || []).map(
    (item: { question: string; answer: string }) => ({
      question: item.question,
      answer: item.answer,
    })
  );

  return (
    <>
      {faqItems.length > 0 && <FAQPageSchema faqs={faqItems} />}
      <PricingPageClient />
    </>
  );
}
