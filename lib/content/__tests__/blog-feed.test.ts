import assert from 'node:assert/strict';
import test from 'node:test';

import type { BlogArticle } from '@/lib/wordpress/types';
import { findHubArticleBySlug, listHubArticles } from '../blog-feed';

function createArticle(overrides: Partial<BlogArticle> = {}): BlogArticle {
  const slug = overrides.slug ?? 'sample-article';
  const categorySlug = overrides.category?.slug ?? 'gift-guide';

  return {
    id: overrides.id ?? 1,
    slug,
    title: overrides.title ?? slug,
    excerpt: overrides.excerpt ?? 'excerpt',
    content: overrides.content ?? '<p>content</p>',
    coverImage: overrides.coverImage ?? null,
    category: overrides.category ?? {
      id: 100,
      name: 'Gift Guide',
      slug: categorySlug,
    },
    author: overrides.author ?? {
      name: 'PixPaw Team',
      avatar: '',
    },
    publishedAt: overrides.publishedAt ?? '2026-03-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-03-01T00:00:00.000Z',
    readingTime: overrides.readingTime ?? 5,
    isFeatured: overrides.isFeatured ?? false,
    seoKeywords: overrides.seoKeywords ?? [],
    metaTitle: overrides.metaTitle ?? 'Meta Title',
    metaDescription: overrides.metaDescription ?? 'Meta Description',
  };
}

test('listHubArticles serves published local articles when WordPress has none', async () => {
  const localArticle = createArticle({
    id: 2,
    slug: 'how-much-does-an-ai-pet-portrait-cost',
    title: 'How Much Does an AI Pet Portrait Cost in 2026?',
    publishedAt: '2026-08-31T00:00:00.000Z',
    category: {
      id: 200,
      name: 'Guides',
      slug: 'guides',
    },
  });

  const articles = await listHubArticles(
    { hub: 'blog', perPage: 12 },
    {
      loadWordPressArticles: async () => [],
      loadLocalArticles: async () => [localArticle],
    }
  );

  assert.equal(articles.length, 1);
  assert.equal(articles[0].slug, 'how-much-does-an-ai-pet-portrait-cost');
});

test('listHubArticles keeps WordPress on slug collision and appends extra local articles', async () => {
  const sharedSlug = 'pet-loss-gift-ideas';
  const wordPressArticle = createArticle({
    id: 10,
    slug: sharedSlug,
    title: 'WordPress Version',
    publishedAt: '2026-03-05T00:00:00.000Z',
  });
  const localDuplicate = createArticle({
    id: 11,
    slug: sharedSlug,
    title: 'Local Version',
    publishedAt: '2026-03-04T00:00:00.000Z',
  });
  const localNewest = createArticle({
    id: 12,
    slug: 'how-much-does-an-ai-pet-portrait-cost',
    title: 'How Much Does an AI Pet Portrait Cost in 2026?',
    publishedAt: '2026-08-31T00:00:00.000Z',
  });

  const articles = await listHubArticles(
    { hub: 'blog', perPage: 12 },
    {
      loadWordPressArticles: async () => [wordPressArticle],
      loadLocalArticles: async () => [localDuplicate, localNewest],
    }
  );

  assert.deepEqual(
    articles.map((article) => article.title),
    [
      'How Much Does an AI Pet Portrait Cost in 2026?',
      'WordPress Version',
    ]
  );
});

test('findHubArticleBySlug returns null when WordPress lookup throws instead of using local markdown', async () => {
  const localArticle = createArticle({
    id: 20,
    slug: 'styled-pet-portraits',
    title: 'Styled Pet Portraits',
    category: {
      id: 300,
      name: 'Style Guide',
      slug: 'style-guide',
    },
  });

  const article = await findHubArticleBySlug(
    'styled-pet-portraits',
    'blog',
    {
      loadWordPressArticleBySlug: async () => {
        throw new Error('WordPress unavailable');
      },
      loadLocalArticleBySlug: async () => localArticle,
    }
  );

  assert.equal(article, null);
});

test('findHubArticleBySlug uses published local when WordPress returns null', async () => {
  const localArticle = createArticle({
    id: 30,
    slug: 'how-much-does-an-ai-pet-portrait-cost',
    title: 'How Much Does an AI Pet Portrait Cost in 2026?',
  });

  const article = await findHubArticleBySlug(
    'how-much-does-an-ai-pet-portrait-cost',
    'blog',
    {
      loadWordPressArticleBySlug: async () => null,
      loadLocalArticleBySlug: async () => localArticle,
    }
  );

  assert.equal(article?.slug, 'how-much-does-an-ai-pet-portrait-cost');
  assert.equal(article?.title, 'How Much Does an AI Pet Portrait Cost in 2026?');
});
