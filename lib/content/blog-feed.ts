import { type BlogArticle, type GetBlogArticlesOptions } from '@/lib/wordpress/types';
import {
  getAllArticleSlugs,
  getBlogArticleForHub,
  getBlogArticles,
} from '@/lib/wordpress/blog';
import {
  getLocalArticleBySlug,
  getLocalArticles,
  getLocalArticleSlugs,
} from '@/lib/content/local-articles';

type Hub = NonNullable<GetBlogArticlesOptions['hub']>;

type ListHubArticlesDeps = {
  loadWordPressArticles?: (
    options: GetBlogArticlesOptions
  ) => Promise<BlogArticle[]>;
  loadLocalArticles?: () => Promise<BlogArticle[]>;
};

type FindHubArticleBySlugDeps = {
  loadWordPressArticleBySlug?: (
    slug: string,
    hub: Hub
  ) => Promise<BlogArticle | null>;
  loadLocalArticleBySlug?: (slug: string) => Promise<BlogArticle | null>;
};

function sortArticlesByPublishedDate(articles: BlogArticle[]): BlogArticle[] {
  return [...articles].sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt)
  );
}

function dedupeBySlug(articles: BlogArticle[]): BlogArticle[] {
  const seen = new Set<string>();

  return articles.filter((article) => {
    if (seen.has(article.slug)) {
      return false;
    }

    seen.add(article.slug);
    return true;
  });
}

function matchesSearch(article: BlogArticle, search?: string): boolean {
  if (!search) {
    return true;
  }

  const query = search.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return [article.title, article.excerpt, article.content].some((field) =>
    field.toLowerCase().includes(query)
  );
}

function matchesCategory(article: BlogArticle, category?: string): boolean {
  if (!category) {
    return true;
  }

  return article.category.slug === category;
}

async function loadLocalBlogArticles(): Promise<BlogArticle[]> {
  // Markdown drafts in content/articles currently power the /blog section.
  return getLocalArticles();
}

export async function listHubArticles(
  options: GetBlogArticlesOptions,
  deps: ListHubArticlesDeps = {}
): Promise<BlogArticle[]> {
  const hub = options.hub ?? 'blog';
  const perPage = options.perPage ?? 10;
  const loadWordPressArticles = deps.loadWordPressArticles ?? getBlogArticles;
  const loadLocalArticles = deps.loadLocalArticles ?? loadLocalBlogArticles;

  const [wordPressResult, localResult] = await Promise.allSettled([
    loadWordPressArticles(options),
    hub === 'blog' ? loadLocalArticles() : Promise.resolve([]),
  ]);

  const wordPressArticles =
    wordPressResult.status === 'fulfilled' ? wordPressResult.value : [];
  const localArticles =
    localResult.status === 'fulfilled' ? localResult.value : [];

  const filteredLocalArticles = localArticles.filter(
    (article) =>
      matchesCategory(article, options.category) &&
      matchesSearch(article, options.search)
  );

  return dedupeBySlug(
    sortArticlesByPublishedDate([...wordPressArticles, ...filteredLocalArticles])
  ).slice(0, perPage);
}

export async function pickFeaturedHubArticle(hub: Hub): Promise<BlogArticle | null> {
  const articles = await listHubArticles({ hub, perPage: 100 });
  return articles.find((article) => article.isFeatured) ?? articles[0] ?? null;
}

export async function findHubArticleBySlug(
  slug: string,
  hub: Hub,
  deps: FindHubArticleBySlugDeps = {}
): Promise<BlogArticle | null> {
  const loadWordPressArticleBySlug =
    deps.loadWordPressArticleBySlug ?? getBlogArticleForHub;
  const loadLocalArticleBySlug =
    deps.loadLocalArticleBySlug ?? getLocalArticleBySlug;

  try {
    const wordPressArticle = await loadWordPressArticleBySlug(slug, hub);
    if (wordPressArticle) {
      return wordPressArticle;
    }
  } catch (error) {
    console.error(`[BlogFeed] WordPress lookup failed for "${slug}":`, error);
  }

  if (hub !== 'blog') {
    return null;
  }

  return loadLocalArticleBySlug(slug);
}

export async function listHubArticleSlugs(hub: Hub): Promise<string[]> {
  const [wordPressSlugs, localSlugs] = await Promise.allSettled([
    getAllArticleSlugs({ hub }),
    hub === 'blog' ? getLocalArticleSlugs() : Promise.resolve([]),
  ]);

  const merged = [
    ...(wordPressSlugs.status === 'fulfilled' ? wordPressSlugs.value : []),
    ...(localSlugs.status === 'fulfilled' ? localSlugs.value : []),
  ];

  return Array.from(new Set(merged));
}

export async function listRelatedHubArticles(
  currentArticle: BlogArticle,
  hub: Hub,
  limit: number
): Promise<BlogArticle[]> {
  const articles = await listHubArticles({ hub, perPage: 100 });
  const candidates = articles.filter(
    (article) =>
      article.slug !== currentArticle.slug && article.id !== currentArticle.id
  );

  const sameCategory = candidates.filter(
    (article) => article.category.slug === currentArticle.category.slug
  );
  const fill = candidates.filter(
    (article) => article.category.slug !== currentArticle.category.slug
  );

  return [...sameCategory, ...fill].slice(0, limit);
}
