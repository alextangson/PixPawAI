'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Check, Download, Image as ImageIcon, Lock, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PaymentModal } from '@/components/payment/payment-modal';
import { AuthRequiredDialog } from '@/components/auth-required-dialog';
import { createClient } from '@/lib/supabase/client';
import { type Locale } from '@/lib/i18n-config';
import { trackPricingCTAClick, trackPricingPageView } from '@/lib/pricing-analytics';

type PaidTier = 'starter' | 'pro' | 'master';

const CREDIT_PACKS: Array<{
  tier: PaidTier;
  name: string;
  price: string;
  credits: number;
  label: string;
  description: string;
}> = [
  { tier: 'starter', name: 'Starter Pack', price: '$4.99', credits: 15, label: 'Start here', description: 'For a few finished portraits and style experiments.' },
  { tier: 'pro', name: 'Pro Pack', price: '$19.99', credits: 50, label: 'More portraits', description: 'For several pets, gifts, or seasonal versions.' },
  { tier: 'master', name: 'Creator Pack', price: '$39.99', credits: 200, label: 'Lowest unit price', description: 'For repeat creators who know they will use the volume.' },
];

const FAQS = [
  { question: 'Do I need a subscription?', answer: 'No. PixPaw uses one-time purchases. There are no monthly fees, and purchased generation credits do not expire.' },
  { question: 'How does the $9.99 HD download work?', answer: 'Create your portrait first. When you choose to download it in HD, you can unlock that portrait as a watermark-free, original-resolution PNG with a personal print license.' },
  { question: 'Why would I buy credits instead of one HD download?', answer: 'Credits are for people who want to create many versions. A paid credit pack also enables watermark-free downloads for portraits you own, while the single HD unlock is designed for someone who only wants one finished image.' },
  { question: 'What if a generation has a technical problem?', answer: 'Use “Not quite” on an eligible result to report the problem and restore that generation credit. Payment refunds for credit packs are handled separately under the refund policy.' },
  { question: 'How are physical keepsakes priced?', answer: 'Canvas prints start at $64.99. Shipping and tax are calculated from the destination before payment, so you can review the full total first.' },
];

export default function PricingPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as Locale) || 'en';
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuthRequiredDialog, setShowAuthRequiredDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<(typeof CREDIT_PACKS)[number] | null>(null);

  useEffect(() => {
    trackPricingPageView('profit_ladder_v1');
  }, []);

  const startPortrait = (intent: 'free' | 'hd_unlock') => {
    trackPricingCTAClick(intent, 'card', 'profit_ladder_v1');
    const query = intent === 'hd_unlock' ? '?intent=hd_unlock' : '';
    router.push(`/${lang}${query}#upload`);
  };

  const browseKeepsakes = () => {
    trackPricingCTAClick('keepsake', 'card', 'profit_ladder_v1');
    router.push(`/${lang}/shop`);
  };

  const buyCredits = async (pack: (typeof CREDIT_PACKS)[number]) => {
    trackPricingCTAClick(pack.tier, 'card', 'profit_ladder_v1');
    setSelectedTier(pack);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setShowAuthRequiredDialog(true);
      return;
    }
    setShowPaymentModal(true);
  };

  return (
    <main className="min-h-screen bg-cream">
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-cream to-white px-4 pb-24 pt-20">
        <div className="absolute left-10 top-16 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute bottom-0 right-16 h-80 w-80 rounded-full bg-amber-100/50 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
            <Lock className="h-4 w-4 text-green-600" /> Secure checkout · one-time purchases · no subscription
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-6xl">Start free. Pay only for what you keep.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
            Make your pet portrait first, then choose a watermark-free download, a real keepsake, or extra credits for more creations.
          </p>
        </div>
      </section>

      <section className="relative z-10 -mt-12 px-4 pb-20">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <OutcomeCard eyebrow="Try the experience" title="Free Portrait" price="$0" description="See your pet transformed before deciding whether to buy anything." icon={<Sparkles className="h-6 w-6" />} features={['1–2 free generations', 'Full-size preview', 'Free watermarked download']} button="Create a free portrait" onClick={() => startPortrait('free')} />
          <OutcomeCard featured eyebrow="Keep one favorite" title="HD Digital Portrait" price="$9.99" suffix="one portrait" description="The clean digital file when you already love the result." icon={<Download className="h-6 w-6" />} features={['Watermark-free PNG', 'Original generation resolution', 'Personal print license']} button="Create, then unlock HD" onClick={() => startPortrait('hd_unlock')} />
          <OutcomeCard eyebrow="Turn it into real art" title="Canvas Keepsake" price="from $64.99" description="A ready-to-hang physical print made from your portrait." icon={<ImageIcon className="h-6 w-6" />} features={['11×14 and 12×24 sizes', 'Optional HD digital add-on', 'Shipping quoted before payment']} button="Browse keepsakes" onClick={browseKeepsakes} />
        </div>
      </section>

      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-coral">For repeat creators</p>
            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">Need more generations?</h2>
            <p className="mt-4 text-gray-600">Credit packs remain available for people creating multiple portraits. Every pack is a one-time purchase and credits never expire.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {CREDIT_PACKS.map((pack) => <CreditPackCard key={pack.tier} pack={pack} onClick={() => buyCredits(pack)} />)}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-white to-orange-50 px-4 py-20">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          <TrustPoint icon={<Sparkles className="h-6 w-6" />} title="Create before buying" text="Your first decision is about the portrait, not a plan comparison." />
          <TrustPoint icon={<ShieldCheck className="h-6 w-6" />} title="Only available products" text="You pay for live downloads, keepsakes, or generation credits." />
          <TrustPoint icon={<Zap className="h-6 w-6" />} title="Instant digital access" text="Completed credit and HD purchases are applied immediately." />
        </div>
      </section>

      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-3xl font-black text-gray-900 sm:text-4xl">Pricing questions</h2>
          <div className="space-y-4">
            {FAQS.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-orange-100 bg-cream p-6 open:border-coral/40">
                <summary className="cursor-pointer list-none font-bold text-gray-900"><span className="flex items-center justify-between gap-4">{item.question}<span className="text-xl text-coral transition-transform group-open:rotate-45">+</span></span></summary>
                <p className="mt-4 leading-relaxed text-gray-600">{item.answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-500">See the complete <a className="font-semibold text-coral underline" href={`/${lang}/refund`}>refund policy</a> before purchasing.</p>
        </div>
      </section>

      <section className="bg-gray-900 px-4 py-16 text-center text-white">
        <h2 className="text-3xl font-black sm:text-4xl">The easiest choice is to see your portrait first.</h2>
        <p className="mx-auto mt-4 max-w-xl text-gray-300">Create free, keep the watermarked version, and upgrade only if you love it.</p>
        <Button size="lg" className="mt-8 bg-coral px-10 py-6 text-lg font-bold text-white hover:bg-orange-600" onClick={() => startPortrait('free')}>Create my free portrait</Button>
      </section>

      {selectedTier && <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} tier={selectedTier.tier} price={selectedTier.price} credits={selectedTier.credits} />}
      <AuthRequiredDialog isOpen={showAuthRequiredDialog} onClose={() => setShowAuthRequiredDialog(false)} />
    </main>
  );
}

