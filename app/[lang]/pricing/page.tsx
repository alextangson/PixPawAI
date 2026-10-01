import { FAQPageSchema } from '@/components/home-schema';
import { PRICING_FAQS } from '@/lib/seo/pricing-faq';
import PricingPageClient from './pricing-page-client';

export default function PricingPage() {
  return (
    <>
      <FAQPageSchema faqs={PRICING_FAQS} />
      <PricingPageClient />
    </>
  );
}
