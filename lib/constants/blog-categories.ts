import { BlogCategory } from '@/lib/wordpress/types';

/**
 * Blog Category Definitions
 * These should match the PixPaw Categories created in WordPress
 */
export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    id: 1, // Will be overridden by WordPress category ID
    slug: 'photo-tips',
    name: 'Photo Tips',
    description: 'Learn how to take the perfect pet photo for AI art generation',
    icon: 'camera',
  },
  {
    id: 2,
    slug: 'style-guide',
    name: 'Style Guide',
    description: 'Discover which art style suits your pet best',
    icon: 'palette',
  },
  {
    id: 3,
    slug: 'printing',
    name: 'Printing',
    description: 'Everything about printing and physical products',
    icon: 'printer',
  },
  {
    id: 4,
    slug: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Fix common issues and get the best results',
    icon: 'wrench',
  },
  {
    id: 5,
    slug: 'pet-care',
    name: 'Pet Care',
    description: 'Tips and guides for pet photography and care',
    icon: 'camera',
  },
];

export function getCategoryBySlug(slug: string): BlogCategory | undefined {
  return BLOG_CATEGORIES.find(cat => cat.slug === slug);
}

export function getCategoryById(id: number): BlogCategory | undefined {
  return BLOG_CATEGORIES.find(cat => cat.id === id);
}
