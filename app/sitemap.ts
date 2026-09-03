import { MetadataRoute } from 'next';
import { getAllArticleEntries } from '@/lib/wordpress/blog';
import { STYLES } from '@/lib/styles';
import { SHOP_PRODUCTS } from '@/lib/seo/shop-products';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com';

// Maintained by hand: bump when the corresponding page copy actually changes.
// A moving `now` here would make lastmod meaningless to crawlers.
const HOME_LAST_UPDATED = new Date('2026-08-29');
const STYLES_LAST_UPDATED = new Date('2026-01-20'); // last style added, see lib/styles.ts
const SHOP_LAST_UPDATED = new Date('2026-04-02');

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

function getShopPages(): MetadataRoute.Sitemap {
  return SHOP_PRODUCTS.map((product) => ({
    url: `${SITE_URL}/en/shop/${product.productId}/`,
    lastModified: SHOP_LAST_UPDATED,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}

/**
 * Static pages. `blogIndexUpdated` is derived from the newest article so the
 * blog index gets a real lastmod; everything else carries a hand-maintained date.
 * UUID gallery items are intentionally omitted — they dilute crawl budget.
 */
function getStaticPages(
  blogIndexUpdated: Date | undefined
): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/en/`,              changeFrequency: 'daily'   as const, priority: 1,   lastModified: HOME_LAST_UPDATED },
    { url: `${SITE_URL}/en/gallery/`,      changeFrequency: 'daily'   as const, priority: 0.9, lastModified: HOME_LAST_UPDATED },
    { url: `${SITE_URL}/en/blog/`,         changeFrequency: 'daily'   as const, priority: 0.8, lastModified: blogIndexUpdated },
    { url: `${SITE_URL}/en/pricing/`,      changeFrequency: 'weekly'  as const, priority: 0.8, lastModified: new Date('2026-08-29') },
    { url: `${SITE_URL}/en/pet-memorial/`, changeFrequency: 'weekly'  as const, priority: 0.8, lastModified: new Date('2026-08-29') },
    { url: `${SITE_URL}/en/gift/`,         changeFrequency: 'weekly'  as const, priority: 0.8, lastModified: new Date('2026-08-29') },
    { url: `${SITE_URL}/en/shop/`,         changeFrequency: 'weekly'  as const, priority: 0.7, lastModified: SHOP_LAST_UPDATED },
    { url: `${SITE_URL}/en/faq/`,          changeFrequency: 'monthly' as const, priority: 0.7, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/about/`,        changeFrequency: 'monthly' as const, priority: 0.7, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/glossary/`,     changeFrequency: 'monthly' as const, priority: 0.6, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/alternatives/`, changeFrequency: 'monthly' as const, priority: 0.7, lastModified: new Date('2026-08-29') },
    { url: `${SITE_URL}/en/alternatives/crown-and-paw/`,    changeFrequency: 'monthly' as const, priority: 0.7, lastModified: new Date('2026-08-29') },
    { url: `${SITE_URL}/en/alternatives/west-and-willow/`,  changeFrequency: 'monthly' as const, priority: 0.7, lastModified: new Date('2026-08-29') },
    { url: `${SITE_URL}/en/use-cases/`,    changeFrequency: 'monthly' as const, priority: 0.7, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/contact/`,      changeFrequency: 'yearly'  as const, priority: 0.4, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/privacy/`,      changeFrequency: 'yearly'  as const, priority: 0.3, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/terms/`,        changeFrequency: 'yearly'  as const, priority: 0.3, lastModified: new Date('2026-03-19') },
    { url: `${SITE_URL}/en/acceptable-use/`, changeFrequency: 'yearly' as const, priority: 0.3, lastModified: new Date('2026-09-03') },
    { url: `${SITE_URL}/en/refund/`,       changeFrequency: 'yearly'  as const, priority: 0.3, lastModified: new Date('2026-03-19') },
  ];
}

/**
 * Dynamic sitemap including static pages, blog articles, shop PDPs,
 * content/SEO pages, and style pages. Gallery UUID permalinks are excluded.
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stylePages: MetadataRoute.Sitemap = STYLES.map((style) => ({
    url: `${SITE_URL}/en/styles/${toSlug(style.id)}/`,
    lastModified: STYLES_LAST_UPDATED,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const articlePages = await getArticlePages();
  const shopPages = getShopPages();

  const staticPages = getStaticPages(
    newestDate(articlePages.map((page) => page.lastModified as Date | undefined))
  );

  return [...staticPages, ...stylePages, ...articlePages, ...shopPages];
}

// Revalidate sitemap every hour
export const revalidate = 3600;
