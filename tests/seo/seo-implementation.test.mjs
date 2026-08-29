import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf-8');
}

test('sitemap includes critical public pages', async () => {
  const sitemapFile = await read('app/sitemap.ts');

  assert.match(sitemapFile, /\/en\/contact/);
  assert.match(sitemapFile, /\/en\/privacy/);
  assert.match(sitemapFile, /\/en\/terms/);
  assert.match(sitemapFile, /\/en\/refund/);
  assert.match(sitemapFile, /\/en\/faq/);
  assert.match(sitemapFile, /\/en\/about/);
  assert.match(sitemapFile, /\/en\/use-cases/);
  assert.match(sitemapFile, /\/en\/alternatives/);
  assert.match(sitemapFile, /\/en\/glossary/);
  assert.match(sitemapFile, /stylePages/);
  assert.doesNotMatch(sitemapFile, /BUILD_DATE/);
  assert.doesNotMatch(sitemapFile, /\/how-to/);
});

test('robots defines AI crawler allow/block policy', async () => {
  const robotsFile = await read('app/robots.ts');

  assert.match(robotsFile, /OAI-SearchBot/);
  assert.match(robotsFile, /PerplexityBot/);
  assert.match(robotsFile, /GPTBot/);
  assert.match(robotsFile, /Google-Extended/);
  assert.match(robotsFile, /CCBot/);
  assert.match(robotsFile, /\/auth\//);
  assert.doesNotMatch(robotsFile, /\/_next\//);
});

test('locale redirects are permanent for canonical consistency', async () => {
  const middleware = await read('middleware.ts');
  const nextConfig = await read('next.config.js');
  const rootPage = await read('app/page.tsx');

  assert.match(middleware, /status:\s*301/);
  // `/` → `/en/` is a config-level 301; app/page.tsx is only the runtime fallback.
  assert.match(nextConfig, /statusCode:\s*301/);
  assert.match(rootPage, /redirect\(`\/\$\{locale\}`\)/);
});

test('new strategic SEO pages exist', async () => {
  const pages = [
    'app/[lang]/faq/page.tsx',
    'app/[lang]/about/page.tsx',
    'app/[lang]/use-cases/page.tsx',
    'app/[lang]/alternatives/page.tsx',
    'app/[lang]/glossary/page.tsx',
    'app/[lang]/styles/[style]/page.tsx',
  ];

  for (const page of pages) {
    const content = await read(page);
    assert.ok(content.length > 0, `${page} should not be empty`);
  }
});

test('global OG image conventions exist', async () => {
  const opengraph = await read('app/opengraph-image.tsx');
  const twitterImage = await read('app/twitter-image.tsx');
  const layout = await read('app/[lang]/layout.tsx');

  assert.match(opengraph, /width:\s*1200/);
  assert.match(opengraph, /height:\s*630/);
  assert.match(twitterImage, /opengraph-image/);
  // The [lang] layout declares its own OG/Twitter image (the brand logo).
  assert.match(layout, /openGraph:/);
  assert.match(layout, /twitter:/);
  assert.match(layout, /brand\/png\/logo-orange-256\.png/);
});

test('sensitive pages stay noindex by design', async () => {
  const dashboardPage = await read('app/[lang]/dashboard/page.tsx');
  const adminLayout = await read('app/[lang]/admin/layout.tsx');
  const authErrorPage = await read('app/[lang]/auth/error/page.tsx');
  const trackOrderPage = await read('app/[lang]/track-order/page.tsx');

  assert.match(dashboardPage, /index:\s*false/);
  assert.match(adminLayout, /index:\s*false/);
  assert.match(authErrorPage, /index:\s*false/);
  assert.match(trackOrderPage, /index:\s*false/);
});

test('blog is the only article hub route', async () => {
  const blogIndexPage = await read('app/[lang]/blog/page.tsx');
  const blogArticlePage = await read('app/[lang]/blog/[slug]/page.tsx');
  const nextConfig = await read('next.config.js');

  assert.match(blogIndexPage, /pickFeaturedHubArticle\('blog'\)/);
  assert.match(blogIndexPage, /\/pet-memorial/);
  assert.match(blogArticlePage, /findHubArticleBySlug\(slug, 'blog'\)/);
  assert.match(blogArticlePage, /listHubArticleSlugs\('blog'\)/);
  assert.match(blogIndexPage, /generateMetadata/);
  assert.match(blogArticlePage, /generateMetadata/);

  // The /how-to route was removed; legacy URLs 301 to /blog.
  await assert.rejects(() => read('app/[lang]/how-to/page.tsx'));
  assert.match(nextConfig, /how-to\/:slug\*/);
});

test('homepage JSON-LD is emitted from a server component', async () => {
  const homePage = await read('app/[lang]/page.tsx');
  const homeClient = await read('app/[lang]/home-client.tsx');
  const homeSchema = await read('components/home-schema.tsx');

  assert.match(homePage, /HomeSchema/);
  assert.doesNotMatch(homePage, /'use client'/);
  assert.doesNotMatch(homeSchema, /'use client'/);
  assert.match(homeClient, /'use client'/);
  assert.doesNotMatch(homeClient, /HomeSchema/);
});

test('credit-pack schema reads from the shared pricing source of truth', async () => {
  const homeSchema = await read('components/home-schema.tsx');
  const pricingLayout = await read('app/[lang]/pricing/layout.tsx');
  const pricingSource = await read('lib/seo/pricing.ts');

  assert.match(homeSchema, /buildCreditPackAggregateOffer\(\)/);
  assert.match(pricingLayout, /buildCreditPackAggregateOffer\(\)/);
  assert.match(pricingSource, /PRICING_TIERS/);
  // No hardcoded prices left to drift apart.
  assert.doesNotMatch(homeSchema, /\d+\.99/);
  assert.doesNotMatch(pricingLayout, /\d+\.99/);
});

test('llms.txt exists and bypasses the locale redirect', async () => {
  const llms = await read('public/llms.txt');
  const middleware = await read('middleware.ts');

  assert.match(llms, /^# PixPawAI/);
  assert.match(llms, /https:\/\/pixpawai\.com\/en\//);
  assert.match(middleware, /pathname === '\/llms\.txt'/);
  // The matcher must skip .txt so public/llms.txt is never locale-redirected.
  assert.match(middleware, /json\|txt\|woff/);
});
