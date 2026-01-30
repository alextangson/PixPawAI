'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RotateCw, Download as DownloadIcon, ExternalLink, Loader2, Sparkles, X, CheckCircle2 } from 'lucide-react'

interface ShareSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  shareCardUrl?: string
  slogan?: string
  generationId: string
  title?: string
  onSloganRefresh?: (newCardUrl: string, newSlogan: string) => void
}

export function ShareSuccessModal({
  isOpen,
  onClose,
  shareCardUrl: initialCardUrl,
  slogan: initialSlogan,
  generationId,
  title,
  onSloganRefresh
}: ShareSuccessModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentCardUrl, setCurrentCardUrl] = useState(initialCardUrl || '')
  const [currentSlogan, setCurrentSlogan] = useState(initialSlogan || '')
  const [isPolling, setIsPolling] = useState(!initialCardUrl) // Poll if no initial URL

  // Poll for share card URL if not available
  useEffect(() => {
    if (!isPolling || currentCardUrl) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/get-share-card?generation_id=${generationId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.ready && data.share_card_url) {
            setCurrentCardUrl(data.share_card_url)
            setIsPolling(false)
            console.log('✅ Share card ready:', data.share_card_url)
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 2000) // Poll every 2 seconds

    // Cleanup after 30 seconds
    const timeout = setTimeout(() => {
      setIsPolling(false)
      clearInterval(pollInterval)
    }, 30000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [isPolling, currentCardUrl, generationId])

  const handleRefreshSlogan = async () => {
    setIsRefreshing(true)
    
    try {
      const response = await fetch('/api/create-share-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generation_id: generationId,
          title: title || undefined,
        }),
      })

      const result = await response.json()

      if (response.ok && result.share_card_url) {
        setCurrentCardUrl(result.share_card_url)
        setCurrentSlogan(result.slogan)
        
        // Notify parent component
        if (onSloganRefresh) {
          onSloganRefresh(result.share_card_url, result.slogan)
        }
      }
    } catch (err) {
      console.error('Failed to refresh slogan:', err)
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 300)
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = currentCardUrl
    link.download = `pixpaw-${title || 'portrait'}-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-7xl w-full p-0 overflow-hidden bg-white rounded-3xl">
        {/* Hidden title for screen readers */}
        <DialogTitle className="sr-only">Share Card Ready</DialogTitle>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 h-auto lg:h-[85vh] max-h-[900px]">
          
          {/* Close Button (Top Right) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* LEFT PANEL: Card Preview (Dark Background) */}
          <div className="relative h-[400px] lg:h-full w-full bg-zinc-900 flex items-center justify-center p-8">
            {/* Loading Overlay */}
            {(isRefreshing || isPolling) && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-coral animate-spin mx-auto mb-3" />
                  <p className="text-white font-medium">
                    {isPolling ? 'Creating premium card...' : 'Refreshing...'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Card Image */}
            {currentCardUrl ? (
              <img
                src={currentCardUrl}
                alt="Premium share card"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <div className="text-center text-white">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-coral animate-pulse" />
                <p className="text-xl font-semibold mb-2">Crafting Your Card</p>
                <p className="text-gray-400">Premium quality, just a moment...</p>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Content & Actions */}
          <div className="relative p-10 lg:p-12 flex flex-col justify-center items-start text-left bg-white overflow-y-auto">
            
            {/* Success Badge */}
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full mb-6">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold">+1 Credit Added</span>
            </div>

            {/* Main Heading */}
            <h2 className="text-3xl lg:text-4xl font-serif text-gray-900 mb-3">
              Your Share Card<br />is Ready
            </h2>
            
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Download this premium branded card and share it on social media to drive traffic back to PixPawAI.
            </p>

            {/* Current Slogan with Refresh */}
            <div className="w-full bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-coral rounded-xl p-6 mb-8 relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-coral uppercase tracking-wide mb-2">Current Slogan</p>
                  <p className="text-gray-700 italic font-serif text-base leading-relaxed">
                    "{currentSlogan}"
                  </p>
                </div>
                <button
                  onClick={handleRefreshSlogan}
                  disabled={isRefreshing}
                  className="flex-shrink-0 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110 disabled:opacity-50"
                  title="Refresh slogan"
                >
                  <RotateCw className={`w-5 h-5 text-coral ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3">
              <Button
                onClick={handleDownload}
                disabled={!currentCardUrl || isPolling}
                className="w-full text-lg font-bold py-6 bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Download Card
              </Button>
              
              <Button
                onClick={() => window.open('/en/gallery', '_blank')}
                variant="outline"
                className="w-full py-6 border-2 hover:bg-gray-50 font-medium rounded-2xl"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                View in Gallery
              </Button>
            </div>

            {/* Pro Tip */}
            <div className="mt-8 w-full bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800 text-center">
                💡 <strong>Pro Tip:</strong> Share on Instagram, Twitter, or 小红书 to grow your audience!
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
