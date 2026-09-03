import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQPageSchema } from '@/components/home-schema';
import {
  AlternativesBreadcrumb,
  ComparisonTable,
  CtaBlock,
  FaqSection,
  RelatedLinks,
  SourceNote,
  type ComparisonRow,
  type Faq,
} from '@/components/alternatives/comparison';
import type { Locale } from '@/lib/i18n-config';
import { DEFAULT_OG_IMAGE_URL, DEFAULT_TWITTER_IMAGE_URL, SEO_SITE_URL } from '@/lib/seo/metadata';

const PAGE_PATH = '/alternatives/west-and-willow/';
const TITLE = 'West & Willow Alternative: Preview First (2026)';
const DESCRIPTION =
  'Looking for a West & Willow alternative? Compare previews, delivery time and price with PixPaw AI — see your pet portrait free, in seconds, before you pay.';

/**
 * Competitor facts below were checked on westandwillow.com in August 2026
 * (homepage + /pages/faq) or come from the July 2026 internal competitor
 * research doc. Nothing here is estimated.
 */
const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "How it's made",
    pixpaw: 'Pet-focused image generation built from the photo you upload',
    competitor: 'Human artists digitally illustrating your portrait after you order',
    artist: 'Painted or drawn by hand, one commission at a time',
  },
  {
    label: 'Time to see your portrait',
    pixpaw: 'Under a minute, in your browser',
    competitor:
      'When it arrives — US orders estimated at 1–2 weeks, up to 3 in peak season; international 2 weeks, up to 4',
    artist: 'Varies by artist — commonly days to weeks',
  },
  {
    label: 'Preview before you pay',
    pixpaw: 'Yes — free watermarked preview, 2 per day as a guest with no signup',
    competitor:
      'No. Their FAQ states plainly that they do not offer artwork previews or proofs',
    artist: 'Varies — sketch proofs usually come after you commission',
  },
  {
    label: 'Starting price',
    pixpaw: 'Free to preview; $9.99 for a watermark-free HD download',
    competitor: 'One-pet custom portrait from about $77 at the time of writing',
    artist: 'Varies widely',
  },
  {
    label: 'Digital option',
    pixpaw: 'Yes — HD file is the core product',
    competitor: 'A digital file is offered only as an add-on to a physical product',
    artist: 'Varies — some artists deliver files, many do not',
  },
  {
    label: 'Physical products',
    pixpaw: 'Optional — canvas from $49.99, pillow from $44.99, mug $19.99, phone case $34.99',
    competitor: 'Yes, and it is the whole business: framed prints, mugs, apparel and more',
    artist: 'Usually the original piece itself',
  },
  {
    label: 'Best for',
    pixpaw: 'Seeing the result first, gifting on a deadline, printing only if you love it',
    competitor: 'A clean, modern illustrated print when you have two or three weeks to spare',
    artist: 'A one-of-a-kind original, budget and timeline permitting',
  },
];

