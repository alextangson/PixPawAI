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
        const postCategories = post._embedded?.['wp:term']?.[0] || [];
        
        // Check for pixpaw_category taxonomy
        const hasPixPawCategory = postCategories.some(
          (term: any) => term.taxonomy === 'pixpaw_category' && pixpawCategoryIds.includes(term.id)
        );
        
        // Also check if post uses default WordPress categories taxonomy
        // This handles cases where posts might use default categories instead of custom taxonomy
        const hasDefaultCategory = postCategories.some(
          (term: any) => term.taxonomy === 'category'
        );
        
        // Log detailed taxonomy information
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
        
        // If post has pixpaw_category, show it
        if (hasPixPawCategory) {
          console.log(`[WordPress] Post ${post.id} (${post.slug}) - has pixpaw_category:`, taxonomyDetails);
          return true;
        }
        
        // TEMPORARY: If post has default WordPress category but no pixpaw_category,
        // show it anyway (this allows posts to display while taxonomy is being migrated)
        // TODO: Remove this fallback once all posts are migrated to pixpaw_category
        if (hasDefaultCategory && postCategories.length > 0) {
          console.log(`[WordPress] Post ${post.id} (${post.slug}) - using default category fallback:`, taxonomyDetails);
          return true;
        }
        
        console.log(`[WordPress] Post ${post.id} (${post.slug}) - filtered out:`, {
          taxonomyDetails,
          hasPixPawCategory,
          hasDefaultCategory,
        });
        return false;
      } else {
        // If no categories found, check if post has ANY taxonomy terms
        // This is a fallback - we assume posts with any taxonomy are valid
        const postCategories = post._embedded?.['wp:term']?.[0] || [];
        
        // Log for debugging
        if (posts.indexOf(post) === 0) {
          console.log('[WordPress] Sample post taxonomy terms:', postCategories.map((t: any) => ({
            taxonomy: t.taxonomy,
            name: t.name,
            slug: t.slug,
          })));
        }
        
        // If filtering by uncategorized, show posts with no categories
        if (category === 'uncategorized') {
          return postCategories.length === 0;
        }
        
        // Show posts that have at least one taxonomy term
        // This allows posts with custom taxonomies to be shown
        return true; // For now, show all posts if no categories configured
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
      const postCategories = post._embedded?.['wp:term']?.[0] || [];
      const hasPixPawCategory = postCategories.some(
        (term: any) => term.taxonomy === 'pixpaw_category' && pixpawCategoryIds.includes(term.id)
      );
      
      // Also check if post uses default WordPress categories taxonomy
      const hasDefaultCategory = postCategories.some(
        (term: any) => term.taxonomy === 'category'
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
        hasDefaultCategory,
      });

      // If post has pixpaw_category, allow it
      if (hasPixPawCategory) {
        console.log(`[WordPress] Post "${slug}" has pixpaw_category - allowing`);
        return transformWordPressPost(post);
      }
      
      // TEMPORARY: If post has default WordPress category but no pixpaw_category,
      // allow it anyway (this allows posts to display while taxonomy is being migrated)
      // TODO: Remove this fallback once all posts are migrated to pixpaw_category
      if (hasDefaultCategory && postCategories.length > 0) {
        console.log(`[WordPress] Post "${slug}" using default category fallback - allowing`);
        return transformWordPressPost(post);
      }

      console.warn(`[WordPress] Post "${slug}" does not belong to PixPaw taxonomy and has no default category. Returning null.`);
      return null;
    }

    // If no categories configured, allow all posts
      console.log(`[WordPress] No categories configured - allowing post "${slug}"`);
    const article = transformWordPressPost(posts[0]);
    
    // Debug content structure
    debugContentStructure(article.content, slug);
    
    return article;
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
 */
export async function getCategories(): Promise<WordPressCategory[]> {
  if (!WORDPRESS_API_URL) {
    return [];
  }

  try {
    // Use custom taxonomy 'pixpaw_category' instead of default 'categories'
    const apiUrl = buildWordPressApiUrl('pixpaw_category', 'per_page=100&orderby=name&order=asc');
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
        const fallbackUrl = buildWordPressApiUrl('categories', 'per_page=100&orderby=name&order=asc');
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
 */
export async function getAllArticleSlugs(): Promise<string[]> {
  if (!WORDPRESS_API_URL) {
    return [];
  }

  try {
    // Get PixPaw categories first to filter posts
    const allCategories = await getCategories();
    const pixpawCategoryIds = allCategories.map(cat => cat.id);
    const hasCategories = pixpawCategoryIds.length > 0;
    
    // Build query - only add category filter if we have categories
    let queryParams = 'per_page=100&status=publish&_fields=slug';
    if (hasCategories) {
      queryParams += `&pixpaw_category=${pixpawCategoryIds.join(',')}`;
    }
    const apiUrl = buildWordPressApiUrl('posts', queryParams);

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

    const posts: Array<{ slug: string }> = await res.json();
    return posts.map(post => post.slug);
  } catch (error) {
    console.error('[WordPress] Error fetching article slugs:', error);
    return [];
  }
}
