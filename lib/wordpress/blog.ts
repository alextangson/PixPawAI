/**
 * WordPress REST API Client
 * Fetches blog articles from WordPress Headless CMS
 */

import { 
  WordPressPost, 
  WordPressCategory,
  BlogArticle, 
  GetBlogArticlesOptions 
} from './types';

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

if (!WORDPRESS_API_URL) {
  console.warn('[WordPress] API URL not configured. Set WORDPRESS_API_URL or NEXT_PUBLIC_WORDPRESS_API_URL in .env.local');
}

/**
 * Transform WordPress post to normalized BlogArticle format
 */
function transformWordPressPost(post: WordPressPost): BlogArticle {
  // Extract featured media
  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
  const coverImage = featuredMedia ? {
    url: featuredMedia.source_url,
    alt: featuredMedia.alt_text || post.title.rendered,
    width: featuredMedia.media_details?.width || 1200,
    height: featuredMedia.media_details?.height || 630,
  } : null;

  // Extract category (take first one)
  const categoryData = post._embedded?.['wp:term']?.[0]?.[0];
  const category = categoryData ? {
    id: categoryData.id,
    name: categoryData.name,
    slug: categoryData.slug,
  } : {
    id: 0,
    name: 'Uncategorized',
    slug: 'uncategorized',
  };

  // Extract author
  const authorData = post._embedded?.author?.[0];
  const author = authorData ? {
    name: authorData.name,
    avatar: authorData.avatar_urls?.['96'] || authorData.avatar_urls?.['48'] || '',
  } : {
    name: 'PixPaw Team',
    avatar: '',
  };

  // Calculate reading time if not provided
  const wordCount = post.content.rendered.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const calculatedReadingTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute

  // Parse SEO keywords
  const seoKeywords = post.acf?.seo_keywords 
    ? post.acf.seo_keywords.split(',').map(k => k.trim()).filter(Boolean)
    : [];

  // Clean excerpt (remove HTML tags)
  const cleanExcerpt = post.excerpt.rendered
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\[&hellip;\]/g, '...')
    .trim();

  return {
    id: post.id,
    slug: post.slug,
    title: post.title.rendered,
    excerpt: cleanExcerpt,
    content: post.content.rendered,
    coverImage,
    category,
    author,
    publishedAt: post.date,
    updatedAt: post.modified,
    readingTime: post.acf?.reading_time || calculatedReadingTime,
    isFeatured: post.acf?.featured || false,
    seoKeywords,
    metaTitle: post.title.rendered,
    metaDescription: cleanExcerpt.substring(0, 160),
  };
}

/**
 * Get list of blog articles from WordPress
 */
export async function getBlogArticles(
  options: GetBlogArticlesOptions = {}
): Promise<BlogArticle[]> {
  if (!WORDPRESS_API_URL) {
    console.warn('[WordPress] Returning empty array - API URL not configured');
    return [];
  }

  const {
    category,
    perPage = 10,
    page = 1,
    search,
  } = options;

  // Get all PixPaw categories to filter posts
  const allCategories = await getCategories();
  const pixpawCategoryIds = allCategories.map(cat => cat.id);

  const params = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
    _embed: 'true', // Embed featured media, categories, and author
    status: 'publish', // Only published posts
    orderby: 'date',
    order: 'desc',
  });

  // Add category filter if provided (using custom taxonomy)
  if (category) {
    const categoryData = await getCategoryBySlug(category);
    if (categoryData) {
      params.append('pixpaw_category', String(categoryData.id));
    }
  } else if (pixpawCategoryIds.length > 0) {
    // If no specific category, filter by ANY PixPaw category
    params.append('pixpaw_category', pixpawCategoryIds.join(','));
  }

  // Add search filter if provided
  if (search) {
    params.append('search', search);
  }

  try {
    const res = await fetch(
      `${WORDPRESS_API_URL}/posts?${params.toString()}`,
      {
        next: { revalidate: 3600 }, // ISR: Revalidate every 1 hour
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
    }

    const posts: WordPressPost[] = await res.json();
    return posts.map(transformWordPressPost);
  } catch (error) {
    console.error('[WordPress] Error fetching articles:', error);
    return [];
  }
}

