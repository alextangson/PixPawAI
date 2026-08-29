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
import { type Locale } from '@/lib/i18n-config'

// Dynamic import UploadModalWizard to keep the initial JS bundle smaller.
// ssr:false is fine here — the modal is not crawlable content.
const UploadModalWizard = dynamic(
  () => import('@/components/upload-modal-wizard').then(mod => ({ default: mod.UploadModalWizard })),
  { ssr: false }
)

export function HomeClient({
  dict,
  lang,
}: {
  dict: any
  lang: Locale
}) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)

  // Listen for hash changes; #upload opens the modal
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#upload') {
        setIsUploadModalOpen(true)
        window.history.replaceState(null, '', window.location.pathname)
      }
    }

    handleHashChange()

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Check for saved configuration after login redirect
  useEffect(() => {
    const hasUploadHash = window.location.hash === '#upload'

    if (hasUploadHash) {
      window.history.replaceState(null, '', window.location.pathname)

      const savedConfig = localStorage.getItem('pixpaw_pending_generation')

      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          const age = Date.now() - config.timestamp

          if (age < 10 * 60 * 1000) {
            if (config.selectedStyle) {
              setSelectedStyle(config.selectedStyle)
            }
            setIsUploadModalOpen(true)
          } else {
            localStorage.removeItem('pixpaw_pending_generation')
            setIsUploadModalOpen(true)
          }
        } catch {
          localStorage.removeItem('pixpaw_pending_generation')
          setIsUploadModalOpen(true)
        }
      } else {
        setIsUploadModalOpen(true)
      }
    } else {
      const savedConfig = localStorage.getItem('pixpaw_pending_generation')
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          const age = Date.now() - config.timestamp
          if (age >= 10 * 60 * 1000) {
            localStorage.removeItem('pixpaw_pending_generation')
          }
        } catch {
          localStorage.removeItem('pixpaw_pending_generation')
        }
      }
    }
  }, [])

  const handleOpenUpload = (styleName?: string) => {
    setSelectedStyle(styleName || null)
    setIsUploadModalOpen(true)
  }

  return (
    <main className="min-h-screen">
      <HeroSection dict={dict} onOpenUpload={() => handleOpenUpload()} lang={lang} />
      <HowItWorks dict={dict} onOpenUpload={() => handleOpenUpload()} />
      <StyleShowcase dict={dict} onOpenUpload={handleOpenUpload} lang={lang} />
      <MerchShowcase dict={dict} />
      <WallOfLove dict={dict} lang={lang} />
      <FAQSection dict={dict} />
      <FinalCta dict={dict} lang={lang} onOpenUpload={() => handleOpenUpload()} />

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
