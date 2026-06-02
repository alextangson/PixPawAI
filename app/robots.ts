import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com';
const PRIVATE_PATHS = [
  '/api/',
  '/auth/',
  '/dashboard/',
  '/admin/',
  '/en/dashboard/',
  '/en/admin/',
];

const AI_DISCOVERY_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'GPTBot',
  'Google-Extended',
  'CCBot',
  'FacebookBot',
];

/**
 * Robots.txt configuration
 * - Search engines and AI discovery/citation crawlers can access public pages.
 * - Private product, auth, admin, and API paths stay blocked for every crawler.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      ...AI_DISCOVERY_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
