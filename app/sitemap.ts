import { MetadataRoute } from 'next';
import { getAllArticleSlugs } from '@/lib/wordpress/blog';
import { createClient } from '@/lib/supabase/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com';

/**
 * Dynamic sitemap including static pages, blog articles, and gallery images
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/en/gallery`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/en/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/en/how-to`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/en/shop`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Fetch blog article slugs from WordPress
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const articleSlugs = await getAllArticleSlugs();
    
    blogPages = articleSlugs.map((slug) => ({
      url: `${SITE_URL}/en/how-to/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('[Sitemap] Error fetching blog articles:', error);
  }

  // Fetch popular gallery images (limit to top 100 to avoid sitemap bloat)
  let galleryPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data: images } = await supabase
      .from('generations')
      .select('id, created_at')
      .eq('is_public', true)
      .eq('status', 'succeeded')
      .not('output_url', 'is', null)
      .order('views', { ascending: false })
      .limit(100);

    if (images) {
      galleryPages = images.map((image) => ({
        url: `${SITE_URL}/en/gallery/${image.id}`,
        lastModified: new Date(image.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error('[Sitemap] Error fetching gallery images:', error);
  }

  return [...staticPages, ...blogPages, ...galleryPages];
}

// Revalidate sitemap every hour
export const revalidate = 3600;
