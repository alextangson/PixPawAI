import { stripSeoMetaLeak } from '@/lib/seo/meta-leak';

export type ArticleSeoOverride = {
  title: string;
  description: string;
  h1?: string;
  excerpt?: string;
};

/**
 * Per-slug title / description / opening copy.
 * Used by the article route (meta + H1 + excerpt) and the blog listing.
 */
export const ARTICLE_SEO_OVERRIDES: Record<string, ArticleSeoOverride> = {
  'best-ai-pet-portrait-generator': {
    title: 'Best AI Pet Portrait Generator 2026 — Free Try, From $4.99 (7 Ranked)',
    description:
      'We tested 7 AI pet portrait tools. PixPawAI: free watermarked try, then Starter $4.99 / 15 credits (one-time PayPal, ~20–40s). See who earned the click.',
    h1: '7 Best AI Pet Portrait Generators in 2026 (Tested & Ranked)',
    excerpt:
      'Most “best AI pet portrait generator” lists hide the price. We ran the same pet photo through 7 tools. PixPawAI: free try, then $4.99 for 15 portraits — one-time credits that never expire — ranked against PetCanvas, Firefly, and more.',
  },
  'pet-portrait-gift-guide': {
    title: 'Best Pet Portrait Gift Ideas in 2026 — For Every Budget & Occasion',
    description:
      'Find the perfect pet portrait gift for any occasion. From AI-generated art to custom canvas prints, discover unique gifts pet lovers will treasure.',
  },
  'pet-loss-gift-ideas': {
    title: 'Dog Passed Away? 15 Pet Loss Gifts That Actually Help (2026)',
    description:
      "When a friend's dog passes away, the right gift says what words can't. What to say, what to avoid, and 15 pet loss gifts — from free to lasting keepsakes.",
  },
};

export function applyArticlePresentation<T extends { slug: string; title: string; excerpt: string }>(
  article: T
): T {
  const override = ARTICLE_SEO_OVERRIDES[article.slug];
  return {
    ...article,
    title: override?.h1 || override?.title || article.title,
    excerpt: override?.excerpt || stripSeoMetaLeak(article.excerpt),
  };
}


/**
 * Honest body rewrites for conversion-critical posts.
 * WP source may still be wrong; Next renders the corrected HTML.
 * Keep replacements narrow — only known false claims.
 */
export function rewriteArticleBodyHtml(slug: string, html: string): string {
  if (!html) return html;
  if (slug !== 'best-ai-pet-portrait-generator') return html;

  return html
    .replace(/Professional-grade 4K output/gi, 'Professional-grade 1024px output (HD unlock available)')
    .replace(/4K resolution outputs suitable for large format printing/gi, '1024px outputs suitable for sharing and small prints; unlock HD for larger formats')
    .replace(/professional-grade 4K output resolution/gi, 'professional-grade 1024px output')
    .replace(/4K resolution outputs suitable for any use case/gi, 'sharp digital outputs suitable for gifts and keepsakes')
    .replace(/The platform(?:&#8217;|&#x2019;|&rsquo;|')s 4K resolution ensures that portraits maintain their quality when printed/gi, 'Paid HD downloads keep portraits sharp enough for common print sizes')
    .replace(/platform&#8217;s 4K resolution/gi, 'platform&#8217;s paid HD downloads')
    .replace(/platform's 4K resolution/gi, "platform's paid HD downloads");
}
