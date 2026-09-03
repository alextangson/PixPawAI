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

const PAGE_PATH = '/alternatives/crown-and-paw/';
const TITLE = 'Crown & Paw Alternative: Instant AI Portraits (2026)';
const DESCRIPTION =
  'Looking for a Crown & Paw alternative? Compare turnaround, price and previews with PixPaw AI — portraits in seconds, free preview, no shipping deadline.';

/**
 * Competitor facts below were checked on crownandpaw.com in August 2026
 * (homepage + /pages/shipping-times) or come from the July 2026 internal
 * competitor research doc. Nothing here is estimated.
 */
const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "How it's made",
    pixpaw: 'Pet-focused image generation built from the photo you upload',
    competitor: 'Human illustrators — the site describes the work as handmade by real artists',
    artist: 'Painted or drawn by hand, one commission at a time',
  },
  {
    label: 'Time to see your portrait',
    pixpaw: 'Under a minute, in your browser',
    competitor: 'Artwork proof emailed within 1–2 days of ordering (2–3 days for clothing)',
    artist: 'Varies by artist — commonly days to weeks',
  },
  {
    label: 'Preview before you pay',
    pixpaw: 'Yes — free watermarked preview, 2 per day as a guest with no signup',
    competitor: 'No — the proof and free revisions come after you have placed the order',
    artist: 'Varies — sketch proofs usually come after you commission',
  },
  {
    label: 'Starting price',
    pixpaw: 'Free to preview; $9.99 for a watermark-free HD download',
    competitor: 'Portrait products from $19.95; canvases around $59.95 at the time of writing',
    artist: 'Varies widely',
  },
  {
    label: 'Digital option',
    pixpaw: 'Yes — HD file is the core product',
    competitor: 'No digital-only download listed in their catalogue at the time of writing',
    artist: 'Varies — some artists deliver files, many do not',
  },
  {
    label: 'Physical products',
    pixpaw: 'Optional — canvas from $49.99, pillow from $44.99, mug $19.99, phone case $34.99',
    competitor: 'Yes, and it is the whole business: canvas, framed prints, apparel, accessories',
    artist: 'Usually the original piece itself',
  },
  {
    label: 'Best for',
    pixpaw: 'Seeing the result first, gifting on a deadline, printing only if you love it',
    competitor: 'A hand-illustrated wall piece when you have production and shipping time',
    artist: 'A one-of-a-kind original, budget and timeline permitting',
  },
];

const FAQS: Faq[] = [
  {
    question: 'Is there a free Crown & Paw alternative?',
    answer:
      'Yes. PixPaw AI lets you generate a watermarked preview of your pet portrait for free — two per day as a guest, no signup and no card. You only pay if you want the watermark-free HD file ($9.99) or a physical print. Crown & Paw does not publish a free preview: their artwork proof is emailed within 1–2 days after you have already ordered.',
  },
  {
    question: 'How fast is it compared with Crown & Paw?',
    answer:
      'PixPaw AI returns a finished portrait in under a minute. Crown & Paw states that artwork previews are emailed within 1–2 days, that printing starts within 48 hours of your approval, and that shipping then takes 3–5 working days in the USA, 5–7 for Canada, Australia and the UK, 5–10 for Europe and 10–15 for the rest of the world. For a digital file there is no shipping step at all.',
  },
  {
    question: 'Can I get the portrait printed on canvas?',
    answer:
      'Yes. Physical keepsakes are optional at PixPaw AI, not the whole product. Once you like a portrait you can order it on canvas from $49.99, or on a pillow, mug or phone case, printed and shipped through our print-on-demand partner.',
  },
  {
    question: 'Will the AI portrait actually look like my dog or cat?',
    answer:
      'That is exactly what the free preview is for. Our styles are tuned to preserve breed features, coat pattern, markings and eye colour before any artistic treatment is applied — and you can regenerate and compare styles before spending anything.',
  },
  {
    question: 'Does PixPaw AI have a Christmas or holiday order deadline?',
    answer:
      "Not for digital portraits. A made-to-order painting has to be drawn, approved, printed and shipped, which is why physical pet-portrait brands publish holiday cutoffs — and why our July 2026 competitor research found repeated missed-Christmas delivery complaints in Crown & Paw's public Trustpilot reviews. A digital PixPaw portrait is finished the moment you generate it. Physical prints do still ship, so those follow normal carrier timelines.",
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
      'crown and paw alternative',
      'crown and paw alternatives',
      'crown & paw competitor',
      'sites like crown and paw',
      'instant pet portrait',
      'ai pet portrait',
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      title: 'Crown & Paw Alternatives — Instant AI Pet Portraits',
      description:
        'An honest comparison: what Crown & Paw does well, and where an instant AI portrait with a free preview fits better.',
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: 'Crown & Paw alternative — PixPaw AI pet portrait comparison',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Crown & Paw Alternatives — Instant AI Pet Portraits',
      description:
        'Compare turnaround, previews and pricing before you order a custom pet portrait.',
      images: [DEFAULT_TWITTER_IMAGE_URL],
    },
  };
}

