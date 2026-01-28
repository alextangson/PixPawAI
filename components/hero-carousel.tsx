'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CarouselImage {
  src: string
  alt: string
  style: string
}

const CAROUSEL_IMAGES: CarouselImage[] = [
  {
    src: '/hero/carousel/hero-carousel-birthday.webp',
    alt: 'Birthday Celebration - warm festive party with decorations',
    style: 'Birthday Celebration'
  },
  {
    src: '/hero/carousel/hero-carousel-christmas.webp',
    alt: 'Christmas Husky with Santa hat transformation - AI generated pet portrait',
    style: 'Merry Christmas'
  },
  {
    src: '/hero/carousel/hero-carousel-emerald.webp',
    alt: 'Emerald Muse fashion portrait - elegant cat with sage green accessories',
    style: 'Emerald Muse'
  },
  {
    src: '/hero/carousel/hero-carousel-bordeaux.webp',
    alt: 'Bordeaux Muse fashion portrait - sophisticated burgundy theme cat',
    style: 'Bordeaux Muse'
  },
  {
    src: '/hero/carousel/hero-carousel-magazine-chic.webp',
    alt: 'Magazine Chic style - fashionable pet with designer accessories',
    style: 'Magazine Chic'
  },
  {
    src: '/hero/carousel/hero-carousel-wes-anderson.webp',
    alt: 'Wes Anderson Pop Art style - symmetrical portrait with bold colors',
    style: 'Wes Anderson Pop'
  }
]

interface HeroCarouselProps {
  className?: string
  autoPlayInterval?: number  // milliseconds
}

export function HeroCarousel({
  className,
  autoPlayInterval = 2500  // 加快到 2.5 秒
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-play effect
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isPaused, autoPlayInterval])

  return (
    <div
      className={cn(
        'relative w-full aspect-[4/3] sm:aspect-[3/2] overflow-hidden rounded-2xl shadow-2xl',
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Images Stack */}
      {CAROUSEL_IMAGES.map((image, index) => (
        <div
          key={index}
          className={cn(
            'absolute inset-0 transition-opacity duration-700 ease-in-out',
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
            priority={index === 0}  // 首张图片优先加载
            fetchPriority={index === 0 ? "high" : "auto"}  // LCP 优化
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
            quality={85}
          />

          {/* Style Badge */}
          <div className="absolute top-4 right-4 bg-coral backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
            {image.style}
          </div>
        </div>
      ))}

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {CAROUSEL_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-300 touch-target',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
            aria-label={`Go to slide ${index + 1}`}
          >
            <span
              className={cn(
                'rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'w-8 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50'
              )}
            />
          </button>
        ))}
      </div>

      {/* Pause Indicator (optional) */}
      {isPaused && (
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
          Paused
        </div>
      )}
    </div>
  )
}
