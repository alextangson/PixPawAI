/**
 * WordPress REST API Types
 * Documentation: https://developer.wordpress.org/rest-api/reference/
 */

// Raw WordPress API Response Types
export interface WordPressPost {
  id: number;
  date: string;
  date_gmt: string;
  guid: { rendered: string };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  excerpt: { rendered: string; protected: boolean };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  template: string;
  format: string;
  meta: any[];
  categories: number[];
  tags: number[];
  acf?: {
    featured?: boolean;
    reading_time?: number;
    seo_keywords?: string;
  };
  _embedded?: {
    author?: Array<{
      id: number;
      name: string;
      url: string;
      description: string;
      link: string;
      slug: string;
      avatar_urls: Record<string, string>;
    }>;
    'wp:featuredmedia'?: Array<{
      id: number;
      date: string;
      slug: string;
      type: string;
      link: string;
      title: { rendered: string };
      caption: { rendered: string };
      alt_text: string;
      media_type: string;
      mime_type: string;
      media_details: {
        width: number;
        height: number;
        file: string;
        sizes: Record<string, {
          file: string;
          width: number;
          height: number;
          mime_type: string;
          source_url: string;
        }>;
      };
      source_url: string;
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      link: string;
      name: string;
      slug: string;
      taxonomy: string;
    }>>;
  };
}

export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: any[];
}

// Normalized Blog Article Type (for Next.js app)
export interface BlogArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: {
    url: string;
    alt: string;
    width: number;
    height: number;
  } | null;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  author: {
    name: string;
    avatar: string;
  };
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  isFeatured: boolean;
  seoKeywords: string[];
  metaTitle: string;
  metaDescription: string;
}

// Blog Category Types
export type BlogCategorySlug = 'photo-tips' | 'style-guide' | 'printing' | 'troubleshooting' | 'pet-care';

export interface BlogCategory {
  id: number;
  slug: BlogCategorySlug;
  name: string;
  description: string;
  icon: string;
}

// API Filter Options
export interface GetBlogArticlesOptions {
  category?: string;
  perPage?: number;
  page?: number;
  featured?: boolean;
  search?: string;
  hub?: 'how-to' | 'blog';
}
