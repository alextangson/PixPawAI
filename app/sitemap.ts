import { MetadataRoute } from 'next';
import { getAllArticleEntries } from '@/lib/wordpress/blog';
import { createAdminClient } from '@/lib/supabase/server';
import { STYLES } from '@/lib/styles';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com';

// Maintained by hand: bump when the corresponding page copy actually changes.
// A moving `now` here would make lastmod meaningless to crawlers.
const HOME_LAST_UPDATED = new Date('2026-08-29');
const STYLES_LAST_UPDATED = new Date('2026-01-20'); // last style added, see lib/styles.ts

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Omit lastModified rather than emit an invalid/faked date. */
function toDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function newestDate(dates: Array<Date | undefined>): Date | undefined {
  const valid = dates.filter((date): date is Date => date instanceof Date);
  return valid.length > 0 ? new Date(Math.max(...valid.map((date) => date.getTime()))) : undefined;
}

async function getArticlePages(): Promise<MetadataRoute.Sitemap> {
  const entries = await getAllArticleEntries({ hub: 'blog' });

  return entries.map((entry) => ({
    url: `${SITE_URL}/en/blog/${entry.slug}/`,
    lastModified: toDate(entry.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}

async function getGalleryPages(): Promise<MetadataRoute.Sitemap> {
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

    return (images ?? []).map((image) => ({
      url: `${SITE_URL}/en/gallery/${image.id}/`,
      lastModified: toDate(image.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('[Sitemap] Error fetching gallery images:', error);
    return [];
  }
}

/**
 * Static pages. `blogIndexUpdated` / `galleryIndexUpdated` are derived from the
 * newest item in each feed, so those two index pages get a real lastmod;
 * everything else carries a hand-maintained date.
 */
function getStaticPages(
  blogIndexUpdated: Date | undefined,
  galleryIndexUpdated: Date | undefined
): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/en/`,              changeFrequency: 'daily'   as const, priority: 1,   lastModified: HOME_LAST_UPDATED },
    { url: `${SITE_URL}/en/gallery/`,      changeFrequency: 'daily'   as const, priority: 0.9, lastModified: galleryIndexUpdated },
    { url: `${SITE_URL}/en/blog/`,         changeFrequency: 'daily'   as const, priority: 0.8, lastModified: blogIndexUpdated },
    // lastModified = last real content change (git history of the page file); update when editing a page
    { url: `${SITE_URL}/en/pricing/`,      changeFrequency: 'weekly'  as const, priority: 0.8, lastModified: new Date('2026-08-29') },
    { url: `${SITE_URL}/en/pet-memorial/`, changeFrequency: 'weekly'  as const, priority: 0.8, lastModified: new Date('2026-07-02') },
    { url: `${SITE_URL}/en/shop/`,         changeFrequency: 'weekly'  as const, priority: 0.7, lastModified: new Date('2026-04-02') },
    { url: `${SITE_URL}/en/about/`,        changeFrequency: 'monthly' as const, priority: 0.7, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/faq/`,          changeFrequency: 'monthly' as const, priority: 0.7, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/glossary/`,     changeFrequency: 'monthly' as const, priority: 0.6, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/alternatives/`, changeFrequency: 'monthly' as const, priority: 0.7, lastModified: new Date('2026-08-29') },
    { url: `${SITE_URL}/en/alternatives/crown-and-paw/`,    changeFrequency: 'monthly' as const, priority: 0.7, lastModified: new Date('2026-08-29') },
    { url: `${SITE_URL}/en/alternatives/west-and-willow/`,  changeFrequency: 'monthly' as const, priority: 0.7, lastModified: new Date('2026-08-29') },
    { url: `${SITE_URL}/en/use-cases/`,    changeFrequency: 'monthly' as const, priority: 0.7, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/contact/`,      changeFrequency: 'yearly'  as const, priority: 0.4, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/privacy/`,      changeFrequency: 'yearly'  as const, priority: 0.3, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/terms/`,        changeFrequency: 'yearly'  as const, priority: 0.3, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/refund/`,       changeFrequency: 'yearly'  as const, priority: 0.3, lastModified: new Date('2026-03-19') },
  ];
}

/**
 * Dynamic sitemap including static pages, blog articles, gallery images,
 * content/SEO pages, style pages, and shop pages.
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stylePages: MetadataRoute.Sitemap = STYLES.map((style) => ({
    url: `${SITE_URL}/en/styles/${toSlug(style.id)}/`,
    lastModified: STYLES_LAST_UPDATED,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const [articlePages, galleryPages] = await Promise.all([
    getArticlePages(),
    getGalleryPages(),
  ]);

  const staticPages = getStaticPages(
    newestDate(articlePages.map((page) => page.lastModified as Date | undefined)),
    newestDate(galleryPages.map((page) => page.lastModified as Date | undefined))
  );

  return [...staticPages, ...stylePages, ...articlePages, ...galleryPages];
}

// Revalidate sitemap every hour
export const revalidate = 3600;
