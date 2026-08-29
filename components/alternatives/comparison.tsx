import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { SEO_SITE_URL } from '@/lib/seo/metadata';

/* ────────────────────────────────────────────────────────────
   Shared building blocks for the /alternatives/<competitor>/
   comparison landing pages. Both pages use every export here.
   ──────────────────────────────────────────────────────────── */

export interface CrumbItem {
  /** Visible label */
  name: string;
  /** Site-relative href (trailing slash — next.config sets trailingSlash: true) */
  href: string;
}

/**
 * Visual breadcrumb + BreadcrumbList JSON-LD with absolute URLs.
 * (The shared components/seo/breadcrumb.tsx emits relative schema URLs;
 * comparison pages need absolute ones for rich-result eligibility.)
 */
export function AlternativesBreadcrumb({ items }: { items: CrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SEO_SITE_URL}${item.href}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
                {isLast ? (
                  <span className="font-medium text-gray-900">{item.name}</span>
                ) : (
                  <Link href={item.href} className="transition-colors hover:text-coral">
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

export interface ComparisonRow {
  /** Row label, e.g. "Time to see your portrait" */
  label: string;
  pixpaw: string;
  competitor: string;
  /** Traditional commissioned (human) artist — "Varies" where unverifiable */
  artist: string;
}

export function ComparisonTable({
  competitorName,
  rows,
  caption,
}: {
  competitorName: string;
  rows: ComparisonRow[];
  caption: string;
}) {
  return (
    <div className="mb-10 overflow-x-auto rounded-2xl bg-white p-6 shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="mb-4 text-left text-sm text-gray-500">{caption}</caption>
        <thead>
          <tr className="border-b border-gray-200 text-gray-900">
            <th scope="col" className="py-3 pr-4 font-semibold" />
            <th scope="col" className="py-3 pr-4 font-semibold text-coral">
              PixPaw AI
            </th>
            <th scope="col" className="py-3 pr-4 font-semibold">
              {competitorName}
            </th>
            <th scope="col" className="py-3 font-semibold">
              Commissioned artist
            </th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-gray-100 last:border-0 align-top">
              <th scope="row" className="py-3 pr-4 font-medium text-gray-900">
                {row.label}
              </th>
              <td className="py-3 pr-4">{row.pixpaw}</td>
              <td className="py-3 pr-4">{row.competitor}</td>
              <td className="py-3">{row.artist}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface Faq {
  question: string;
  answer: string;
}

export function FaqSection({ faqs, heading }: { faqs: Faq[]; heading: string }) {
  return (
    <section className="mb-10 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-5 text-2xl font-semibold text-gray-900">{heading}</h2>
      <div className="space-y-2">
        {faqs.map((faq) => (
          <details key={faq.question} className="group rounded-xl bg-cream">
            <summary className="cursor-pointer list-none px-5 py-4 font-medium text-gray-800 select-none">
              {faq.question}
            </summary>
            <div className="px-5 pb-4 leading-relaxed text-gray-600">{faq.answer}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function CtaBlock({
  lang,
  heading,
  body,
  buttonLabel,
  note,
}: {
  lang: string;
  heading: string;
  body: string;
  buttonLabel: string;
  note: string;
}) {
  return (
    <section className="mb-10 rounded-2xl bg-gray-900 p-8 text-center text-white sm:p-10">
      <h2 className="mb-3 text-2xl font-semibold sm:text-3xl">{heading}</h2>
      <p className="mx-auto mb-6 max-w-xl text-gray-300">{body}</p>
      <Link
        href={`/${lang}#upload`}
        className="inline-flex items-center gap-2 rounded-full bg-coral px-8 py-4 font-semibold text-white transition-colors hover:bg-coral/90"
      >
        {buttonLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
      <p className="mt-4 text-xs text-gray-400">{note}</p>
    </section>
  );
}

export interface RelatedLink {
  href: string;
  label: string;
  blurb: string;
}

export function RelatedLinks({ links, heading }: { links: RelatedLink[]; heading: string }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-5 text-2xl font-semibold text-gray-900">{heading}</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group block rounded-xl border border-gray-100 p-4 transition-colors hover:border-coral/40 hover:bg-cream"
            >
              <span className="block font-medium text-gray-900 group-hover:text-coral">
                {link.label}
              </span>
              <span className="mt-1 block text-sm text-gray-600">{link.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Small footnote used to timestamp competitor claims so they age honestly.
 */
export function SourceNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-10 text-xs leading-relaxed text-gray-500">
      {children}
    </p>
  );
}
