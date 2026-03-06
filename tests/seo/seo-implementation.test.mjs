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
  const rootPage = await read('app/page.tsx');

  assert.match(middleware, /status:\s*301/);
  assert.match(rootPage, /permanentRedirect/);
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
  assert.match(layout, /DEFAULT_OG_IMAGE_URL/);
});

test('sensitive pages stay noindex by design', async () => {
  const dashboardPage = await read('app/[lang]/dashboard/page.tsx');
  const adminLayout = await read('app/[lang]/admin/layout.tsx');
  const authErrorPage = await read('app/[lang]/auth/error/page.tsx');

  assert.match(dashboardPage, /index:\s*false/);
  assert.match(adminLayout, /index:\s*false/);
  assert.match(authErrorPage, /index:\s*false/);
});

test('content hubs are wired to separate how-to and blog routes', async () => {
  const howToPage = await read('app/[lang]/how-to/page.tsx');
  const articlePage = await read('app/[lang]/how-to/[slug]/page.tsx');
  const blogIndexPage = await read('app/[lang]/blog/page.tsx');
  const blogArticlePage = await read('app/[lang]/blog/[slug]/page.tsx');

  assert.match(howToPage, /getFeaturedArticleByHub\('how-to'\)/);
  assert.match(howToPage, /getBlogArticles\(\{ category, perPage: 12, hub: 'how-to' \}\)/);
  assert.match(articlePage, /getBlogArticleForHub\(slug, 'how-to'\)/);
  assert.match(articlePage, /getAllArticleSlugs\(\{ hub: 'how-to' \}\)/);
  assert.match(blogIndexPage, /getFeaturedArticleByHub\('blog'\)/);
  assert.match(blogIndexPage, /\/pet-memorial/);
  assert.match(blogArticlePage, /getBlogArticleForHub\(slug, 'blog'\)/);
  assert.match(blogArticlePage, /getAllArticleSlugs\(\{ hub: 'blog' \}\)/);
  assert.match(blogIndexPage, /generateMetadata/);
  assert.match(blogArticlePage, /generateMetadata/);
});
