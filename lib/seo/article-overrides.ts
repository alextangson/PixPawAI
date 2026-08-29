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
    title: '7 Best AI Pet Portrait Generators in 2026 (Tested & Ranked)',
    description:
      'We tested 7 AI pet portrait tools. PixPawAI starts at $4.99 for 15 portraits (free watermarked try, ~20–40s). See who actually earned the click.',
    h1: '7 Best AI Pet Portrait Generators in 2026 (Tested & Ranked)',
    excerpt:
      'Most “best AI pet portrait generator” lists hide the price. We ran the same pet photo through 7 tools. PixPawAI: $4.99 for 15 portraits, PayPal, one-time credits that never expire — ranked against Pawcaso, DreamPets, and more.',
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
