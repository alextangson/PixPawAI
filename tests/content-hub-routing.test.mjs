import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf-8');
}

test('content hub rules keep tutorial and blog routes separated', async () => {
  const helper = await read('lib/content-hubs.ts');
  const howToPage = await read('app/[lang]/how-to/page.tsx');
  const blogPage = await read('app/[lang]/blog/page.tsx');
  const howToArticlePage = await read('app/[lang]/how-to/[slug]/page.tsx');
  const blogArticlePage = await read('app/[lang]/blog/[slug]/page.tsx');

  assert.match(helper, /photo-tips/);
  assert.match(helper, /style-guide/);
  assert.match(helper, /pet-care/);
  assert.match(helper, /return 'blog'/);

  assert.match(howToPage, /getFeaturedArticleByHub\('how-to'\)/);
  assert.match(howToPage, /getBlogArticles\(\{ category, perPage: 12, hub: 'how-to' \}\)/);
  assert.match(blogPage, /getFeaturedArticleByHub\('blog'\)/);
  assert.match(blogPage, /getBlogArticles\(\{ perPage: 12, hub: 'blog' \}\)/);

  assert.match(howToArticlePage, /getBlogArticleForHub\(slug, 'how-to'\)/);
  assert.match(howToArticlePage, /getAllArticleSlugs\(\{ hub: 'how-to' \}\)/);
  assert.match(blogArticlePage, /getBlogArticleForHub\(slug, 'blog'\)/);
  assert.match(blogArticlePage, /getAllArticleSlugs\(\{ hub: 'blog' \}\)/);
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
