import React from 'react'
import { Button } from '@/components/ui/button'
import { BeforeAfterSlider } from '@/components/before-after-slider'
import { InfiniteMarquee } from '@/components/infinite-marquee'
import { TrustBadgeGroup } from '@/components/trust-badges'
import { Sparkles, ArrowRight, PawPrint } from 'lucide-react'

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
}

export function HeroSection({ dict }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background Pattern - Subtle paw prints */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FF8C42' fill-opacity='1'%3E%3Cpath d='M30 20c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-10 5c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3zm20 0c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3zm-15-5c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3zm10 0c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-10 w-96 h-96 bg-coral/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-10 w-[500px] h-[500px] bg-orange-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-amber-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Hero Content */}
      <div className="relative flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left space-y-6 md:space-y-8 z-10">
              {/* Social Proof - With Avatar Stack */}
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 rounded-full px-3 py-1 text-sm font-medium">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    🐕
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    🐈
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-coral to-orange-700 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    🐾
                  </div>
                </div>
                <span>{dict.hero.socialProof}</span>
              </div>

              {/* Main Headline (H1) - Improved Typography */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight max-w-4xl mx-auto lg:mx-0">
                {dict.hero.title.part1}
                <br />
                <span className="text-coral relative inline-block">
                  {dict.hero.title.part2}
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    height="12"
                    viewBox="0 0 200 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 10C50 3 150 3 198 10"
                      stroke="#FF8C42"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl md:text-2xl text-darkgray/70 max-w-xl mx-auto lg:mx-0">
                {dict.hero.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Button size="xl" className="group">
                  {dict.hero.cta.primary}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="xl" variant="outline" className="group">
                  <PawPrint className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {dict.hero.cta.secondary}
                </Button>
              </div>

              {/* Trust Badges - Refactored to Simple Icons + Text */}
              <TrustBadgeGroup className="justify-center lg:justify-start pt-2" />
            </div>

            {/* Right Column - Before/After Slider (Clean Focus) */}
            <div className="relative z-10">
              {/* Floating AI Badge */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2 z-10 animate-pulse">
                <Sparkles className="w-5 h-5 text-coral" />
                <span className="text-sm font-semibold text-darkgray">{dict.hero.badges.aiPowered}</span>
              </div>

              {/* Before/After Slider - Sole Visual Element */}
              <div className="relative">
                <BeforeAfterSlider
                  beforeImage="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop"
                  afterImage="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop"
                  beforeAlt={dict.hero.slider.beforeAlt}
                  afterAlt={dict.hero.slider.afterAlt}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Infinite Marquee at bottom */}
      <InfiniteMarquee className="relative z-10 mt-auto" />
    </section>
  )
}
