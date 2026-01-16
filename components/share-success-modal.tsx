'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RotateCw, Download as DownloadIcon, ExternalLink, Loader2, Sparkles } from 'lucide-react'

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
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-coral" />
          <DialogHeader className="flex-1">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              🎉 Share Card Ready!
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="space-y-6 mt-4">
          {/* Success Message */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <p className="text-green-800 font-semibold text-center">
              ✅ +1 Credit Added! Your artwork is now live in the gallery
            </p>
          </div>

          {/* Card Preview Section */}
          <div className="bg-white rounded-2xl p-6 border-2 border-coral/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900">
                🎬 Your Social Media Card
              </h3>
              <Button
                onClick={handleRefreshSlogan}
                disabled={isRefreshing}
                size="sm"
                variant="outline"
                className="flex items-center gap-2 border-coral/30 hover:bg-coral/10"
              >
                <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Slogan
              </Button>
            </div>

            {/* Card Image Preview */}
            <div className="relative rounded-xl overflow-hidden shadow-2xl mb-4 transition-all duration-500 ease-in-out">
              {(isRefreshing || isPolling) && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 animate-fadeIn">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-coral animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">
                      {isPolling ? 'Creating your premium card...' : 'Refreshing slogan...'}
                    </p>
                  </div>
                </div>
              )}
              
              {currentCardUrl ? (
                <img
                  src={currentCardUrl}
                  alt="Premium share card"
                  className={`w-full h-auto transition-opacity duration-500 ${(isRefreshing || isPolling) ? 'opacity-50' : 'opacity-100'}`}
                />
              ) : (
                <div className="w-full aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center px-8">
                    <Sparkles className="w-12 h-12 text-coral mx-auto mb-4 animate-pulse" />
                    <p className="text-lg font-semibold text-gray-700 mb-2">
                      Crafting Your Gallery Card
                    </p>
                    <p className="text-sm text-gray-500">
                      We're creating a premium-quality card for your masterpiece...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Slogan Display */}
            <div className="bg-gradient-to-r from-coral/5 to-orange/5 rounded-lg p-4 mb-4 border border-coral/20">
              <p className="text-center text-sm italic text-gray-700 font-medium">
                "{currentSlogan}"
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleDownload}
                disabled={!currentCardUrl || isPolling}
                className="bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download for Social
              </Button>
              <Button
                onClick={() => window.open('/en/gallery', '_blank')}
                variant="outline"
                className="border-coral/30 hover:bg-coral/10 h-12"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Go to Gallery
              </Button>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 text-center">
              💡 <strong>Pro Tip:</strong> Share this branded card on Instagram, Twitter, or Little Red Book to drive more traffic to PixPawAI.com!
            </p>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-11"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
