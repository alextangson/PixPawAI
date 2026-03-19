import { MetadataRoute } from 'next';
import { getAllArticleSlugs } from '@/lib/wordpress/blog';
import { createAdminClient } from '@/lib/supabase/server';
import { listHubArticleSlugs } from '@/lib/content/blog-feed';
import { STYLES } from '@/lib/styles';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com';

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Dynamic sitemap including static pages, blog articles, gallery images,
 * content/SEO pages, style pages, and shop pages.
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = ([
    { url: `${SITE_URL}/en/`, changeFrequency: 'daily' as const, priority: 1 },
    { url: `${SITE_URL}/en/gallery/`, changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${SITE_URL}/en/blog/`, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${SITE_URL}/en/pricing/`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${SITE_URL}/en/pet-memorial/`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${SITE_URL}/en/shop/`, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${SITE_URL}/en/about/`, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${SITE_URL}/en/faq/`, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${SITE_URL}/en/glossary/`, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${SITE_URL}/en/alternatives/`, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${SITE_URL}/en/use-cases/`, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${SITE_URL}/en/contact/`, changeFrequency: 'yearly' as const, priority: 0.4 },
    { url: `${SITE_URL}/en/privacy/`, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${SITE_URL}/en/terms/`, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${SITE_URL}/en/refund/`, changeFrequency: 'yearly' as const, priority: 0.3 },
  ]).map((page) => ({ ...page, lastModified: now }));

  const stylePages: MetadataRoute.Sitemap = STYLES.map((style) => ({
    url: `${SITE_URL}/en/styles/${toSlug(style.id)}/`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const blogSlugs = await listHubArticleSlugs('blog');
    articlePages = blogSlugs.map((slug) => ({
      url: `${SITE_URL}/en/blog/${slug}/`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('[Sitemap] Error fetching blog articles:', error);
  }

  let galleryPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createAdminClient();
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
        url: `${SITE_URL}/en/gallery/${image.id}/`,
        lastModified: new Date(image.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error('[Sitemap] Error fetching gallery images:', error);
  }

  return [...staticPages, ...stylePages, ...articlePages, ...galleryPages];
}

// Revalidate sitemap every hour
export const revalidate = 3600;
