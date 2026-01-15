'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StyleShowcaseProps {
  dict: {
    styles: {
      title: string;
      subtitle: string;
      categories: {
        pixar: {
          name: string;
          description: string;
        };
        royal: {
          name: string;
          description: string;
        };
        watercolor: {
          name: string;
          description: string;
        };
        modern: {
          name: string;
          description: string;
        };
      };
    };
  };
  onOpenUpload: (styleName: string) => void;
  lang: string;
}

export function StyleShowcase({ dict, onOpenUpload, lang }: StyleShowcaseProps) {
  const styles = [
    {
      name: '3D Movie Star',
      description: 'Pixar-style vibrant 3D art',
      image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=600&fit=crop',
      badge: 'Most Popular',
      aspectRatio: 'portrait', // tall
    },
    {
      name: 'Royal Highness',
      description: 'Regal oil painting masterpiece',
      image: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&h=400&fit=crop',
      badge: 'Premium',
      aspectRatio: 'square',
    },
    {
      name: 'Watercolor Art',
      description: 'Soft dreamy watercolor',
      image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=600&fit=crop',
      badge: null,
      aspectRatio: 'portrait',
    },
    {
      name: 'Pop Art',
      description: 'Bold colorful comic style',
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
      badge: null,
      aspectRatio: 'square',
    },
    {
      name: 'Cyberpunk',
      description: 'Neon futuristic vibes',
      image: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=400&h=500&fit=crop',
      badge: 'Trending',
      aspectRatio: 'portrait',
    },
    {
      name: 'Vintage Sketch',
      description: 'Classic pencil drawing',
      image: 'https://images.unsplash.com/photo-1444212477490-ca407925329e?w=400&h=400&fit=crop',
      badge: null,
      aspectRatio: 'square',
    },
    {
      name: 'Superhero',
      description: 'Epic cape & mask adventure',
      image: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=600&fit=crop',
      badge: null,
      aspectRatio: 'portrait',
    },
    {
      name: 'Studio Anime',
      description: 'Ghibli-inspired magic',
      image: 'https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=400&h=400&fit=crop',
      badge: 'New',
      aspectRatio: 'square',
    },
  ];

  return (
    <section className="py-20 bg-cream">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {dict.styles.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {dict.styles.subtitle}
          </p>
        </div>

        {/* Light Masonry Grid */}
        <div className="columns-2 md:columns-4 gap-4 space-y-4">
          {styles.map((style, index) => (
            <button
              key={index}
              onClick={() => onOpenUpload(style.name)}
              className="group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer break-inside-avoid mb-4 w-full block"
            >
              {/* Badge */}
              {style.badge && (
                <div className="absolute top-4 right-4 z-30 bg-coral text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <Sparkles className="w-3 h-3" />
                  {style.badge}
                </div>
              )}

              {/* Full-Bleed Background Image with Zoom Effect */}
              <div className="relative overflow-hidden">
                <img
                  src={style.image}
                  alt={style.name}
                  className={`w-full object-cover group-hover:scale-110 transition-transform duration-700 ${
                    style.aspectRatio === 'portrait' ? 'h-80 md:h-96' : 'h-64 md:h-72'
                  }`}
                />
                {/* Gradient Overlay for Better Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Hover Overlay with CTA Button */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                  <div className="bg-white text-black font-bold px-6 py-3 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-2xl flex items-center gap-2">
                    Try this Style 🪄
                  </div>
                </div>
              </div>

              {/* Glassmorphism Text Panel at Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 backdrop-blur-md bg-white/10 border-t border-white/20 z-10">
                <h3 className="text-lg font-bold mb-1 text-white drop-shadow-lg">
                  {style.name}
                </h3>
                <p className="text-white/90 text-xs leading-relaxed drop-shadow">
                  {style.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center mt-12">
          <Link href={`/${lang}/gallery`}>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-coral text-coral hover:bg-coral hover:text-white font-semibold px-8 py-6 h-auto text-lg transition-all duration-300 group"
            >
              Explore All Styles in Gallery
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
