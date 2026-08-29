import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Zap, Gift, Frame, Check } from 'lucide-react';
import { FAQPageSchema } from '@/components/home-schema';
import type { Locale } from '@/lib/i18n-config';
import { SEO_SITE_URL } from '@/lib/seo/metadata';

const SITE_URL = SEO_SITE_URL;

const GIFT_FAQS = [
  {
    question: 'Will it really look like my pet?',
    answer: 'Yes. Our AI preserves breed, fur patterns, eye color, and distinctive markings before applying any style — so the portrait is unmistakably them.',
  },
  {
    question: 'How fast is it, really?',
    answer: 'Seconds to generate, under a minute start to finish. Upload a photo, pick a style, and the portrait is ready — no artist queue, no waiting days.',
  },
  {
    question: 'Can I gift it right away?',
    answer: 'Yes. The HD digital portrait is ready instantly — email it, text it, or print it at home the same day. There is no shipping to wait on.',
  },
  {
    question: 'What if I want it on their wall?',
    answer: 'Add a museum-quality canvas at checkout — the HD digital is included, so you can still gift it today while the canvas ships (3–7 days).',
  },
  {
    question: "It's a last-minute gift — will I make it in time?",
    answer: 'Almost certainly. Because the digital portrait is instant, you are never too late — even the night before.',
  },
  {
    question: 'Can I print it myself?',
    answer: 'Yes. You get a high-resolution, watermark-free HD download — suitable for home printing, framing, or a print shop.',
  },
];

const STYLE_SHOWCASE = [
  { src: '/hero/results/christmas-result.webp', alt: 'Festive Santa-hat pet portrait' },
  { src: '/hero/results/magzine-chic-results.webp', alt: 'Elegant magazine-style pet portrait' },
  { src: '/hero/results/emerald-result.webp', alt: 'Emerald fashion pet portrait' },
  { src: '/hero/results/bordeaux-result.webp', alt: 'Burgundy editorial pet portrait' },
  { src: '/hero/results/wes-anderson-pop-results.webp', alt: 'Pop-art pet portrait' },
  { src: '/hero/results/birthday-results.webp', alt: 'Birthday celebration pet portrait' },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const pageUrl = `${SITE_URL}/${lang}/gift/`;

  return {
    title: 'Instant Pet Portrait Gift — Ready in Seconds | PixPaw AI',
    description:
      'The pet gift that is ready before you close the tab. Turn one photo into a stunning portrait in seconds — gift the HD digital instantly or add a canvas. No artist queue, no shipping deadline to miss.',
    keywords: [
      'instant pet portrait',
      'pet portrait gift',
      'last minute pet gift',
      'digital pet portrait gift',
      'custom pet portrait',
      'pet lover gift',
      'personalized pet gift',
      'AI pet portrait',
      'pet canvas gift',
      'gift for dog mom',
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      title: 'Their Pet, Gift-Ready in Seconds',
      description: 'Turn one photo into a stunning portrait in seconds. Gift the digital instantly, or add a canvas — no artist queue, no shipping deadline.',
      url: pageUrl,
      type: 'website',
      images: [{
        url: `${SITE_URL}/hero/results/christmas-result.webp`,
        width: 1200,
        height: 630,
        alt: 'AI pet portrait gift, ready in seconds',
      }],
    },
  };
}