/**
 * Get single blog article by slug
 */
export async function getBlogArticle(slug: string): Promise<BlogArticle | null> {
  if (!WORDPRESS_API_URL) {
    console.warn('[WordPress] Returning null - API URL not configured');
    return null;
  }

  try {
    const res = await fetch(
      `${WORDPRESS_API_URL}/posts?slug=${slug}&_embed=true`,
      {
        next: { revalidate: 3600 }, // ISR: Revalidate every 1 hour
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
    }

    const posts: WordPressPost[] = await res.json();
    
    if (posts.length === 0) {
      return null;
    }

    return transformWordPressPost(posts[0]);
  } catch (error) {
    console.error(`[WordPress] Error fetching article "${slug}":`, error);
    return null;
  }
}

/**
 * Get featured article (marked with ACF field)
 */
export async function getFeaturedArticle(): Promise<BlogArticle | null> {
  if (!WORDPRESS_API_URL) {
    return null;
  }

  try {
    // Get all articles and filter by featured flag
    const articles = await getBlogArticles({ perPage: 100 });
    const featured = articles.find(article => article.isFeatured);
    
    return featured || articles[0] || null;
  } catch (error) {
    console.error('[WordPress] Error fetching featured article:', error);
    return null;
  }
}

/**
 * Get related articles (same category, excluding current article)
 */
export async function getRelatedArticles(
  categoryId: number,
  excludeId: number,
  limit: number = 3
): Promise<BlogArticle[]> {
  if (!WORDPRESS_API_URL) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      pixpaw_category: String(categoryId),
      exclude: String(excludeId),
      per_page: String(limit),
      _embed: 'true',
      status: 'publish',
      orderby: 'date',
      order: 'desc',
    });

    const res = await fetch(
      `${WORDPRESS_API_URL}/posts?${params.toString()}`,
      {
        next: { revalidate: 3600 },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
    }

    const posts: WordPressPost[] = await res.json();
    return posts.map(transformWordPressPost);
  } catch (error) {
    console.error('[WordPress] Error fetching related articles:', error);
    return [];
  }
}

/**
 * Get WordPress category by slug (from pixpaw_category taxonomy)
 */
export async function getCategoryBySlug(slug: string): Promise<WordPressCategory | null> {
  if (!WORDPRESS_API_URL) {
    return null;
  }

  try {
    // Use custom taxonomy 'pixpaw_category' instead of default 'categories'
    const res = await fetch(
      `${WORDPRESS_API_URL}/pixpaw_category?slug=${slug}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours (categories don't change often)
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
    }

    const categories: WordPressCategory[] = await res.json();
    return categories[0] || null;
  } catch (error) {
    console.error(`[WordPress] Error fetching category "${slug}":`, error);
    return null;
  }
}

/**
 * Get all categories (from pixpaw_category taxonomy)
 */
export async function getCategories(): Promise<WordPressCategory[]> {
  if (!WORDPRESS_API_URL) {
    return [];
  }

  try {
    // Use custom taxonomy 'pixpaw_category' instead of default 'categories'
    const res = await fetch(
      `${WORDPRESS_API_URL}/pixpaw_category?per_page=100&orderby=name&order=asc`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('[WordPress] Error fetching categories:', error);
    return [];
  }
}

/**
 * Get all article slugs for static generation
 */
export async function getAllArticleSlugs(): Promise<string[]> {
  if (!WORDPRESS_API_URL) {
    return [];
  }

  try {
    const res = await fetch(
      `${WORDPRESS_API_URL}/posts?per_page=100&status=publish&_fields=slug`,
      {
        next: { revalidate: 3600 },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
    }

    const posts: Array<{ slug: string }> = await res.json();
    return posts.map(post => post.slug);
  } catch (error) {
    console.error('[WordPress] Error fetching article slugs:', error);
    return [];
  }
}