const FAQS: Faq[] = [
  {
    question: 'Is there a West & Willow alternative that shows a preview before you pay?',
    answer:
      'Yes — that is the main reason people look for one. West & Willow states in their FAQ that they do not offer artwork previews or proofs, so you see the illustration only when the order arrives. PixPaw AI works the opposite way: generate a free watermarked portrait first (two a day as a guest, no signup, no card), and pay only once you can see that you like it.',
  },
  {
    question: 'How fast is it compared with West & Willow?',
    answer:
      'PixPaw AI returns a finished portrait in under a minute. West & Willow estimate that US orders arrive within 1–2 weeks of purchase, and up to 3 weeks in peak holiday season; international orders are estimated at around 2 weeks and up to 4 in peak season. A digital portrait has no production or shipping step at all.',
  },
  {
    question: 'Can I get it printed on canvas?',
    answer:
      'Yes. Prints are optional at PixPaw AI rather than the whole product. Once you have a portrait you like, you can order it on canvas from $49.99, or as a pillow, mug or phone case, printed and shipped by our print-on-demand partner.',
  },
  {
    question: 'What if the portrait does not look like my pet?',
    answer:
      'You regenerate it, free, and it costs you nothing but a minute. That is the practical difference between previewing before payment and previewing after delivery — our styles are tuned to hold breed features, coat pattern, markings and eye colour, and you can compare several styles before spending anything.',
  },
  {
    question: 'Is there a holiday order deadline?',
    answer:
      'Not for a digital portrait — it is finished the moment you generate it, in December as much as in June. Made-to-order brands have to publish cutoffs because there is production and shipping between your order and the gift; our July 2026 competitor research recorded a hard US Christmas ship-by date on West & Willow’s own holiday gift guide. PixPaw physical prints do ship, so those follow normal carrier timelines.',
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const pageUrl = `${SEO_SITE_URL}/${lang}${PAGE_PATH}`;

  return {
    title: TITLE,
    description: DESCRIPTION,
    keywords: [
      'west and willow alternative',
      'west and willow alternatives',
      'west & willow competitor',
      'sites like west and willow',
      'pet portrait preview before buying',
      'ai pet portrait',
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      title: 'West & Willow Alternatives — See It Before You Pay',
      description:
        'An honest comparison: what West & Willow does well, and why a free instant preview changes the decision.',
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: 'West & Willow alternative — PixPaw AI pet portrait comparison',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'West & Willow Alternatives — See It Before You Pay',
      description:
        'Compare previews, delivery time and pricing before you order a custom pet portrait.',
      images: [DEFAULT_TWITTER_IMAGE_URL],
    },
  };
}

export default async function WestAndWillowAlternativePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;

  return (
    <main className="min-h-screen bg-cream py-12 sm:py-16">
      <FAQPageSchema faqs={FAQS} />

      <div className="container mx-auto max-w-4xl px-4">
        <AlternativesBreadcrumb
          items={[
            { name: 'Home', href: `/${lang}/` },
            { name: 'Alternatives', href: `/${lang}/alternatives/` },
            { name: 'West & Willow', href: `/${lang}${PAGE_PATH}` },
          ]}
        />

        <h1 className="mb-5 text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
          West &amp; Willow Alternatives: See Your Pet&apos;s Portrait Before You Pay
        </h1>

        {/* Snippet / AI-overview answer block */}
        <p className="mb-8 text-lg leading-relaxed text-gray-700">
          Most people searching for a West &amp; Willow alternative are stuck on one of two things:
          the wait, or the fact that you do not get to look at the artwork first. Their FAQ says so
          directly — they do not offer artwork previews or proofs. PixPaw AI inverts that order:
          upload a photo, get a finished portrait in under a minute, look at it for free, and pay
          only if it is right.
        </p>

        {/* ── Fair credit ── */}
        <section className="mb-10 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            First, what West &amp; Willow does well
          </h2>
          <p className="leading-relaxed text-gray-700">
            West &amp; Willow built the cleanest brand in the category. Their minimal, modern
            illustration style is instantly recognisable, the artwork is made by human artists
            digitally illustrating your photo, and they have thought harder about gifting than most —
            occasion collections, gift guides, price-tiered gift pages. The physical products are the
            point, and they are made properly.
          </p>
          <p className="mt-4 leading-relaxed text-gray-700">
            The difference between them and PixPaw AI is structural, not a quality argument. Their
            model is <strong>made-to-order</strong>: you pay, an artist illustrates, it prints, it
            ships. Their own FAQ at the time of writing estimates US arrival within 1–2 weeks of
            purchase (up to 3 in peak holiday season) and international at around 2 weeks (up to 4),
            offers a digital file only as an add-on to a physical product, and asks for any order
            changes within 12 hours. Crucially, the artwork itself is not shown to you before it is
            made — that policy is stated on their site, and it is the single thing an instant preview
            fixes.
          </p>
        </section>

        {/* ── Comparison table ── */}
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">
          PixPaw AI vs West &amp; Willow vs a commissioned artist
        </h2>
        <ComparisonTable
          competitorName="West & Willow"
          caption="Cells marked “varies” are genuinely variable — we would rather leave a gap than guess."
          rows={COMPARISON_ROWS}
        />

        <SourceNote>
          West &amp; Willow details were checked on westandwillow.com (homepage and FAQ page) in
          August 2026 and may change — check their site before ordering. The holiday cutoff point in
          the FAQ comes from our July 2026 competitor research. PixPaw AI prices are our current live
          prices.
        </SourceNote>

        {/* ── Why the instant route ── */}
        <section className="mb-10 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Where PixPaw AI is the better fit
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="font-bold text-coral">1.</span>
              <span>
                <strong>You see the artwork before any money moves.</strong> Free watermarked
                generations — two a day as a guest, no signup — so likeness is never a surprise that
                arrives in a box.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-coral">2.</span>
              <span>
                <strong>A bad result costs a minute, not a return.</strong> Do not like it?
                Regenerate. No support form, no replacement request.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-coral">3.</span>
              <span>
                <strong>No shipping window to plan around.</strong> The digital portrait is finished
                the moment it is generated — useful when the occasion is on Saturday.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-coral">4.</span>
              <span>
                <strong>The digital file is the product, not an add-on.</strong> $9.99 for a
                watermark-free HD download; physical prints are yours to add if you want them.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-coral">5.</span>
              <span>
                <strong>15+ styles to compare for free</strong> — including quieter ones suited to a{' '}
                <Link href={`/${lang}/pet-memorial/`} className="text-coral hover:underline">
                  memorial portrait
                </Link>
                .
              </span>
            </li>
          </ul>
        </section>

        {/* ── Honest counter-section ── */}
        <section className="mb-10 rounded-2xl border-l-4 border-coral bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Who should still choose West &amp; Willow
          </h2>
          <div className="space-y-4 leading-relaxed text-gray-700">
            <p>
              If <strong>a human illustrator drawing your pet is the point</strong>, buy from them.
              That is a real thing to value and AI does not replace it — the fact that a person made
              it is part of what you are giving.
            </p>
            <p>
              If <strong>you want their specific look</strong> — that pared-back, modern, muted
              palette on a framed print — go to the source. It is their aesthetic and they execute
              it well.
            </p>
            <p>
              And if <strong>you have the lead time</strong> and want a finished, framed object
              delivered rather than a file you have to do something with, the made-to-order model is
              built for exactly that. Order a few weeks ahead and the wait stops being a problem.
            </p>
            <p className="text-gray-600">
              Our honest suggestion either way: run a free PixPaw preview before you order anywhere.
              It takes under a minute, costs nothing, and you will at least know what your pet looks
              like as art before you commit.
            </p>
          </div>
        </section>

        <FaqSection heading="West & Willow alternative — FAQ" faqs={FAQS} />

        <CtaBlock
          lang={lang}
          heading="Look at it first. Then decide."
          body="Upload one clear photo, pick a style, and see the finished portrait before you spend anything. Free, no signup, no waiting."
          buttonLabel="Create a free portrait"
          note="Free watermarked preview · $9.99 for HD · Prints optional"
        />

        <RelatedLinks
          heading="Keep comparing"
          links={[
            {
              href: `/${lang}/alternatives/crown-and-paw/`,
              label: 'Crown & Paw alternative',
              blurb:
                'The other made-to-order heavyweight — proofs come 1–2 days after you have ordered.',
            },
            {
              href: `/${lang}/alternatives/`,
              label: 'All pet portrait alternatives',
              blurb: 'AI, commissioned artists and filter apps compared on speed, cost and quality.',
            },
            {
              href: `/${lang}/pet-memorial/`,
              label: 'Pet memorial portraits',
              blurb: 'A quieter page for portraits of a pet you have lost.',
            },
            {
              href: `/${lang}/shop/`,
              label: 'Canvas, pillows and mugs',
              blurb: 'Turn a portrait you already love into something physical. Canvas from $49.99.',
            },
            {
              href: `/${lang}/styles/magazine-chic/`,
              label: 'Magazine Chic style',
              blurb: 'Clean, modern editorial portraiture if that is the look you were after.',
            },
            {
              href: `/${lang}/gallery/`,
              label: 'Browse every style',
              blurb: 'See all 15+ styles on real pets before you upload anything.',
            },
          ]}
        />
      </div>
    </main>
  );
}