export default async function CrownAndPawAlternativePage({
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
            { name: 'Crown & Paw', href: `/${lang}${PAGE_PATH}` },
          ]}
        />

        <h1 className="mb-5 text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
          Crown &amp; Paw Alternatives: Instant Portraits You See Before You Pay
        </h1>

        {/* Snippet / AI-overview answer block */}
        <p className="mb-8 text-lg leading-relaxed text-gray-700">
          The most common reason people look for a Crown &amp; Paw alternative is time — a
          made-to-order portrait has to be illustrated, approved, printed and shipped before it
          reaches anyone. PixPaw AI takes the other route: upload a photo, get a finished portrait in
          under a minute, see it free before you pay anything, and order a physical print only if you
          want one.
        </p>

        {/* ── Fair credit ── */}
        <section className="mb-10 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            First, what Crown &amp; Paw does well
          </h2>
          <p className="leading-relaxed text-gray-700">
            Crown &amp; Paw is one of the best-known names in custom pet portraits, and the appeal is
            real: their site describes the artwork as handmade by real artists, the regal
            renaissance-costume look is genuinely theirs, and the business is built around a
            finished physical object — canvas, framed prints, apparel — with free proofs and
            revisions before anything goes to print. If you want a human-illustrated piece and a
            polished product arriving in a box, that is a legitimate thing to pay for.
          </p>
          <p className="mt-4 leading-relaxed text-gray-700">
            The difference between them and PixPaw AI is not quality-versus-quality. It is
            structural. Their model is <strong>made-to-order</strong>: an artist works on your file,
            you approve a proof, then it is printed and shipped. According to their own shipping
            page at the time of writing, the proof arrives within 1–2 days, printing begins within
            48 hours of your approval, and delivery then takes 3–5 working days in the USA and up to
            10–15 working days for the rest of the world. Every one of those steps is time, and none
            of them happens before you have paid.
          </p>
        </section>

        {/* ── Comparison table ── */}
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">
          PixPaw AI vs Crown &amp; Paw vs a commissioned artist
        </h2>
        <ComparisonTable
          competitorName="Crown & Paw"
          caption="Cells marked “varies” are genuinely variable — we would rather leave a gap than guess."
          rows={COMPARISON_ROWS}
        />

        <SourceNote>
          Crown &amp; Paw details were checked on crownandpaw.com (homepage and shipping-times page)
          in August 2026 and may change — check their site before ordering. The missed-delivery point
          in the FAQ comes from our July 2026 competitor research, which reviewed public Trustpilot
          feedback. PixPaw AI prices are our current live prices.
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
                <strong>You see it before you pay.</strong> Free watermarked generations — two a day
                as a guest, no signup — so likeness stops being a gamble.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-coral">2.</span>
              <span>
                <strong>There is no deadline to miss.</strong> A digital portrait is done the second
                it is generated, which matters most in December and for last-minute gifts.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-coral">3.</span>
              <span>
                <strong>Trying a second style costs nothing.</strong> 15+ styles, so you can compare
                instead of committing to one look up front.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-coral">4.</span>
              <span>
                <strong>Physical is optional, not mandatory.</strong> Canvas from $49.99, pillows,
                mugs and phone cases — ordered after you already like the art.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-coral">5.</span>
              <span>
                <strong>Memorial portraits are handled gently.</strong> See our{' '}
                <Link href={`/${lang}/pet-memorial/`} className="text-coral hover:underline">
                  pet memorial portrait page
                </Link>{' '}
                if you are creating one for a pet you have lost.
              </span>
            </li>
          </ul>
        </section>

        {/* ── Honest counter-section ── */}
        <section className="mb-10 rounded-2xl border-l-4 border-coral bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Who should still choose Crown &amp; Paw
          </h2>
          <div className="space-y-4 leading-relaxed text-gray-700">
            <p>
              Plenty of people, honestly. Choose Crown &amp; Paw if{' '}
              <strong>you specifically want human-made artwork</strong> and the fact that a person
              drew it is part of the gift. AI cannot give you that, and pretending otherwise would be
              silly.
            </p>
            <p>
              Choose them too if <strong>you have the lead time and want the finished object</strong>
              {' '}— a stretched canvas or framed print that arrives ready to hang, with a proof and
              revision round before it prints. Order well ahead of any occasion and that process
              works in your favour.
            </p>
            <p>
              And if their specific renaissance-costume aesthetic is what you fell in love with, buy
              it from them. We are not trying to sell you a copy of someone else&apos;s style.
            </p>
            <p className="text-gray-600">
              What we would say: generate a free PixPaw preview first anyway. It takes under a minute
              and tells you what your pet looks like as art before you commit money or weeks to
              anything.
            </p>
          </div>
        </section>

        <FaqSection heading="Crown & Paw alternative — FAQ" faqs={FAQS} />

        <CtaBlock
          lang={lang}
          heading="See your pet's portrait in under a minute"
          body="Upload one clear photo, pick a style, and look at the result before you spend anything. Free, no signup, no shipping deadline."
          buttonLabel="Create a free portrait"
          note="Free watermarked preview · $9.99 for HD · Prints optional"
        />

        <RelatedLinks
          heading="Keep comparing"
          links={[
            {
              href: `/${lang}/alternatives/west-and-willow/`,
              label: 'West & Willow alternative',
              blurb:
                'The other big made-to-order name — and the one that states it does not offer artwork previews.',
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
              href: `/${lang}/styles/emerald-muse/`,
              label: 'Emerald Muse style',
              blurb: 'Deep-green editorial portraiture — our most-used style for wall art.',
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
