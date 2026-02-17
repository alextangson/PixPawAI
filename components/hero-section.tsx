import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroCarousel } from '@/components/hero-carousel'
import { InfiniteMarquee } from '@/components/infinite-marquee'
import { TrustBadgeGroup } from '@/components/trust-badges'
import { PawIcon } from '@/components/ui/paw-icon'
import { Sparkles, ArrowRight } from 'lucide-react'

interface HeroSectionProps {
  dict: {
    hero: {
      badge: string
      title: {
        part1: string
        part2: string
      }
      subtitle: string
      cta: {
        primary: string
        secondary: string
      }
      socialProof: string
      badges: {
        aiPowered: string
        readyIn: string
      }
      slider: {
        before: string
        after: string
        beforeAlt: string
        afterAlt: string
      }
    }
  }
  onOpenUpload: () => void
  lang?: string
}

export function HeroSection({ dict, onOpenUpload, lang = 'en' }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden pt-4 sm:pt-8 lg:pt-16">
      {/* Background Pattern - Brand paw prints */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url('/brand/paw-orange.svg')`,
          backgroundSize: '60px 60px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-10 w-96 h-96 bg-coral/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-10 w-[500px] h-[500px] bg-orange-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-amber-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Hero Content */}
      <div className="relative flex-1 flex items-center justify-center px-4 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 z-10 order-2 lg:order-1">
              {/* Social Proof - With Avatar Stack */}
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 rounded-full px-3 py-1 text-xs sm:text-sm font-medium">
                <div className="flex -space-x-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    🐕
                  </div>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    🐈
                  </div>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-coral to-orange-700 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    🐾
                  </div>
                </div>
                <span>{dict.hero.socialProof}</span>
              </div>

              {/* Main Headline (H1) - Responsive Typography */}
              <h1 className="text-3xl xs:text-4xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold tracking-tight leading-[1.1] sm:leading-tight max-w-5xl mx-auto lg:mx-0">
                <span className="md:whitespace-nowrap">{dict.hero.title.part1}</span>{' '}
                <br className="hidden md:block" />
                <span className="text-coral relative inline-block whitespace-nowrap">
                  {dict.hero.title.part2}
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3"
                    viewBox="0 0 100 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 10C25 3 75 3 98 10"
                      stroke="#FF8C42"
                      strokeWidth="3"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl text-darkgray/70 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {dict.hero.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-5 justify-center lg:justify-start max-w-full sm:max-w-md lg:max-w-none">
                <Button size="xl" className="group w-full sm:w-auto" onClick={onOpenUpload}>
                  {dict.hero.cta.primary}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Link href={`/${lang}/gallery`} className="w-full sm:w-auto">
                  <Button size="xl" variant="outline" className="group w-full">
                    <PawIcon size={20} className="group-hover:scale-110 transition-transform" />
                    {dict.hero.cta.secondary}
                  </Button>
                </Link>
              </div>

              {/* Trust Badges - Refactored to Simple Icons + Text */}
              <TrustBadgeGroup className="justify-center lg:justify-start pt-0 sm:pt-2 hidden sm:flex" />
            </div>

            {/* Right Column - Hero Carousel with PiP */}
            <div className="relative z-10 order-1 lg:order-2">
              {/* Auto-playing Carousel with Picture-in-Picture */}
              <HeroCarousel />
            </div>
          </div>
        </div>
      </div>

      {/* Infinite Marquee at bottom */}
      <InfiniteMarquee className="relative z-10 mt-auto" />
    </section>
  )
}
