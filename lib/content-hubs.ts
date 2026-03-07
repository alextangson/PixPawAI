export type ContentHub = 'how-to' | 'blog';

const HOW_TO_CATEGORY_SLUGS = new Set([
  'photo-tips',
  'style-guide',
  'printing',
  'troubleshooting',
]);

const BLOG_CATEGORY_SLUGS = new Set([
  'blog',
  'pet-care',
  'gift-guide',
  'memorial-guide',
]);

export function isHowToCategorySlug(slug: string): boolean {
  return HOW_TO_CATEGORY_SLUGS.has(slug);
}

export function isBlogCategorySlug(slug: string): boolean {
  return BLOG_CATEGORY_SLUGS.has(slug);
}

export function getContentHubForCategorySlug(slug: string): ContentHub {
  if (isHowToCategorySlug(slug)) {
    return 'how-to';
  }

  // Unknown categories default to blog to keep emotional/commercial content
  // out of the tutorial hub.
  return 'blog';
}

export function articleBelongsToHub(
  article: { category: { slug: string } },
  hub: ContentHub
): boolean {
  return getContentHubForCategorySlug(article.category.slug) === hub;
}

export function filterArticlesByHub<T extends { category: { slug: string } }>(
  articles: T[],
  hub: ContentHub
): T[] {
  return articles.filter((article) => articleBelongsToHub(article, hub));
}
