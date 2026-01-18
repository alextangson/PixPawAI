import { type Locale } from '@/lib/i18n-config';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Eye, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GalleryImagePageProps {
  params: Promise<{
    lang: Locale;
    id: string;
  }>;
}

// SEO Metadata for individual gallery images
export async function generateMetadata({ params }: GalleryImagePageProps): Promise<Metadata> {
  const { id, lang } = await params;
  
  const supabase = await createClient();
  const { data: image } = await supabase
    .from('generations')
    .select('title, alt_text, output_url, style, pet_type, prompt')
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (!image) {
    return {
      title: 'Image Not Found | PixPaw AI Gallery',
    };
  }

  const title = image.title || 'AI Pet Portrait';
  const description = image.alt_text || image.prompt?.substring(0, 160) || 'AI generated pet portrait in stunning artistic style';

  return {
    title: `${title} - PixPaw AI Gallery`,
    description,
    openGraph: {
      title: `${title} - PixPaw AI Gallery`,
      description,
      images: [
        {
          url: image.output_url,
          width: 1024,
          height: 1024,
          alt: image.alt_text || title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - PixPaw AI`,
      description,
      images: [image.output_url],
    },
    alternates: {
      canonical: `https://pixpawai.com/${lang}/gallery/${id}`,
    },
  };
}

export default async function GalleryImagePage({ params }: GalleryImagePageProps) {
  const { id, lang } = await params;

  const supabase = await createClient();
  const { data: image, error } = await supabase
    .from('generations')
    .select('id, output_url, title, alt_text, style, style_category, prompt, created_at, views, likes, is_public, pet_type')
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (error || !image) {
    notFound();
  }

  // Determine pet category for display
  const getPetCategory = (petType: string | null): string => {
    if (!petType) return 'Pet';
    
    const type = petType.toLowerCase();
    if (type === 'dog') return 'Dog';
    if (type === 'cat') return 'Cat';
    if (type === 'rabbit' || type === 'bunny') return 'Rabbit';
    if (['hamster', 'guinea pig', 'gerbil', 'mouse', 'rat', 'ferret'].includes(type)) return 'Small Pet';
    if (['bird', 'parrot', 'parakeet', 'cockatiel'].includes(type)) return 'Bird';
    if (['lizard', 'gecko', 'snake', 'turtle'].includes(type)) return 'Reptile';
    if (['horse', 'pony', 'cow', 'pig', 'sheep'].includes(type)) return 'Farm Animal';
    
    return petType.charAt(0).toUpperCase() + petType.slice(1);
  };

  const petCategory = getPetCategory(image.pet_type);

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <Link
            href={`/${lang}/gallery`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-coral transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Gallery</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image */}
          <div className="space-y-6">
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-50 to-gray-100">
              <img
                src={image.output_url}
                alt={image.alt_text || image.title || 'AI generated pet portrait'}
                className="w-full h-full object-cover"
              />
              
              {/* Brand Logo */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md">
                <span className="text-coral font-bold text-lg">
                  PixPaw<span className="text-orange-600">AI</span>
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{image.views ?? 0}</p>
                  <p className="text-sm text-gray-500">Views</p>
                </div>
              </div>
              <div className="w-px h-12 bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{image.likes ?? 0}</p>
                  <p className="text-sm text-gray-500">Likes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex flex-col justify-center space-y-8">
            {/* Tags */}
            <div className="flex gap-3 flex-wrap">
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {petCategory}
              </span>
              <span className="px-4 py-2 bg-coral/10 text-coral rounded-full text-sm font-medium">
                {image.style}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              {image.title || 'AI Pet Portrait'}
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-600 leading-relaxed">
              {image.alt_text || image.prompt?.substring(0, 200) || 'A stunning AI-generated pet portrait created with advanced artificial intelligence.'}
            </p>

            {/* Style Features */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-coral rounded-xl p-6 shadow-sm">
              <p className="text-gray-700 leading-relaxed">
                <strong className="text-coral">✨ Style Features:</strong> This artistic style combines soft lighting,
                vibrant colors, and Pixar-like 3D rendering to transform your pet into a
                stunning character. Perfect for creating memorable keepsakes.
              </p>
            </div>

            {/* CTA Button */}
            <Link href={`/${lang}?style=${encodeURIComponent(image.style)}`}>
              <Button
                size="lg"
                className="w-full text-xl font-bold py-7 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-[1.02]"
              >
                <Sparkles className="w-6 h-6 mr-2" />
                Create Your Own Pet Portrait
              </Button>
            </Link>

            {/* Trust Signal */}
            <p className="text-center text-gray-400 text-sm">
              ⚡ Generated in ~30 seconds • 🎨 4K quality • 💯 Money-back guarantee
            </p>

            {/* Metadata */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Created on {new Date(image.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Related Images Section (Optional - can be added later) */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Explore More Pet Portraits
          </h2>
          <div className="text-center">
            <Link href={`/${lang}/gallery`}>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-coral text-coral hover:bg-coral hover:text-white"
              >
                View Full Gallery
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
