'use client';

import { Button } from '@/components/ui/button';
import { PawIcon } from '@/components/ui/paw-icon';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface WallOfLoveProps {
  dict: {
    testimonials: {
      title: string;
      subtitle?: string;
      cta?: string;
    };
  };
  lang?: string;
}

export function WallOfLove({ dict, lang = 'en' }: WallOfLoveProps) {
  return (
    <section className="py-10 sm:py-12 md:py-14 lg:py-16 xl:py-18 2xl:py-20 bg-cream">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Try It Free CTA */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold mb-3 sm:mb-4">
            {dict.testimonials.title}
          </h2>
          {dict.testimonials.subtitle && (
            <p className="text-lg text-gray-600 mb-6 max-w-xl mx-auto">
              {dict.testimonials.subtitle}
            </p>
          )}
          {dict.testimonials.cta && (
            <Link href={`/${lang}/gallery`}>
              <Button size="xl" className="group">
                {dict.testimonials.cta}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
