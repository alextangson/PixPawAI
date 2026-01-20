'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStyles } from '@/lib/hooks/use-styles';

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
  // Fetch styles from database
  const { styles: databaseStyles, loading: stylesLoading } = useStyles()
  
  // Convert database styles to showcase format
  const styles = databaseStyles.map((style, index) => ({
    name: style.label,
    description: style.description || '',
    image: style.src || '/originals/iShot_2026-01-16_15.14.03.png', // Fallback to placeholder if src is empty
    badge: index === 0 ? 'Most Popular' : (index === 2 ? 'Trending' : null),
    aspectRatio: 'standard',
    isComingSoon: false,
  }))
  
  // Add "Coming Soon" placeholders if less than 8 styles
  const comingSoonPlaceholders = [
    {
      name: 'Watercolor Dream',
      description: 'Soft watercolor painting - Coming Soon',
      image: '/originals/iShot_2026-01-16_15.14.03.png',
      badge: 'Coming Soon',
      aspectRatio: 'standard',
      isComingSoon: true,
    },
    {
      name: 'Oil Painting',
      description: 'Classic oil painting masterpiece - Coming Soon',
      image: '/originals/iShot_2026-01-16_15.14.51.png',
      badge: 'Coming Soon',
      aspectRatio: 'standard',
      isComingSoon: true,
    },
    {
      name: 'Vintage Traveler',
      description: 'Whimsical steampunk adventure - Coming Soon',
      image: '/originals/iShot_2026-01-16_15.15.06.png',
      badge: 'Coming Soon',
      aspectRatio: 'standard',
      isComingSoon: true,
    },
  ]
  
  // Limit to exactly 8 styles for 2 rows x 4 columns layout
  const displayStyles = styles.slice(0, 8)

  return (
    <section className="py-10 sm:py-12 md:py-14 lg:py-16 xl:py-18 2xl:py-20 bg-cream">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Title */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold mb-3 sm:mb-4">
            {dict.styles.title}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            {dict.styles.subtitle}
          </p>
        </div>

        {/* Grid Layout - 2 Columns like Products */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {displayStyles.map((style, index) => (
            <button
              key={index}
              onClick={() => {
                if (style.isComingSoon) {
                  // Show toast notification for coming soon styles
                  alert('🚀 We\'re testing this style! Check back soon.')
                } else {
                  onOpenUpload(style.name)
                }
              }}
              className={`group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 w-full block ${
                style.isComingSoon ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {/* Badge */}
              {style.badge && (
                <div className={`absolute top-4 right-4 z-30 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg ${
                  style.isComingSoon ? 'bg-gray-500' : 'bg-coral'
                }`}>
                  <Sparkles className="w-3 h-3" />
                  {style.badge}
                </div>
              )}

              {/* Full-Bleed Background Image with Zoom Effect */}
              <div className="relative overflow-hidden h-44 sm:h-52 md:h-56 lg:h-48 xl:h-52 2xl:h-64 3xl:h-72">
                {style.image && style.image.trim() !== '' ? (
                  <Image
                    src={style.image}
                    alt={style.name}
                    fill
                    className={`object-cover transition-transform duration-700 ${
                      style.isComingSoon 
                        ? 'filter grayscale opacity-60' 
                        : 'group-hover:scale-110'
                    }`}
                    loading="lazy"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    quality={85}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No preview available</span>
                  </div>
                )}
                {/* Gradient Overlay for Better Text Readability */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent ${
                  style.isComingSoon ? 'bg-black/40' : ''
                }`} />
                
                {/* Hover Overlay with CTA Button */}
                {!style.isComingSoon && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                    <div className="bg-white text-black font-bold px-6 py-3 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-2xl flex items-center gap-2">
                      Try this Style 🪄
                    </div>
                  </div>
                )}
                
                {/* Coming Soon Overlay */}
                {style.isComingSoon && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="bg-white/20 backdrop-blur-md text-white font-bold px-6 py-3 rounded-full border-2 border-white/40">
                      Coming Soon 🚀
                    </div>
                  </div>
                )}
              </div>

              {/* Text Panel at Bottom - Optimized for Mobile */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/80 to-transparent z-10 flex flex-col justify-end min-h-[80px] sm:min-h-[96px]">
                <h3 className="text-sm sm:text-base md:text-lg font-bold mb-0.5 sm:mb-1 text-white drop-shadow-lg line-clamp-1">
                  {style.name}
                </h3>
                <p className="text-white/95 text-[10px] sm:text-xs leading-snug sm:leading-relaxed drop-shadow line-clamp-2">
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
