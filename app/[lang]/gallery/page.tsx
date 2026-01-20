import { type Locale } from '@/lib/i18n-config';
import { createClient } from '@/lib/supabase/server';
import { GalleryGridClient } from '@/components/gallery/gallery-grid-client';
import { logger } from '@/lib/logger';
import type { Metadata } from 'next';

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
  return {
    title: 'Pet Portrait Gallery | PixPaw AI',
    description: 'Discover stunning AI-generated pet portraits in Pixar style. Browse our community gallery of transformed pets and find inspiration for your own creation.',
    openGraph: {
      title: 'Pet Portrait Gallery | PixPaw AI',
      description: 'Discover stunning AI-generated pet portraits in Pixar style',
      type: 'website',
    },
    alternates: {
      canonical: `https://pixpawai.com/${lang}/gallery`,
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

  return <GalleryGridClient initialImages={(images as GalleryImage[]) || []} lang={lang} />;
}
