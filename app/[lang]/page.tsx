'use client';

import { useState, useEffect } from 'react'
import { HeroSection } from '@/components/hero-section'
import { HowItWorks } from '@/components/how-it-works'
import { StyleShowcase } from '@/components/style-showcase'
import { MerchShowcase } from '@/components/merch-showcase'
import { WallOfLove } from '@/components/wall-of-love'
import { FAQSection } from '@/components/faq-section'
import { FinalCta } from '@/components/final-cta'
import { UploadModalWizard } from '@/components/upload-modal-wizard'
import { type Locale } from '@/lib/i18n-config'
import { getDictionary } from '@/lib/dictionary'
import { useParams } from 'next/navigation'

export default function Home() {
  const params = useParams()
  const lang = (params?.lang as Locale) || 'en'
  
  const [dict, setDict] = useState<any>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)

  useEffect(() => {
    getDictionary(lang).then(setDict)
  }, [lang])

  // 监听 hash 变化，如果是 #upload 则打开 Modal
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#upload') {
        setIsUploadModalOpen(true)
        // 清除 hash，避免刷新页面时自动打开
        window.history.replaceState(null, '', window.location.pathname)
      }
    }

    // 初始检查
    handleHashChange()

    // 监听 hash 变化
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

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
      
      {/* Upload Modal Wizard */}
      <UploadModalWizard
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false)
          setSelectedStyle(null)
        }}
        selectedStyle={selectedStyle}
      />
    </main>
  )
}
