import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import type { WordPressCategory, WordPressPost } from '../types';

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_WORDPRESS_API_URL = process.env.WORDPRESS_API_URL;
const MODULE_PATH = pathToFileURL(
  path.join(process.cwd(), 'lib/wordpress/blog.ts')
).href;

function createCategory(overrides: Partial<WordPressCategory> = {}): WordPressCategory {
  return {
    id: overrides.id ?? 101,
    count: overrides.count ?? 1,
    description: overrides.description ?? '',
    link: overrides.link ?? 'https://cms.example.com/category/gift-guide',
    name: overrides.name ?? 'Gift Guide',
    slug: overrides.slug ?? 'gift-guide',
    taxonomy: overrides.taxonomy ?? 'pixpaw_category',
    parent: overrides.parent ?? 0,
    meta: overrides.meta ?? [],
  };
}

function createPost(overrides: Partial<WordPressPost> = {}): WordPressPost {
  return {
    id: overrides.id ?? 501,
    date: overrides.date ?? '2026-03-01T00:00:00',
    date_gmt: overrides.date_gmt ?? '2026-03-01T00:00:00',
    guid: overrides.guid ?? { rendered: 'https://cms.example.com/post/pet-loss-gift-ideas' },
    modified: overrides.modified ?? '2026-03-01T00:00:00',
    modified_gmt: overrides.modified_gmt ?? '2026-03-01T00:00:00',
    slug: overrides.slug ?? 'pet-loss-gift-ideas',
    status: overrides.status ?? 'publish',
    type: overrides.type ?? 'post',
    link: overrides.link ?? 'https://cms.example.com/pet-loss-gift-ideas',
    title: overrides.title ?? { rendered: '15 Meaningful Pet Loss Gift Ideas' },
    content:
      overrides.content ?? {
        rendered: '<h1>15 Meaningful Pet Loss Gift Ideas</h1><p>Helpful content.</p>',
        protected: false,
      },
    excerpt:
      overrides.excerpt ?? {
        rendered: '<p>Helpful content.</p>',
        protected: false,
      },
    author: overrides.author ?? 1,
    featured_media: overrides.featured_media ?? 0,
    comment_status: overrides.comment_status ?? 'closed',
    ping_status: overrides.ping_status ?? 'closed',
    sticky: overrides.sticky ?? false,
    template: overrides.template ?? '',
    format: overrides.format ?? 'standard',
    meta: overrides.meta ?? [],
    categories: overrides.categories ?? [],
    tags: overrides.tags ?? [],
    acf: overrides.acf ?? {
      featured: false,
      reading_time: 10,
      seo_keywords: 'pet loss gift ideas, pet memorial gifts',
    },
    _embedded:
      overrides._embedded ?? {
        author: [
          {
            id: 1,
            name: 'PixPaw Team',
            url: '',
            description: '',
            link: '',
            slug: 'pixpaw-team',
            avatar_urls: {},
          },
        ],
        'wp:term': [
          [
            {
              id: 101,
              link: 'https://cms.example.com/pixpaw_category/gift-guide',
              name: 'Gift Guide',
              slug: 'gift-guide',
              taxonomy: 'pixpaw_category',
            },
          ],
        ],
      },
  };
}

async function importFreshBlogModule() {
  return import(`${MODULE_PATH}?test=${Date.now()}-${Math.random()}`);
}

test.after(() => {
  globalThis.fetch = ORIGINAL_FETCH;

  if (ORIGINAL_WORDPRESS_API_URL) {
    process.env.WORDPRESS_API_URL = ORIGINAL_WORDPRESS_API_URL;
  } else {
    delete process.env.WORDPRESS_API_URL;
  }
});

test('getCategories fetches pixpaw_category taxonomy', async () => {
  process.env.WORDPRESS_API_URL = 'https://cms.example.com/wp-json/wp/v2';
  const requestedUrls: string[] = [];

  globalThis.fetch = async (input) => {
    const url = String(input);
    requestedUrls.push(url);

    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const blogModule = await importFreshBlogModule();
  await blogModule.getCategories();

  assert.ok(
    requestedUrls.some((url) => url.includes('/pixpaw_category?')),
    `Expected pixpaw_category endpoint, got: ${requestedUrls.join(', ')}`
  );
});

test('getBlogArticles returns posts from pixpaw_category taxonomy for blog hub', async () => {
  process.env.WORDPRESS_API_URL = 'https://cms.example.com/wp-json/wp/v2';
  const category = createCategory();
  const post = createPost();

  globalThis.fetch = async (input) => {
    const url = String(input);

    if (url.includes('/pixpaw_category?')) {
      return new Response(JSON.stringify([category]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.includes('/posts?')) {
      return new Response(JSON.stringify([post]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unexpected fetch url: ${url}`);
  };

  const blogModule = await importFreshBlogModule();
  const articles = await blogModule.getBlogArticles({ hub: 'blog', perPage: 12 });

  assert.equal(articles.length, 1);
  assert.equal(articles[0]?.slug, 'pet-loss-gift-ideas');
  assert.equal(articles[0]?.category.slug, 'gift-guide');
});

test('getBlogArticleForHub resolves a single post from pixpaw_category taxonomy', async () => {
  process.env.WORDPRESS_API_URL = 'https://cms.example.com/wp-json/wp/v2';
  const category = createCategory({
    id: 202,
    slug: 'pet-care',
    name: 'Pet Care',
  });
  const post = createPost({
    slug: 'pet-memorial-portrait',
    title: { rendered: 'How to Create a Beautiful Pet Memorial Portrait' },
    _embedded: {
      author: [
        {
          id: 1,
          name: 'PixPaw Team',
          url: '',
          description: '',
          link: '',
          slug: 'pixpaw-team',
          avatar_urls: {},
        },
      ],
      'wp:term': [
        [
          {
            id: 202,
            link: 'https://cms.example.com/pixpaw_category/pet-care',
            name: 'Pet Care',
            slug: 'pet-care',
            taxonomy: 'pixpaw_category',
          },
        ],
      ],
    },
  });

  globalThis.fetch = async (input) => {
    const url = String(input);

    if (url.includes('/pixpaw_category?')) {
      return new Response(JSON.stringify([category]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.includes('/posts?slug=pet-memorial-portrait')) {
      return new Response(JSON.stringify([post]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unexpected fetch url: ${url}`);
  };

  const blogModule = await importFreshBlogModule();
  const article = await blogModule.getBlogArticleForHub('pet-memorial-portrait', 'blog');

  assert.equal(article?.slug, 'pet-memorial-portrait');
  assert.equal(article?.category.slug, 'pet-care');
});
