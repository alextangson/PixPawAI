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
 * Decode HTML entities in text
 */
function decodeHtmlEntities(text: string): string {
  // Create a temporary element to decode HTML entities
  // This works in both browser and Node.js environments
  if (typeof window !== 'undefined') {
    // Browser environment
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  } else {
    // Node.js environment - decode common HTML entities
    return text
      .replace(/&#8230;/g, '...')
      .replace(/&hellip;/g, '...')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8211;/g, '–')
      .replace(/&#8212;/g, '—')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      // Decode numeric entities (e.g., &#8230;)
      .replace(/&#(\d+);/g, (match, dec) => {
        const charCode = parseInt(dec, 10);
        return String.fromCharCode(charCode);
      })
      // Decode hex entities (e.g., &#x2026;)
      .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
        const charCode = parseInt(hex, 16);
        return String.fromCharCode(charCode);
      });
  }
}

/**
 * Clean and decode text from WordPress
 */
function cleanText(text: string): string {
  // Remove HTML tags first
  let cleaned = text.replace(/<[^>]*>/g, '');
  // Decode HTML entities
  cleaned = decodeHtmlEntities(cleaned);
  // Clean up whitespace
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\[&hellip;\]/g, '...')
    .trim();
  return cleaned;
}

/**
 * Transform WordPress post to normalized BlogArticle format
 */
function transformWordPressPost(post: WordPressPost): BlogArticle {
  // Extract featured media
  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
  const cleanTitle = cleanText(post.title.rendered);
  const coverImage = featuredMedia ? {
    url: featuredMedia.source_url,
    alt: featuredMedia.alt_text || cleanTitle,
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

  // Clean and decode excerpt (title already cleaned above)
  const cleanExcerpt = cleanText(post.excerpt.rendered);

  return {
    id: post.id,
    slug: post.slug,
    title: cleanTitle,
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
    metaTitle: cleanTitle,
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
  const pixpawCategorySlugs = allCategories.map(cat => cat.slug);

  // CRITICAL: If no PixPaw categories exist, return empty array
  // This prevents showing posts from other websites
  if (pixpawCategoryIds.length === 0) {
    console.warn('[WordPress] No PixPaw categories found. Returning empty array to prevent showing unrelated content.');
    return [];
  }

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
    // Only allow filtering by valid PixPaw categories
    if (category === 'uncategorized') {
      // For uncategorized, we still need to ensure the post belongs to PixPaw taxonomy
      // We'll filter client-side after fetching
      params.append('pixpaw_category', pixpawCategoryIds.join(','));
    } else {
      const categoryData = await getCategoryBySlug(category);
      if (categoryData && pixpawCategorySlugs.includes(categoryData.slug)) {
        params.append('pixpaw_category', String(categoryData.id));
      } else {
        // Invalid category, return empty array
        console.warn(`[WordPress] Invalid category "${category}". Returning empty array.`);
        return [];
      }
    }
  } else {
    // If no specific category, filter by ANY PixPaw category
    // This ensures we only show PixPaw-related content
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
    
    // Additional client-side filtering to ensure only PixPaw-related posts are shown
    // This is a safety measure in case WordPress API returns unexpected results
    const filteredPosts = posts.filter(post => {
      // Check if post has any PixPaw category assigned
      const postCategories = post._embedded?.['wp:term']?.[0] || [];
      const hasPixPawCategory = postCategories.some(
        (term: any) => term.taxonomy === 'pixpaw_category' && pixpawCategoryIds.includes(term.id)
      );
      
      // If filtering by uncategorized, check if post has no PixPaw category
      if (category === 'uncategorized') {
        return !hasPixPawCategory;
      }
      
      // Otherwise, ensure post has at least one PixPaw category
      return hasPixPawCategory;
    });
    
    return filteredPosts.map(transformWordPressPost);
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
    // Get PixPaw categories first to validate the post
    const allCategories = await getCategories();
    const pixpawCategoryIds = allCategories.map(cat => cat.id);
    
    // If no PixPaw categories exist, don't show any posts
    if (pixpawCategoryIds.length === 0) {
      console.warn('[WordPress] No PixPaw categories found. Returning null.');
      return null;
    }

    const res = await fetch(
      `${WORDPRESS_API_URL}/posts?slug=${slug}&_embed=true&pixpaw_category=${pixpawCategoryIds.join(',')}`,
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

    // Additional validation: ensure post belongs to PixPaw taxonomy
    const post = posts[0];
    const postCategories = post._embedded?.['wp:term']?.[0] || [];
    const hasPixPawCategory = postCategories.some(
      (term: any) => term.taxonomy === 'pixpaw_category' && pixpawCategoryIds.includes(term.id)
    );

    if (!hasPixPawCategory) {
      console.warn(`[WordPress] Post "${slug}" does not belong to PixPaw taxonomy. Returning null.`);
      return null;
    }

    return transformWordPressPost(post);
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
    // Validate that categoryId belongs to PixPaw taxonomy
    const allCategories = await getCategories();
    const pixpawCategoryIds = allCategories.map(cat => cat.id);
    
    if (!pixpawCategoryIds.includes(categoryId)) {
      console.warn(`[WordPress] Invalid categoryId ${categoryId}. Returning empty array.`);
      return [];
    }

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
    
    // Additional client-side filtering to ensure only PixPaw-related posts
    const filteredPosts = posts.filter(post => {
      const postCategories = post._embedded?.['wp:term']?.[0] || [];
      return postCategories.some(
        (term: any) => term.taxonomy === 'pixpaw_category' && pixpawCategoryIds.includes(term.id)
      );
    });
    
    return filteredPosts.map(transformWordPressPost);
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
    // Get PixPaw categories first to filter posts
    const allCategories = await getCategories();
    const pixpawCategoryIds = allCategories.map(cat => cat.id);
    
    // If no PixPaw categories exist, return empty array
    if (pixpawCategoryIds.length === 0) {
      console.warn('[WordPress] No PixPaw categories found. Returning empty slugs array.');
      return [];
    }

    const res = await fetch(
      `${WORDPRESS_API_URL}/posts?per_page=100&status=publish&pixpaw_category=${pixpawCategoryIds.join(',')}&_fields=slug`,
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
