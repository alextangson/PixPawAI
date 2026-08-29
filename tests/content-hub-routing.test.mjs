import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf-8');
}

test('content hub rules still classify categories, and only blog is routed', async () => {
  const helper = await read('lib/content-hubs.ts');
  const blogPage = await read('app/[lang]/blog/page.tsx');
  const blogArticlePage = await read('app/[lang]/blog/[slug]/page.tsx');

  assert.match(helper, /photo-tips/);
  assert.match(helper, /style-guide/);
  assert.match(helper, /pet-care/);
  assert.match(helper, /return 'blog'/);

  assert.match(blogPage, /pickFeaturedHubArticle\('blog'\)/);
  assert.match(blogPage, /listHubArticles\(\{ perPage: 12, hub: 'blog' \}\)/);
  assert.match(blogArticlePage, /findHubArticleBySlug\(slug, 'blog'\)/);
  assert.match(blogArticlePage, /listHubArticleSlugs\('blog'\)/);

  // The how-to hub route was removed — nothing should reference it again.
  await assert.rejects(() => read('app/[lang]/how-to/page.tsx'));
  await assert.rejects(() => read('app/[lang]/how-to/[slug]/page.tsx'));
});

test('pet memorial entry exists in blog page and footer', async () => {
  const blogPage = await read('app/[lang]/blog/page.tsx');
  const footer = await read('components/footer.tsx');
  const dict = await read('lib/dictionaries/en.json');

  assert.match(blogPage, /Visit Pet Memorial/);
  assert.match(blogPage, /\/pet-memorial/);
  assert.match(footer, /pet-memorial/);
  assert.match(dict, /"petMemorial": "Pet Memorial"/);
});
