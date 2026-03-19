import { type Locale } from '@/lib/i18n-config';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { GalleryGridClient } from '@/components/gallery/gallery-grid-client';
import { GallerySchema } from '@/components/gallery/gallery-schema';
import { logger } from '@/lib/logger';
import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE_URL, DEFAULT_TWITTER_IMAGE_URL, SEO_SITE_URL } from '@/lib/seo/metadata';

interface GalleryImage {
  id: string;
  output_url: string;
  title: string | null;
  alt_text: string | null;
  style: string;
  style_category: string | null;
  prompt: string;
  created_at: string;
  views: number;
  likes: number;
  is_public: boolean;
  pet_type: string | null;
}

// SEO Metadata
export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
  const { lang } = await params;
  const pageUrl = `${SEO_SITE_URL}/${lang}/gallery/`;
  return {
    title: 'AI Pet Art Gallery - Explore Styles | PixPaw AI',
    description: 'Explore real AI pet portraits from the PixPaw community. Discover style inspiration for dogs, cats, and more.',
    openGraph: {
      title: 'AI Pet Art Gallery - Explore Styles | PixPaw AI',
      description: 'Browse real AI pet portraits and discover your favorite style.',
      url: pageUrl,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: 'PixPaw AI gallery',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AI Pet Art Gallery - Explore Styles | PixPaw AI',
      description: 'Browse real AI pet portraits and discover your favorite style.',
      images: [DEFAULT_TWITTER_IMAGE_URL],
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

export default async function GalleryPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang: paramLang } = await params;
  const lang = paramLang || 'en';
  
  // Server-side data fetching - Better for SEO
  const supabase = await createClient();
  const { data: images, error } = await supabase
    .from('generations')
    .select('id, output_url, title, alt_text, style, style_category, prompt, created_at, views, likes, is_public, pet_type')
    .eq('status', 'succeeded')
    .eq('is_public', true)
    .not('output_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(12);  // Reduced to 12 for faster initial load - infinite scroll will load more

  if (error) {
    logger.error('Gallery', error);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com';
  const galleryUrl = `${siteUrl}/${lang}/gallery`;

  return (
    <>
      <GallerySchema images={(images as GalleryImage[]) || []} url={galleryUrl} />
      <GalleryGridClient initialImages={(images as GalleryImage[]) || []} lang={lang} />
    </>
  );
}
