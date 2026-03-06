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

/**
 * Blocklist of slugs that should not be served (wrong articles, deleted content, etc.)
 * These articles will return 404 even if they exist in WordPress
 */
const BLOCKED_SLUGS = [
  'how-to-master-furniture-quality-control-service-china-complete-guide',
  'furniture-quality-control-service-china',
];

if (!WORDPRESS_API_URL) {
  console.warn('[WordPress] API URL not configured. Set WORDPRESS_API_URL or NEXT_PUBLIC_WORDPRESS_API_URL in .env.local');
} else {
  // Validate URL format
  try {
    new URL(WORDPRESS_API_URL);
  } catch (error) {
    console.error('[WordPress] Invalid API URL format:', WORDPRESS_API_URL);
  }
}

/**
 * Build WordPress REST API URL
 * Handles both full URLs (with /wp-json/wp/v2) and base URLs
 */
function buildWordPressApiUrl(endpoint: string, params?: string): string {
  const baseUrl = WORDPRESS_API_URL?.replace(/\/+$/, '') || '';

  if (baseUrl.includes('/wp-json/wp/v2')) {
    // Full URL with path
    return `${baseUrl}/${endpoint}${params ? `?${params}` : ''}`;
  } else {
    // Base URL, need to add wp-json/wp/v2 path
    return `${baseUrl}/wp-json/wp/v2/${endpoint}${params ? `?${params}` : ''}`;
  }
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
      .replace(/&#8211;/g, '-')
      .replace(/&#8212;/g, '-')
      .replace(/&mdash;/g, '-')
      .replace(/&ndash;/g, '-')
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
  // Strip "Meta Description:" lines that leak from WordPress SEO plugins
  cleaned = cleaned
    .split('\n')
    .filter(line => !line.trim().startsWith('Meta Description:'))
    .join(' ');
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

  // Extract category - prioritize pixpaw_category over default WordPress category
  // post._embedded['wp:term'] is a 2D array: [taxonomy1_terms[], taxonomy2_terms[], ...]
  // Each taxonomy array contains terms for that taxonomy
  let categoryData = null;

  if (post._embedded?.['wp:term']) {
    // First, try to find pixpaw_category taxonomy
    for (const taxonomyTerms of post._embedded['wp:term']) {
      if (taxonomyTerms && taxonomyTerms.length > 0) {
        const firstTerm = taxonomyTerms[0];
        if (firstTerm.taxonomy === 'pixpaw_category') {
          categoryData = firstTerm;
          break;
        }
      }
    }

    // If no pixpaw_category found, use the first available category
    if (!categoryData) {
      for (const taxonomyTerms of post._embedded['wp:term']) {
        if (taxonomyTerms && taxonomyTerms.length > 0) {
          const firstTerm = taxonomyTerms[0];
          // Prefer 'category' over other taxonomies like 'post_tag'
          if (firstTerm.taxonomy === 'category' || !categoryData) {
            categoryData = firstTerm;
            if (firstTerm.taxonomy === 'category') {
              break; // Found default category, use it
            }
          }
        }
      }
    }
  }

  const category = categoryData ? {
    id: categoryData.id,
    name: categoryData.name,
    slug: categoryData.slug,
  } : {
    id: 0,
    name: 'Uncategorized',
    slug: 'uncategorized',
  };

  // Log category extraction for debugging
  if (post._embedded?.['wp:term']) {
    const allTerms = post._embedded['wp:term'].flat().map((t: any) => ({
      taxonomy: t.taxonomy,
      id: t.id,
      name: t.name,
      slug: t.slug,
    }));
    console.log(`[WordPress] transformWordPressPost - Post ${post.id} (${post.slug}):`, {
      allTerms,
      selectedCategory: category,
      selectedFromTaxonomy: categoryData?.taxonomy,
    });
  }

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
 * Debug: Check if content has proper heading tags
 */
function debugContentStructure(content: string, slug: string): void {
  // Extract heading tags from content
  const headingMatches = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
  const headingCounts = {
    h1: (content.match(/<h1[^>]*>/gi) || []).length,
    h2: (content.match(/<h2[^>]*>/gi) || []).length,
    h3: (content.match(/<h3[^>]*>/gi) || []).length,
    h4: (content.match(/<h4[^>]*>/gi) || []).length,
    h5: (content.match(/<h5[^>]*>/gi) || []).length,
    h6: (content.match(/<h6[^>]*>/gi) || []).length,
  };

  console.log(`[WordPress] Content structure for "${slug}":`, {
    totalHeadings: headingMatches.length,
    headingCounts,
    hasHeadings: headingMatches.length > 0,
    sampleHeadings: headingMatches.slice(0, 3).map(h => h.substring(0, 100)),
  });
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

  // Validate URL format
  try {
    new URL(WORDPRESS_API_URL);
  } catch (error) {
    console.error('[WordPress] Invalid API URL format:', WORDPRESS_API_URL, error);
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

  // Log for debugging
  console.log('[WordPress] Found categories:', {
    count: allCategories.length,
    categories: allCategories.map(c => ({ id: c.id, slug: c.slug, name: c.name })),
  });

  // If no categories found, we'll fetch all posts and filter client-side
  // This handles cases where taxonomy might not be properly registered in REST API
  const hasCategories = pixpawCategoryIds.length > 0;

  const params = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
    _embed: 'true', // Embed featured media, categories, and author
    status: 'publish', // Only published posts
    orderby: 'date',
    order: 'desc',
  });

  // Add category filter if provided (using custom taxonomy)
  if (category && hasCategories) {
    // Only allow filtering by valid PixPaw categories
    if (category === 'uncategorized') {
      // For uncategorized, fetch all posts and filter client-side
      // Don't add category filter here
    } else {
      const categoryData = await getCategoryBySlug(category);
      if (categoryData && pixpawCategorySlugs.includes(categoryData.slug)) {
        params.append('pixpaw_category', String(categoryData.id));
      } else {
        console.warn(`[WordPress] Invalid category "${category}". Will fetch all posts.`);
        // Don't return empty, let it fetch all and filter client-side
      }
    }
  } else if (hasCategories && !category) {
    // If no specific category but we have categories, filter by ANY PixPaw category
    // This ensures we only show PixPaw-related content
    params.append('pixpaw_category', pixpawCategoryIds.join(','));
  }
  // If no categories found, don't add filter - fetch all posts and filter client-side

  // Add search filter if provided
  if (search) {
    params.append('search', search);
  }

  try {
    const apiUrl = buildWordPressApiUrl('posts', params.toString());
    console.log('[WordPress] Fetching posts from:', apiUrl);

    const res = await fetch(
      apiUrl,
      {
        next: { revalidate: 3600 }, // ISR: Revalidate every 1 hour
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unable to read error response');
      console.error(`[WordPress] API error: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
    }

    const posts: WordPressPost[] = await res.json();

    console.log(`[WordPress] Received ${posts.length} posts from API`);

    // Log first post structure for debugging
    if (posts.length > 0) {
      const firstPost = posts[0];
      console.log('[WordPress] First post structure:', {
        id: firstPost.id,
        title: firstPost.title?.rendered,
        slug: firstPost.slug,
        status: firstPost.status,
        categories: firstPost.categories,
        tags: firstPost.tags,
        embeddedTerms: firstPost._embedded?.['wp:term']?.map((terms: any[]) =>
          terms.map((t: any) => ({
            taxonomy: t.taxonomy,
            id: t.id,
            name: t.name,
            slug: t.slug,
          }))
        ),
      });
    }

    // Additional client-side filtering to ensure only PixPaw-related posts are shown
    // This is a safety measure in case WordPress API returns unexpected results
    const filteredPosts = posts.filter(post => {
      // If we have categories, check if post belongs to PixPaw taxonomy
      if (hasCategories) {
        const postCategories = post._embedded?.['wp:term']?.flat() || [];
        
        // STRICT: Only show posts with pixpaw_category taxonomy
        // This prevents FMIC (furniture) content from appearing on PixPawAI
        const hasPixPawCategory = postCategories.some(
          (term: any) => term.taxonomy === 'pixpaw_category' && pixpawCategoryIds.includes(term.id)
        );
        
        // Log detailed taxonomy information for debugging
        const taxonomyDetails = postCategories.map((t: any) => ({
          taxonomy: t.taxonomy,
          id: t.id,
          name: t.name,
          slug: t.slug,
        }));

        // If filtering by uncategorized, check if post has no PixPaw category
        if (category === 'uncategorized') {
          const shouldShow = !hasPixPawCategory;
          console.log(`[WordPress] Post ${post.id} (${post.slug}) - uncategorized filter:`, {
            taxonomyDetails,
            hasPixPawCategory,
            shouldShow,
          });
          return shouldShow;
        }
        
        // STRICT: Only show posts with pixpaw_category
        // Do NOT fall back to default WordPress categories to avoid FMIC content pollution
        if (hasPixPawCategory) {
          console.log(`[WordPress] Post ${post.id} (${post.slug}) - has pixpaw_category:`, taxonomyDetails);
          return true;
        }
        
        // Post does not have pixpaw_category - filter it out
        console.log(`[WordPress] Post ${post.id} (${post.slug}) - filtered out (no pixpaw_category):`, {
          taxonomyDetails,
          hasPixPawCategory,
        });
        return false;
      } else {
        // If no pixpaw_category taxonomy found, return empty
        // This prevents showing unfiltered content that might include FMIC articles
        console.warn('[WordPress] No pixpaw_category taxonomy found. Returning empty results to avoid content pollution.');
        return false;
      }
    });

    console.log(`[WordPress] Filtered ${filteredPosts.length} posts from ${posts.length} total`);

    return filteredPosts.map(transformWordPressPost);
  } catch (error) {
    // Enhanced error logging
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[WordPress] Network error - check WordPress API URL:', {
        WORDPRESS_API_URL,
        error: error.message,
        stack: error.stack,
      });
    } else if (error instanceof Error) {
      console.error('[WordPress] Error fetching articles:', {
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error('[WordPress] Unknown error fetching articles:', error);
    }
    return [];
  }
}

/**
 * Get single blog article by slug
 */
export async function getBlogArticle(slug: string): Promise<BlogArticle | null> {
  // Check if slug is in blocklist - return null to trigger 404
  if (BLOCKED_SLUGS.includes(slug)) {
    console.warn(`[WordPress] Blocked slug requested: "${slug}" - returning 404`);
    return null;
  }

  if (!WORDPRESS_API_URL) {
    console.warn('[WordPress] Returning null - API URL not configured');
    return null;
  }

  try {
    // Get PixPaw categories first to validate the post
    const allCategories = await getCategories();
    const pixpawCategoryIds = allCategories.map(cat => cat.id);
    const hasCategories = pixpawCategoryIds.length > 0;

    // Build query URL - don't filter by category for single article lookup
    // We'll validate the taxonomy client-side instead
    // This ensures we can find articles even if they use default WordPress categories
    const queryParams = `slug=${slug}&_embed=true`;
    const queryUrl = buildWordPressApiUrl('posts', queryParams);

    console.log(`[WordPress] getBlogArticle - Fetching post with slug "${slug}" from:`, queryUrl);

    const res = await fetch(
      queryUrl,
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

    console.log(`[WordPress] getBlogArticle - Received ${posts.length} posts for slug "${slug}"`);

    if (posts.length === 0) {
      console.warn(`[WordPress] No post found with slug "${slug}"`);
      return null;
    }

    // Additional validation: ensure post belongs to PixPaw taxonomy (if categories exist)
    if (hasCategories) {
      const post = posts[0];
      const postCategories = post._embedded?.['wp:term']?.flat() || [];
      
      // STRICT: Only allow posts with pixpaw_category taxonomy
      // This prevents FMIC (furniture) content from appearing on PixPawAI
      const hasPixPawCategory = postCategories.some(
        (term: any) => term.taxonomy === 'pixpaw_category' && pixpawCategoryIds.includes(term.id)
      );

      const taxonomyDetails = postCategories.map((t: any) => ({
        taxonomy: t.taxonomy,
        id: t.id,
        name: t.name,
        slug: t.slug,
      }));

      console.log(`[WordPress] getBlogArticle - Post taxonomy check:`, {
        slug,
        taxonomyDetails,
        hasPixPawCategory,
      });

      // STRICT: Only allow posts with pixpaw_category
      // Do NOT fall back to default WordPress categories to avoid FMIC content pollution
      if (hasPixPawCategory) {
        console.log(`[WordPress] Post "${slug}" has pixpaw_category - allowing`);
        return transformWordPressPost(post);
      }

      console.warn(`[WordPress] Post "${slug}" does not belong to PixPaw taxonomy. Returning null.`);
      return null;
    }

    // If no pixpaw_category taxonomy found, return null
    // This prevents showing unfiltered content that might include FMIC articles
    console.warn(`[WordPress] No pixpaw_category taxonomy found for post "${slug}". Returning null to avoid content pollution.`);
    return null;
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
    const apiUrl = buildWordPressApiUrl('posts', params.toString());

    const res = await fetch(
      apiUrl,
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
    const apiUrl = buildWordPressApiUrl('pixpaw_category', `slug=${slug}`);
    const res = await fetch(
      apiUrl,
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
 * Fetches both "blog" and "how-to" category slugs for backward compatibility
 */
export async function getCategories(): Promise<WordPressCategory[]> {
  if (!WORDPRESS_API_URL) {
    return [];
  }

  try {
    // Use custom taxonomy 'pixpaw_category' instead of default 'categories'
    // Include both 'blog' and 'how-to' slugs in the query
    const apiUrl = buildWordPressApiUrl('pixpaw_category', 'per_page=100&orderby=name&order=asc&slug=blog,how-to');
    console.log('[WordPress] Fetching categories from:', apiUrl);

    const res = await fetch(
      apiUrl,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      // Log the error for debugging
      const errorText = await res.text();
      console.error(`[WordPress] Failed to fetch categories: ${res.status} ${res.statusText}`, errorText);

      // If 404, the taxonomy might not be registered in REST API
      // Try alternative endpoints
      if (res.status === 404) {
        console.warn('[WordPress] pixpaw_category taxonomy not found. Trying alternative endpoints...');
        // Try default categories endpoint as fallback
        const fallbackUrl = buildWordPressApiUrl('categories', 'per_page=100&orderby=name&order=asc&slug=blog,how-to');
        const fallbackRes = await fetch(
          fallbackUrl,
          {
            next: { revalidate: 86400 },
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (fallbackRes.ok) {
          console.log('[WordPress] Using default categories endpoint as fallback');
          return await fallbackRes.json();
        }
      }

      throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
    }

    const categories = await res.json();
    console.log(`[WordPress] Successfully fetched ${categories.length} categories`);
    return categories;
  } catch (error) {
    console.error('[WordPress] Error fetching categories:', error);
    return [];
  }
}

/**
 * Get all article slugs for static generation
 * Fetches posts ONLY from pixpaw_category taxonomy (PixPawAI-specific)
 * Excludes FMIC (furnituremadeinchina.com) articles
 */
export async function getAllArticleSlugs(): Promise<string[]> {
  if (!WORDPRESS_API_URL) {
    return [];
  }

  try {
    // Get PixPaw categories first to filter posts
    const allCategories = await getCategories();
    const pixpawCategoryIds = allCategories
      .filter(cat => cat.taxonomy === 'pixpaw_category')
      .map(cat => cat.id);
    const hasCategories = pixpawCategoryIds.length > 0;

    const slugs = new Set<string>();

    // Only fetch posts with pixpaw_category - this ensures we only get PixPawAI content
    // Do NOT fetch from WordPress default categories to avoid FMIC content pollution
    if (hasCategories) {
      const pixpawQueryParams = `per_page=100&status=publish&_fields=slug&pixpaw_category=${pixpawCategoryIds.join(',')}`;
      const pixpawApiUrl = buildWordPressApiUrl('posts', pixpawQueryParams);

      console.log('[WordPress] Fetching slugs from pixpaw_category:', pixpawApiUrl);

      const pixpawRes = await fetch(
        pixpawApiUrl,
        {
          next: { revalidate: 3600 },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (pixpawRes.ok) {
        const pixpawPosts: Array<{ slug: string }> = await pixpawRes.json();
        pixpawPosts.forEach(post => slugs.add(post.slug));
        console.log(`[WordPress] Found ${pixpawPosts.length} posts with pixpaw_category`);
      } else {
        console.error('[WordPress] Error fetching pixpaw_category posts:', pixpawRes.status);
      }
    } else {
      console.warn('[WordPress] No pixpaw_category taxonomy found. Sitemap may be empty.');
    }

    // Convert Set to Array and filter out blocked slugs
    const filteredSlugs = Array.from(slugs).filter(slug => !BLOCKED_SLUGS.includes(slug));

    console.log(`[WordPress] Total unique slugs for sitemap: ${filteredSlugs.length}`);

    return filteredSlugs;
  } catch (error) {
    console.error('[WordPress] Error fetching article slugs:', error);
    return [];
  }
}
