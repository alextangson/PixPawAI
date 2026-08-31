import { type BlogArticle, type GetBlogArticlesOptions } from '@/lib/wordpress/types';
import {
  getAllArticleEntries,
  getBlogArticleForHub,
  getBlogArticles,
  getFeaturedArticleByHub,
  getRelatedArticles,
} from '@/lib/wordpress/blog';
import { getLocalArticleBySlug, getLocalArticles } from '@/lib/content/local-articles';

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

function mergeWordPressAndLocal(
  wordPressArticles: BlogArticle[],
  localArticles: BlogArticle[]
): BlogArticle[] {
  const wordPressSlugs = new Set(wordPressArticles.map((article) => article.slug));
  const extras = localArticles.filter((article) => !wordPressSlugs.has(article.slug));
  return [...wordPressArticles, ...extras].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );
}

export async function listHubArticles(
  options: GetBlogArticlesOptions,
  deps: ListHubArticlesDeps = {}
): Promise<BlogArticle[]> {
  const loadWordPressArticles = deps.loadWordPressArticles ?? getBlogArticles;
  const loadLocalArticles = deps.loadLocalArticles ?? getLocalArticles;
  const [wordPressArticles, localArticles] = await Promise.all([
    loadWordPressArticles(options),
    loadLocalArticles(),
  ]);
  const merged = mergeWordPressAndLocal(wordPressArticles, localArticles);
  if (options.perPage && options.perPage > 0) {
    return merged.slice(0, options.perPage);
  }
  return merged;
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
  const loadLocalArticleBySlug = deps.loadLocalArticleBySlug ?? getLocalArticleBySlug;

  try {
    const wordPressArticle = await loadWordPressArticleBySlug(slug, hub);
    if (wordPressArticle) {
      return wordPressArticle;
    }
  } catch (error) {
    console.error(`[BlogFeed] WordPress lookup failed for "${slug}":`, error);
    return null;
  }

  try {
    return await loadLocalArticleBySlug(slug);
  } catch (error) {
    console.error(`[BlogFeed] Local lookup failed for "${slug}":`, error);
    return null;
  }
}

export async function listHubArticleEntries(
  hub: Hub,
  deps: ListHubArticlesDeps = {}
): Promise<Array<{ slug: string; updatedAt: string }>> {
  const loadWordPressArticles = deps.loadWordPressArticles;
  const loadLocalArticles = deps.loadLocalArticles ?? getLocalArticles;

  const wordPressEntries = loadWordPressArticles
    ? (await loadWordPressArticles({ hub, perPage: 100 })).map((article) => ({
        slug: article.slug,
        updatedAt: article.updatedAt,
      }))
    : await getAllArticleEntries({ hub });
  const localArticles = await loadLocalArticles();
  const wordPressSlugs = new Set(wordPressEntries.map((entry) => entry.slug));
  const extras = localArticles
    .filter((article) => !wordPressSlugs.has(article.slug))
    .map((article) => ({ slug: article.slug, updatedAt: article.updatedAt }));
  return [...wordPressEntries, ...extras];
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
