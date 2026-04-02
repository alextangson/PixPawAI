import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com';

/**
 * Robots.txt configuration
 * - Search engine crawlers: full access (except private routes)
 * - AI search/citation crawlers: allowed — drives GEO referral traffic
 * - AI training crawlers: blocked — protects original content
 *
 * ALLOWED (search/citation): ChatGPT-User, ClaudeBot, anthropic-ai, PerplexityBot, FacebookBot
 * BLOCKED (training):        GPTBot, CCBot, Google-Extended, Bytespider, Applebot-Extended,
 *                            cohere-ai, meta-externalagent
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow all except private routes
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/en/dashboard/',
          '/en/admin/',
        ],
      },
      // ── AI training crawlers (BLOCKED) ──────────────────────────────────
      { userAgent: 'GPTBot',              disallow: '/' }, // OpenAI training
      { userAgent: 'CCBot',               disallow: '/' }, // Common Crawl training
      { userAgent: 'Google-Extended',     disallow: '/' }, // Google Gemini training
      { userAgent: 'Bytespider',          disallow: '/' }, // ByteDance/TikTok training
      { userAgent: 'Applebot-Extended',   disallow: '/' }, // Apple AI training
      { userAgent: 'cohere-ai',           disallow: '/' }, // Cohere training
      { userAgent: 'meta-externalagent',  disallow: '/' }, // Meta AI training
      // ── AI search/citation crawlers (ALLOWED) ───────────────────────────
      { userAgent: 'ChatGPT-User',   allow: '/' }, // ChatGPT browsing
      { userAgent: 'ClaudeBot',      allow: '/' }, // Claude search & citation
      { userAgent: 'anthropic-ai',   allow: '/' }, // Anthropic search
      { userAgent: 'PerplexityBot',  allow: '/' }, // Perplexity search
      { userAgent: 'FacebookBot',    allow: '/' }, // Facebook link preview
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
