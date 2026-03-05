import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FAQPageSchema } from '@/components/home-schema';
import type { Locale } from '@/lib/i18n-config';
import { SEO_SITE_URL } from '@/lib/seo/metadata';

const SITE_URL = SEO_SITE_URL;

const MEMORIAL_FAQS = [
  {
    question: 'Will it actually look like my pet?',
    answer: 'Yes. Our AI preserves breed, fur patterns, eye color, and distinctive markings before applying any style. The portrait will be unmistakably them.',
  },
  {
    question: 'What photo works best?',
    answer: 'Any clear photo where you can see their face. The one on your phone you keep going back to — that\'s usually the right one.',
  },
  {
    question: 'Can I choose any style?',
    answer: 'Yes — all 15+ styles work for memorial portraits with our highest quality settings.',
  },
  {
    question: 'Can I print it?',
    answer: 'Yes. Up to 2048×2048px — suitable for canvas, framed prints, pillows, or mugs.',
  },
  {
    question: 'How long does it take?',
    answer: 'Under a minute.',
  },
  {
    question: 'Is this a good gift for someone who lost their pet?',
    answer: 'Many people tell us it\'s one of the most meaningful gifts they\'ve received. Create one from any photo and give it when the moment feels right.',
  },
];

const STYLE_GRID = [
  { id: 'emerald-muse', name: 'Emerald Muse', image: '/styles/emerald-muse.jpg' },
  { id: 'bordeaux-muse', name: 'Bordeaux Muse', image: '/styles/bordeaux-muse.jpg' },
  { id: 'wes-anderson-pop', name: 'Wes Anderson Pop', image: '/styles/wes-anderson-pop.jpg' },
  { id: 'smart-casual', name: 'Smart Casual', image: '/styles/smart-casual.jpg' },
  { id: 'magazine-chic', name: 'Magazine Chic', image: '/styles/magazine-chic.jpg' },
  { id: 'pop-art', name: 'Pop Art', image: '/styles/Pop-Art.jpg' },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const pageUrl = `${SITE_URL}/${lang}/pet-memorial`;

  return {
    title: 'Pet Memorial Portrait — Turn a Photo Into Art | PixPaw AI',
    description:
      'Create a beautiful memorial portrait of your pet from a favorite photo. 15+ styles, under a minute, high resolution for printing.',
    keywords: [
      'pet memorial portrait',
      'pet loss gift',
      'pet remembrance art',
      'dog memorial portrait',
      'cat memorial portrait',
      'pet memorial gift ideas',
      'custom pet memorial',
      'pet loss keepsake',
      'AI pet memorial',
      'pet tribute portrait',
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      title: 'Pet Memorial Portrait — Turn a Photo Into Art',
      description: 'Create a beautiful memorial portrait from a favorite photo. Under a minute, any style, print-ready.',
      url: pageUrl,
      type: 'website',
      images: [{
        url: `${SITE_URL}/styles/emerald-muse.jpg`,
        width: 1200,
        height: 630,
        alt: 'Pet memorial portrait in elegant emerald tones',
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
      { '@type': 'ListItem', position: 2, name: 'Pet Memorial', item: `${SITE_URL}/${lang}/pet-memorial` },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function PetMemorialPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;

  return (
    <>
      <BreadcrumbSchema lang={lang} />
      <FAQPageSchema faqs={MEMORIAL_FAQS} />

      <main className="min-h-screen">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            1. HERO — 共情层
            不卖东西。让用户感到「这里懂我」。
            深色背景，大量留白，呼吸感。
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="relative bg-stone-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-stone-900/95 to-stone-800" />

          <div className="relative container mx-auto max-w-3xl px-4 py-24 sm:py-32 md:py-40 text-center">
            <p className="text-stone-400 text-sm tracking-[0.2em] uppercase mb-8 sm:mb-10">
              For the ones we carry with us
            </p>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-serif font-normal leading-snug mb-0">
              You lost someone<br className="hidden sm:block" /> who made every day better.
            </h1>

            <div className="mt-16 sm:mt-20 flex justify-center">
              <div className="w-12 h-[1px] bg-stone-600" />
            </div>

            <p className="mt-8 text-stone-400 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
              This page is a quiet place.<br />
              When you&apos;re ready, we can help you turn a favorite photo into something you keep forever.
            </p>
          </div>
        </section>

        {/* Snippet block for AI Overview / Featured Snippet */}
        <section className="py-10 sm:py-12 bg-stone-50 border-b border-stone-100">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="text-xl sm:text-2xl font-serif text-stone-800 mb-4">
              What is a pet memorial portrait?
            </h2>
            <p className="text-stone-600 leading-relaxed">
              A pet memorial portrait is custom artwork made from a favorite photo to preserve your pet&apos;s face, markings, and personality. With PixPaw AI, one clear image becomes a print-ready tribute in under a minute, then you can choose a style that matches your memory and your home.
            </p>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            2. BEFORE / AFTER — 证明层
            用户最大的焦虑：「会不会像？」
            一张对比图回答一切。
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 sm:py-20 md:py-24 bg-white">
          <div className="container mx-auto max-w-4xl px-4">
            <p className="text-center text-stone-400 text-sm tracking-wide uppercase mb-10 sm:mb-12">
              From your photo to their portrait
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-5 max-w-2xl mx-auto">
              <div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100">
                  <Image
                    src="/hero/originals/emerald-original.jpg"
                    alt="Original pet photo before AI transformation"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 45vw, 280px"
                    quality={85}
                    priority
                  />
                </div>
                <p className="text-center text-xs text-stone-400 mt-3">Your photo</p>
              </div>
              <div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100">
                  <Image
                    src="/hero/results/emerald-result.webp"
                    alt="AI-generated memorial portrait in Emerald Muse style"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 45vw, 280px"
                    quality={85}
                    priority
                  />
                </div>
                <p className="text-center text-xs text-stone-400 mt-3">Their portrait</p>
              </div>
            </div>

            <div className="text-center mt-10 sm:mt-12">
              <Link
                href={`/${lang}#upload`}
                className="inline-flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white font-semibold px-7 py-3.5 rounded-full transition-colors shadow-sm"
              >
                Create Their Portrait
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="mt-3 text-xs text-stone-400">
                Under a minute · Free to start
              </p>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            3. STYLES — 可能性层
            6 张图，传达「风格丰富，随你选」。
            图片即信息，文字最少化。
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-14 sm:py-16 md:py-20 bg-stone-50">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-800">
                Any style. Their personality.
              </h2>
              <p className="text-sm text-stone-400 mt-2">
                15+ styles — pick whatever captures who they were.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
              {STYLE_GRID.map((style) => (
                <Link key={style.id} href={`/${lang}#upload`} className="group">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 shadow-sm group-hover:shadow-md transition-all duration-500">
                    <Image
                      src={style.image}
                      alt={`${style.name} pet portrait style`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      sizes="(max-width: 640px) 30vw, 15vw"
                      quality={75}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-stone-400 text-center truncate">{style.name}</p>
                </Link>
              ))}
            </div>

            <p className="text-center mt-6">
              <Link
                href={`/${lang}/gallery`}
                className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                Browse all styles →
              </Link>
            </p>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            4. HOW IT WORKS + CTA — 行动层
            3 步，一行。然后主 CTA。
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-14 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto max-w-2xl px-4">
            <h2 className="text-lg sm:text-xl font-serif font-medium text-stone-800 text-center mb-10">
              It only takes a minute
            </h2>

            <div className="flex items-start justify-between max-w-md mx-auto">
              {[
                { n: '1', label: 'Upload photo' },
                { n: '2', label: 'Choose style' },
                { n: '3', label: 'Download & print' },
              ].map((step, i) => (
                <div key={step.n} className="flex flex-col items-center text-center flex-1">
                  <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 text-xs font-semibold flex items-center justify-center mb-2">
                    {step.n}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 font-medium leading-tight">{step.label}</p>
                  {i < 2 && (
                    <div className="hidden sm:block absolute" />
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href={`/${lang}#upload`}
                className="inline-flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white font-semibold px-7 py-3.5 rounded-full transition-colors shadow-sm"
              >
                Start Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            5. GIFT — 场景拓展
            很多用户是帮别人搜的。一句话就够。
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-10 sm:py-12 bg-stone-50 border-y border-stone-100">
          <div className="container mx-auto max-w-xl px-4 text-center">
            <p className="text-base text-stone-600">
              Searching for a friend who lost their pet?
            </p>
            <p className="text-sm text-stone-400 mt-1.5 mb-4">
              A portrait from their favorite photo — give it when the moment feels right.
            </p>
            <Link
              href={`/${lang}#upload`}
              className="text-sm font-semibold text-stone-700 hover:text-stone-900 transition-colors"
            >
              Create a gift portrait →
            </Link>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            6. FAQ — 消除疑虑
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-14 sm:py-16 bg-white">
          <div className="container mx-auto max-w-2xl px-4">
            <h2 className="text-lg font-medium text-stone-800 mb-6 text-center">
              Questions
            </h2>
            <div className="space-y-2">
              {MEMORIAL_FAQS.map((item, index) => (
                <details key={index} className="group bg-stone-50 rounded-xl">
                  <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-stone-700 select-none">
                    {item.question}
                  </summary>
                  <div className="px-5 pb-4 text-sm text-stone-500 leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            7. CLOSING — 最后一次邀请
            呼应 Hero 的情感调性，闭合叙事。
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="relative bg-stone-900 text-white py-16 sm:py-20">
          <div className="container mx-auto max-w-xl px-4 text-center">
            <p className="text-stone-400 text-base sm:text-lg font-serif mb-6">
              They were a good one.
            </p>
            <Link
              href={`/${lang}#upload`}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-stone-900 font-semibold px-8 py-4 rounded-full transition-colors"
            >
              Create Their Portrait
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="mt-4 text-xs text-stone-500">
              Whenever you&apos;re ready. No rush.
            </p>
          </div>
        </section>

        {/* ── RELATED READING ── */}
        <div className="py-5 bg-stone-50 border-t border-stone-100">
          <div className="flex justify-center gap-4 text-xs text-stone-400">
            <Link href={`/${lang}/blog/pet-loss-gift-ideas`} className="hover:text-stone-600 transition-colors">
              Pet Loss Gift Ideas
            </Link>
            <span>·</span>
            <Link href={`/${lang}/blog/pet-memorial-portrait`} className="hover:text-stone-600 transition-colors">
              Memorial Portrait Guide
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