function BreadcrumbSchema({ lang }: { lang: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/${lang}` },
      { '@type': 'ListItem', position: 2, name: 'Pet Portrait Gift', item: `${SITE_URL}/${lang}/gift` },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function GiftPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const uploadHref = `/${lang}#upload`;

  return (
    <>
      <BreadcrumbSchema lang={lang} />
      <FAQPageSchema faqs={GIFT_FAQS} />

      <main className="min-h-screen bg-cream">

        {/* ── 1. HERO — the wedge, up front ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-cream to-cream">
          <div className="container mx-auto max-w-5xl px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center">
            <p className="inline-flex items-center gap-2 text-coral text-xs sm:text-sm font-semibold tracking-wide uppercase bg-coral/10 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4" />
              Ready before you close the tab
            </p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-darkgray leading-tight mb-5">
              Their pet, gift-ready<br className="hidden sm:block" /> in seconds.
            </h1>

            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
              Upload one photo and watch your pet become a stunning portrait — in <strong className="text-darkgray">seconds, not days</strong>. Gift the HD digital instantly, or add a canvas for their wall. No artist queue. No shipping deadline to miss.
            </p>

            <Link
              href={uploadHref}
              className="inline-flex items-center gap-2 bg-coral hover:bg-orange-600 text-white font-bold text-base px-8 py-4 rounded-full transition-colors shadow-lg shadow-coral/25"
            >
              Create Their Portrait
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-3 text-xs text-gray-400">
              Under a minute · Free to start · Looks unmistakably like them
            </p>
          </div>
        </section>

        {/* Snippet block for AI Overview / Featured Snippet */}
        <section className="py-10 sm:py-12 bg-white border-y border-gray-100">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-darkgray mb-3">
              What is an instant pet portrait gift?
            </h2>
            <p className="text-gray-600 leading-relaxed">
              An instant pet portrait gift turns one clear photo of a pet into a print-ready piece of art in under a minute using AI — no human artist and no waiting. With PixPaw AI you can gift the HD digital portrait right away, or add a museum-quality canvas, making it the rare pet gift that is impossible to order too late.
            </p>
          </div>
        </section>

        {/* ── 2. BEFORE / AFTER — answers "will it look like them?" ── */}
        <section className="py-16 sm:py-20 bg-cream">
          <div className="container mx-auto max-w-4xl px-4">
            <p className="text-center text-gray-400 text-sm tracking-wide uppercase mb-3">
              From your photo to their portrait
            </p>
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-darkgray mb-10 sm:mb-12">
              Yes — it actually looks like them.
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-5 max-w-2xl mx-auto">
              <div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-sm">
                  <Image
                    src="/hero/originals/christmas-original.jpg"
                    alt="Original pet photo before AI portrait"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 45vw, 320px"
                    quality={85}
                    priority
                  />
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">Your photo</p>
              </div>
              <div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-md">
                  <Image
                    src="/hero/results/christmas-result.webp"
                    alt="AI-generated pet portrait, seconds later"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 45vw, 320px"
                    quality={85}
                    priority
                  />
                </div>
                <p className="text-center text-xs text-coral font-medium mt-3">Seconds later</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. THE WEDGE — three pillars ── */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-darkgray mb-3">
                Why it beats a hand-painted portrait
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                No waiting on a human artist. No &ldquo;order by&rdquo; cutoff. No praying it arrives in time.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Zap,
                  title: 'Seconds, not days',
                  body: 'Hand-painted services take days and a real artist. Yours is ready before your coffee gets cold.',
                },
                {
                  icon: Gift,
                  title: 'Gift it the moment it’s done',
                  body: 'The HD digital is ready to send instantly — no shipping, no deadline. Perfect for last-minute.',
                },
                {
                  icon: Frame,
                  title: 'A keepsake, too',
                  body: 'Love it? Add a museum-quality canvas (HD digital included) for their wall.',
                },
              ].map((pillar) => (
                <div key={pillar.title} className="text-center bg-cream rounded-2xl p-6">
                  <div className="w-12 h-12 rounded-full bg-coral/10 text-coral flex items-center justify-center mx-auto mb-4">
                    <pillar.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-darkgray mb-2">{pillar.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{pillar.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. STYLES — variety ── */}
        <section className="py-14 sm:py-18 bg-cream">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-darkgray">
                Any style. Their personality.
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                Playful, elegant, festive — pick whatever fits them.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
              {STYLE_SHOWCASE.map((style) => (
                <Link key={style.src} href={uploadHref} className="group">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-sm group-hover:shadow-md transition-all duration-500">
                    <Image
                      src={style.src}
                      alt={style.alt}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      sizes="(max-width: 640px) 30vw, 15vw"
                      quality={75}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. GIFT / BUNDLE VALUE ── */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-darkgray mb-3">
              Give it now. Frame it forever.
            </h2>
            <p className="text-center text-gray-500 max-w-xl mx-auto mb-10 sm:mb-12">
              Send the digital today, and turn it into something they keep.
            </p>

            <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
              <div className="border-2 border-gray-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 text-coral mb-3">
                  <Gift className="w-5 h-5" />
                  <span className="font-bold">Instant HD digital</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  The clean, watermark-free portrait — ready to email, text, or print at home the same day. Never too late.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  {['Ready in seconds', 'No shipping wait', 'Print-quality resolution'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-2 border-coral rounded-2xl p-6 relative bg-coral/5">
                <span className="absolute -top-3 left-6 bg-coral text-white text-xs font-bold px-3 py-1 rounded-full">
                  Best value
                </span>
                <div className="flex items-center gap-2 text-coral mb-3">
                  <Frame className="w-5 h-5" />
                  <span className="font-bold">Canvas + HD digital</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  A museum-quality canvas for their wall — with the HD digital included, so you can still gift it today while the canvas ships.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  {['Premium framed canvas', 'HD digital included', 'Ships in 3–7 days'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center mt-10">
              <Link
                href={uploadHref}
                className="inline-flex items-center gap-2 bg-coral hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-full transition-colors shadow-lg shadow-coral/25"
              >
                Create Their Portrait
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 6. HOW IT WORKS ── */}
        <section className="py-14 sm:py-16 bg-cream">
          <div className="container mx-auto max-w-2xl px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-darkgray text-center mb-10">
              It only takes a minute
            </h2>
            <div className="flex items-start justify-between max-w-md mx-auto">
              {[
                { n: '1', label: 'Upload a photo' },
                { n: '2', label: 'Pick a style' },
                { n: '3', label: 'Gift or print' },
              ].map((step) => (
                <div key={step.n} className="flex flex-col items-center text-center flex-1">
                  <div className="w-9 h-9 rounded-full bg-coral text-white text-sm font-bold flex items-center justify-center mb-2">
                    {step.n}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-tight">{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. FAQ ── */}
        <section className="py-14 sm:py-16 bg-white">
          <div className="container mx-auto max-w-2xl px-4">
            <h2 className="text-xl font-bold text-darkgray mb-6 text-center">
              Questions
            </h2>
            <div className="space-y-2">
              {GIFT_FAQS.map((item, index) => (
                <details key={index} className="group bg-cream rounded-xl">
                  <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-darkgray select-none">
                    {item.question}
                  </summary>
                  <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. CLOSING CTA ── */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-cream to-white text-center">
          <div className="container mx-auto max-w-xl px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-darkgray mb-5">
              The perfect pet gift is one photo away.
            </h2>
            <Link
              href={uploadHref}
              className="inline-flex items-center gap-2 bg-coral hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-full transition-colors shadow-lg shadow-coral/25"
            >
              Create Their Portrait
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-3 text-xs text-gray-400">Under a minute · Free to start</p>
          </div>
        </section>
      </main>
    </>
  );
}
