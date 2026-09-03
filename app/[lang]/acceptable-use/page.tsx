import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n-config'
import { DEFAULT_OG_IMAGE_URL, DEFAULT_TWITTER_IMAGE_URL, SEO_SITE_URL } from '@/lib/seo/metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const pageUrl = `${SEO_SITE_URL}/${lang}/acceptable-use/`

  return {
    title: 'Acceptable Use Policy - PixPaw AI',
    description: 'Rules that keep PixPaw AI pet portrait generation safe, lawful, and respectful.',
    alternates: { canonical: pageUrl },
    openGraph: {
      title: 'Acceptable Use Policy - PixPaw AI',
      description: 'Rules for safe and responsible use of PixPaw AI.',
      url: pageUrl,
      type: 'website',
      images: [{ url: DEFAULT_OG_IMAGE_URL, width: 1200, height: 630, alt: 'PixPaw AI Acceptable Use Policy' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Acceptable Use Policy - PixPaw AI',
      description: 'Rules for safe and responsible use of PixPaw AI.',
      images: [DEFAULT_TWITTER_IMAGE_URL],
    },
  }
}

export default async function AcceptableUsePage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  await params

  return (
    <main className="min-h-screen bg-cream py-20">
      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="mb-8 text-4xl font-bold text-gray-900 md:text-5xl">
          Acceptable Use Policy
        </h1>

        <div className="space-y-6 rounded-2xl bg-white p-8 text-gray-700 shadow-sm">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">1. Purpose and Scope</h2>
            <p className="leading-relaxed">
              This policy applies to every photo, scene description, prompt, generated portrait, and public
              gallery submission handled by PixPaw AI. Use the service only for lawful, safe pet portrait
              creation and only with content you have the right to use.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">2. Prohibited Content and Conduct</h2>
            <p className="leading-relaxed">You may not use PixPaw AI to create, upload, request, or share:</p>
            <ul className="ml-4 mt-3 list-inside list-disc space-y-2">
              <li>NSFW, pornographic, nude, explicit, sexually suggestive, or exploitative content</li>
              <li>Any sexualized content involving minors or content that endangers or exploits children</li>
              <li>Graphic violence, gore, cruelty, self-harm, threats, or instructions to harm people or animals</li>
              <li>Hateful, harassing, discriminatory, defamatory, or targeted abusive content</li>
              <li>Illegal drugs, weapons, fraud, criminal activity, or instructions that facilitate wrongdoing</li>
              <li>Face swaps, deepfakes, impersonation, deceptive identity manipulation, or non-consensual imagery</li>
              <li>Content that infringes privacy, publicity, copyright, trademark, or other intellectual-property rights</li>
              <li>Attempts to bypass safety checks, probe restricted outputs, automate abuse, or disrupt the service</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">3. Safety Controls</h2>
            <p className="leading-relaxed">
              User-supplied scene text is screened before it reaches an image-generation model. PixPaw AI uses
              layered controls, including Creem&apos;s Moderation API and our own content filters. A result of
              <strong> flag</strong> or <strong>deny</strong> is blocked. If the required moderation service is
              unavailable, generation fails closed and no generation credit is used.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">4. Enforcement</h2>
            <p className="leading-relaxed">
              We may block content, remove gallery items, limit access, or suspend accounts that violate this
              policy. Serious or repeated abuse may be reported to the appropriate service provider or authority
              when required by law. Payment disputes and refunds remain governed by our Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">5. Reporting and Appeals</h2>
            <p className="leading-relaxed">
              Report unsafe content using the report control in the public gallery or email
              {' '}<a className="font-semibold text-coral hover:underline" href="mailto:support@pixpawai.com">support@pixpawai.com</a>.
              Include the relevant public URL or generation reference, but do not email sensitive images.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">6. Policy Updates</h2>
            <p className="leading-relaxed">
              We may update this policy as our product, providers, or safety requirements change. Continued use
              after an update means you agree to the revised policy.
            </p>
          </section>

          <p className="border-t pt-6 text-sm text-gray-500">Last updated: September 3, 2026</p>
        </div>
      </div>
    </main>
  )
}
