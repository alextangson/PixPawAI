import { type BlogArticle, type GetBlogArticlesOptions } from '@/lib/wordpress/types';
import {
  getAllArticleEntries,
  getBlogArticleForHub,
  getBlogArticles,
  getFeaturedArticleByHub,
  getRelatedArticles,
} from '@/lib/wordpress/blog';
import {
  getLocalArticleBySlug,
  getPublishedLocalArticles,
} from '@/lib/content/local-articles';

type Hub = NonNullable<GetBlogArticlesOptions['hub']>;

type HubArticleEntry = { slug: string; updatedAt: string };

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

type ListHubArticleEntriesDeps = {
  loadWordPressEntries?: (hub: Hub) => Promise<HubArticleEntry[]>;
  loadLocalArticles?: () => Promise<BlogArticle[]>;
};

function mergeExclusiveLocal<T extends { slug: string }>(
  wordPressItems: T[],
  localItems: T[]
): T[] {
  const wordPressSlugs = new Set(wordPressItems.map((item) => item.slug));
  const extras = localItems.filter((item) => !wordPressSlugs.has(item.slug));
  return [...wordPressItems, ...extras];
}

export async function listHubArticles(
  options: GetBlogArticlesOptions,
  deps: ListHubArticlesDeps = {}
): Promise<BlogArticle[]> {
  const loadWordPressArticles = deps.loadWordPressArticles ?? getBlogArticles;
  const loadLocalArticles = deps.loadLocalArticles ?? getPublishedLocalArticles;

  const wordPressArticles = await loadWordPressArticles(options);
  const localArticles = await loadLocalArticles();

  return mergeExclusiveLocal(wordPressArticles, localArticles);
}

export async function pickFeaturedHubArticle(hub: Hub): Promise<BlogArticle | null> {
  return getFeaturedArticleByHub(hub);
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
    return null;
  }

  return loadLocalArticleBySlug(slug);
}

export async function listHubArticleEntries(
  hub: Hub,
  deps: ListHubArticleEntriesDeps = {}
): Promise<HubArticleEntry[]> {
  const loadWordPressEntries =
    deps.loadWordPressEntries ?? ((requestedHub) => getAllArticleEntries({ hub: requestedHub }));
  const loadLocalArticles = deps.loadLocalArticles ?? getPublishedLocalArticles;

  const wordPressEntries = await loadWordPressEntries(hub);
  const localEntries = (await loadLocalArticles()).map((article) => ({
    slug: article.slug,
    updatedAt: article.updatedAt,
  }));

  return mergeExclusiveLocal(wordPressEntries, localEntries);
}

export async function listHubArticleSlugs(hub: Hub): Promise<string[]> {
  const entries = await listHubArticleEntries(hub);
  return entries.map((entry) => entry.slug);
}

export async function listRelatedHubArticles(
  currentArticle: BlogArticle,
  hub: Hub,
  limit: number
): Promise<BlogArticle[]> {
  return getRelatedArticles(currentArticle.category.id, currentArticle.id, limit, hub);
}
