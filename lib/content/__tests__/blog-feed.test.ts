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

test('listHubArticles does not fall back to local markdown when WordPress has no blog articles', async () => {
  const localArticle = createArticle({
    id: 2,
    slug: 'pet-memorial-portrait',
    title: 'Pet Memorial Portrait',
    category: {
      id: 200,
      name: 'Memorial Guide',
      slug: 'memorial-guide',
    },
  });

  const articles = await listHubArticles(
    { hub: 'blog', perPage: 12 },
    {
      loadWordPressArticles: async () => [],
      loadLocalArticles: async () => [localArticle],
    }
  );

  assert.equal(articles.length, 0);
});

test('listHubArticles ignores local markdown duplicates and extras when WordPress articles exist', async () => {
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
    slug: 'new-local-article',
    title: 'Newest Local Article',
    publishedAt: '2026-03-06T00:00:00.000Z',
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
    ['WordPress Version']
  );
});

test('findHubArticleBySlug returns null when WordPress lookup fails instead of using local markdown', async () => {
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
