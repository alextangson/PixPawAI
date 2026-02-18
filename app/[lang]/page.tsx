'use client';

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { HeroSection } from '@/components/hero-section'
import { HowItWorks } from '@/components/how-it-works'
import { StyleShowcase } from '@/components/style-showcase'
import { MerchShowcase } from '@/components/merch-showcase'
import { WallOfLove } from '@/components/wall-of-love'
import { FAQSection } from '@/components/faq-section'
import { FinalCta } from '@/components/final-cta'
import { HomeSchema } from '@/components/home-schema'
import { type Locale } from '@/lib/i18n-config'
import { getDictionary } from '@/lib/dictionary'
import { useParams } from 'next/navigation'

// 动态导入 UploadModalWizard，减少初始 JS 包大小
const UploadModalWizard = dynamic(
  () => import('@/components/upload-modal-wizard').then(mod => ({ default: mod.UploadModalWizard })),
  { ssr: false }
)

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

  // Check for saved configuration after login redirect
  useEffect(() => {
    // Check if we're returning from OAuth login (has #upload hash)
    const hasUploadHash = window.location.hash === '#upload'
    
    if (hasUploadHash) {
      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname)
      
      // Try to restore saved configuration
      const savedConfig = localStorage.getItem('pixpaw_pending_generation')
      
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          const age = Date.now() - config.timestamp
          
          // Only restore if saved within last 10 minutes
          if (age < 10 * 60 * 1000) {
            console.log('[HomePage] Restoring saved configuration after login')
            // Restore selected style if available
            if (config.selectedStyle) {
              setSelectedStyle(config.selectedStyle)
            }
            // Open the modal
            setIsUploadModalOpen(true)
          } else {
            // Config expired, clear it and just open empty modal
            localStorage.removeItem('pixpaw_pending_generation')
            setIsUploadModalOpen(true)
          }
        } catch (error) {
          console.error('[HomePage] Failed to parse saved config:', error)
          localStorage.removeItem('pixpaw_pending_generation')
          setIsUploadModalOpen(true)
        }
      } else {
        // No saved config, just open modal
        setIsUploadModalOpen(true)
      }
    } else {
      // Regular page load - clean up any expired configs but don't auto-open
      const savedConfig = localStorage.getItem('pixpaw_pending_generation')
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          const age = Date.now() - config.timestamp
          
          // Clean up expired configs
          if (age >= 10 * 60 * 1000) {
            localStorage.removeItem('pixpaw_pending_generation')
          }
        } catch (error) {
          localStorage.removeItem('pixpaw_pending_generation')
        }
      }
    }
  }, [])

  const handleOpenUpload = (styleName?: string) => {
    setSelectedStyle(styleName || null)
    setIsUploadModalOpen(true)
  }

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-coral border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-base text-gray-600 font-medium">Loading amazing pet portraits...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Structured Data for SEO */}
      <HomeSchema 
        lang={lang}
        faqs={dict.faq?.items?.map((item: any) => ({
          question: item.question,
          answer: item.answer
        }))}
      />
      
      {/* Hero Section */}
      <HeroSection dict={dict} onOpenUpload={() => handleOpenUpload()} lang={lang} />
      
      {/* How It Works Section */}
      <HowItWorks dict={dict} onOpenUpload={() => handleOpenUpload()} />
      
      {/* Styles & Possibilities Section */}
      <StyleShowcase dict={dict} onOpenUpload={handleOpenUpload} lang={lang} />
      
      {/* Merch Showcase Section */}
      <MerchShowcase dict={dict} />
      
      {/* Wall of Love (Testimonials) */}
      <WallOfLove dict={dict} lang={lang} />
      
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
