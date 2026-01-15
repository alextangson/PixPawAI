'use client';

import { useState, useEffect } from 'react'
import { HeroSection } from '@/components/hero-section'
import { HowItWorks } from '@/components/how-it-works'
import { StyleShowcase } from '@/components/style-showcase'
import { MerchShowcase } from '@/components/merch-showcase'
import { WallOfLove } from '@/components/wall-of-love'
import { FAQSection } from '@/components/faq-section'
import { FinalCta } from '@/components/final-cta'
import { UploadModal } from '@/components/upload-modal'
import { type Locale } from '@/lib/i18n-config'
import { getDictionary } from '@/lib/dictionary'

export default function Home({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const [lang, setLang] = useState<Locale>('en')
  const [dict, setDict] = useState<any>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)

  useEffect(() => {
    params.then(({ lang: resolvedLang }) => {
      setLang(resolvedLang)
      getDictionary(resolvedLang).then(setDict)
    })
  }, [params])

  const handleOpenUpload = (styleName?: string) => {
    setSelectedStyle(styleName || null)
    setIsUploadModalOpen(true)
  }

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-coral border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection dict={dict} onOpenUpload={() => handleOpenUpload()} />
      
      {/* How It Works Section */}
      <HowItWorks dict={dict} onOpenUpload={() => handleOpenUpload()} />
      
      {/* Styles & Possibilities Section */}
      <StyleShowcase dict={dict} onOpenUpload={handleOpenUpload} lang={lang} />
      
      {/* Merch Showcase Section */}
      <MerchShowcase dict={dict} />
      
      {/* Wall of Love (Testimonials) */}
      <WallOfLove dict={dict} />
      
      {/* FAQ Section */}
      <FAQSection dict={dict} />
      
      {/* Final Call to Action */}
      <FinalCta dict={dict} lang={lang} onOpenUpload={() => handleOpenUpload()} />
      
      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false)
          setSelectedStyle(null)
        }}
        dict={dict}
        selectedStyle={selectedStyle}
      />
    </main>
  )
}