function OutcomeCard({ eyebrow, title, price, suffix, description, icon, features, button, featured = false, onClick }: { eyebrow: string; title: string; price: string; suffix?: string; description: string; icon: ReactNode; features: string[]; button: string; featured?: boolean; onClick: () => void }) {
  return (
    <article className={`flex flex-col rounded-3xl border-2 bg-white p-7 shadow-lg ${featured ? 'border-coral md:-translate-y-3 md:shadow-2xl' : 'border-gray-100'}`}>
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${featured ? 'bg-coral text-white' : 'bg-orange-50 text-coral'}`}>{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black text-gray-900">{title}</h2>
      <div className="mt-4 flex items-baseline gap-2"><span className="text-4xl font-black text-gray-900">{price}</span>{suffix && <span className="text-sm text-gray-500">/ {suffix}</span>}</div>
      <p className="mt-4 min-h-12 text-sm leading-relaxed text-gray-600">{description}</p>
      <ul className="my-6 flex-1 space-y-3">{features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-gray-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />{feature}</li>)}</ul>
      <Button className={featured ? 'w-full bg-coral font-bold text-white hover:bg-orange-600' : 'w-full bg-gray-900 font-bold text-white hover:bg-gray-800'} onClick={onClick}>{button}</Button>
    </article>
  );
}

function CreditPackCard({ pack, onClick }: { pack: (typeof CREDIT_PACKS)[number]; onClick: () => void }) {
  const perCredit = (Number.parseFloat(pack.price.slice(1)) / pack.credits).toFixed(2);
  return (
    <article className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">{pack.label}</p><h3 className="mt-2 text-2xl font-black text-gray-900">{pack.name}</h3>
      <div className="mt-4 flex items-baseline gap-2"><span className="text-4xl font-black text-gray-900">{pack.price}</span><span className="text-sm text-gray-500">one-time</span></div>
      <p className="mt-2 text-sm font-semibold text-gray-600">{pack.credits} credits · ${perCredit} each</p><p className="my-5 flex-1 text-sm leading-relaxed text-gray-600">{pack.description}</p>
      <ul className="mb-6 space-y-2 text-sm text-gray-700"><li className="flex gap-2"><Check className="h-4 w-4 text-green-600" />Credits never expire</li><li className="flex gap-2"><Check className="h-4 w-4 text-green-600" />Watermark-free owned portraits</li><li className="flex gap-2"><Check className="h-4 w-4 text-green-600" />Current styles and aspect ratios</li></ul>
      <Button variant="outline" className="w-full border-2 font-bold" onClick={onClick}>Buy {pack.credits} credits</Button>
    </article>
  );
}

function TrustPoint({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-orange-100 bg-white p-6"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-coral">{icon}</div><h3 className="font-bold text-gray-900">{title}</h3><p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p></div>;
}
