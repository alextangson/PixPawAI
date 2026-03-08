import { type BlogArticle, type GetBlogArticlesOptions } from '@/lib/wordpress/types';
import {
  getAllArticleSlugs,
  getBlogArticleForHub,
  getBlogArticles,
  getFeaturedArticleByHub,
  getRelatedArticles,
} from '@/lib/wordpress/blog';

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

export async function listHubArticles(
  options: GetBlogArticlesOptions,
  deps: ListHubArticlesDeps = {}
): Promise<BlogArticle[]> {
  const loadWordPressArticles = deps.loadWordPressArticles ?? getBlogArticles;
  return loadWordPressArticles(options);
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

  try {
    return await loadWordPressArticleBySlug(slug, hub);
  } catch (error) {
    console.error(`[BlogFeed] WordPress lookup failed for "${slug}":`, error);
    return null;
  }
}

export async function listHubArticleSlugs(hub: Hub): Promise<string[]> {
  return getAllArticleSlugs({ hub });
}

export async function listRelatedHubArticles(
  currentArticle: BlogArticle,
  hub: Hub,
  limit: number
): Promise<BlogArticle[]> {
  return getRelatedArticles(currentArticle.category.id, currentArticle.id, limit, hub);
}
