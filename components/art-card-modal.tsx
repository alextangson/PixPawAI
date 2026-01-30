'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RotateCw, Download, Sparkles, Loader2, Facebook, Share2, Copy, Check, Twitter } from 'lucide-react'
import { PREMIUM_SLOGANS } from '@/lib/constants/slogans'
import { BRANDING } from '@/lib/constants/branding'

interface ArtCardModalProps {
  isOpen: boolean
  onClose: () => void
  generationId: string
  imageUrl: string
  originalTitle: string
  currentSlogan?: string
  onTitleUpdate?: (newTitle: string) => void
  petName?: string
  artCardTitle?: string
}

export function ArtCardModal({
  isOpen,
  onClose,
  generationId,
  imageUrl,
  originalTitle,
  currentSlogan,
  onTitleUpdate,
  petName,
  artCardTitle
}: ArtCardModalProps) {
  const [customTitle, setCustomTitle] = useState(originalTitle || '')
  const [selectedSlogan, setSelectedSlogan] = useState(() => {
    if (currentSlogan) return currentSlogan
    const randomIndex = Math.floor(Math.random() * PREMIUM_SLOGANS.length)
    return PREMIUM_SLOGANS[randomIndex]
  })
  const [isDownloading, setIsDownloading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [previewDate] = useState(new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }))

  // Initialize title and slogan from props
  useEffect(() => {
    const title = artCardTitle || (petName ? `${petName} - Portrait` : originalTitle || 'My Pet Portrait')
    setCustomTitle(title)
    // Only override random slogan if currentSlogan is explicitly provided
    if (currentSlogan) {
      setSelectedSlogan(currentSlogan)
    }
  }, [petName, artCardTitle, originalTitle, currentSlogan])

  const handleRefreshSlogan = () => {
    // Pick a random slogan different from current
    const availableSlogans = PREMIUM_SLOGANS.filter(s => s !== selectedSlogan)
    const randomIndex = Math.floor(Math.random() * availableSlogans.length)
    setSelectedSlogan(availableSlogans[randomIndex])
  }

  // Social sharing handlers
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/gallery/${generationId}` : ''
  const shareText = `Check out my pet's PixPaw portrait: ${customTitle}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    )
  }

  const handleShareX = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    )
  }

  const handleSharePinterest = () => {
    window.open(
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=750,height=550'
    )
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Call API with custom title and slogan
      const response = await fetch('/api/create-share-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generation_id: generationId,
          custom_title: customTitle,
          custom_slogan: selectedSlogan
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate card')
      }

      const data = await response.json()
      
      // Update parent component with new title
      if (onTitleUpdate && customTitle !== originalTitle) {
        onTitleUpdate(customTitle)
      }

      // Trigger download using Blob to avoid opening in new tab
      try {
        // Fetch the image as blob
        const imageResponse = await fetch(data.share_card_url)
        const blob = await imageResponse.blob()
        
        // Create blob URL
        const blobUrl = URL.createObjectURL(blob)
        
        // Trigger download
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `pixpaw-${customTitle.replace(/\s+/g, '-')}-card.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
      } catch (downloadError) {
        console.error('Blob download failed, falling back to direct link:', downloadError)
        // Fallback: open in new tab if blob download fails
        window.open(data.share_card_url, '_blank')
      }

      // Show success and close
      setTimeout(() => {
        onClose()
      }, 500)

    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to generate card. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-[95vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-auto max-h-[90vh] !p-0 overflow-y-auto !block !z-[100]">
        {/* Hidden title for screen readers */}
        <DialogTitle className="sr-only">Customize Your Art Card</DialogTitle>
        
        {/* Modal Layout: Vertical on Mobile, Side-by-Side on Desktop */}
        <div className="flex flex-col md:flex-row w-full">
          
          {/* Left Panel: Preview Area - Full height on mobile */}
          <div className="md:w-1/2 lg:w-[55%] xl:w-3/5 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-6 md:p-6 lg:p-8 relative min-h-[400px] md:min-h-[600px]">
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-lg">
              {/* Simulated Card with CSS */}
              <div className="bg-white p-3 sm:p-4 md:p-6 lg:p-8 rounded-xl shadow-2xl">
                {/* Image */}
                <div className="relative aspect-square mb-4 overflow-hidden rounded">
                  <img
                    src={imageUrl}
                    alt={customTitle}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Footer - Redesigned Layout */}
                <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5">
                  {/* Title & Date */}
                  <div>
                    <div className="font-bold text-gray-900 truncate text-xs sm:text-sm md:text-base">
                      {customTitle || 'Untitled'}
                    </div>
                    <div className="text-gray-500 text-[9px] sm:text-[10px] mt-0.5">
                      {previewDate}
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-gray-200"></div>

                  {/* Slogan - Georgia Italic (matches downloaded card exactly) */}
                  <div className="text-gray-700 text-sm sm:text-base md:text-lg lg:text-xl leading-snug sm:leading-relaxed italic min-h-[2rem] sm:min-h-[2.5rem] md:min-h-[3rem] flex items-center justify-center text-center px-1" style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>
                    {selectedSlogan}
                  </div>

                  {/* Separator */}
                  <div className="border-t border-gray-200"></div>

                  {/* Logo + URL in Bottom Right (Stacked) */}
                  <div className="flex flex-col items-end gap-0.5 sm:gap-1">
                    <img 
                      src={BRANDING.logos.svg.color} 
                      alt="PixPaw AI"
                      className="h-8 sm:h-10 md:h-12 opacity-90"
                    />
                    <span className="text-gray-600 text-[10px] sm:text-xs font-medium">
                      PixPawAI.com
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Controls & Actions */}
          <div className="md:w-1/2 lg:w-[45%] xl:w-2/5 bg-white p-4 sm:p-6 md:p-6 lg:p-8 flex-shrink-0">
            
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">
                Customize Your Art Card
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Personalize before downloading
              </p>
            </div>

            {/* Title Input */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                Artwork Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Coco's Adventure"
                maxLength={50}
                className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral text-gray-900 bg-white transition-all"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                {customTitle.length}/50 characters
              </p>
            </div>

            {/* Slogan Selector */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                Cinematic Slogan
              </label>
              <div className="relative">
                <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg min-h-[60px] flex items-center">
                  <p className="text-base text-gray-700 italic font-serif leading-relaxed">
                    {selectedSlogan}
                  </p>
                </div>
                <Button
                  onClick={handleRefreshSlogan}
                  size="sm"
                  variant="outline"
                  className="absolute -top-2 -right-2 h-8 w-8 p-0 rounded-full bg-white border-2 border-coral hover:bg-coral/10 shadow-lg transition-all hover:scale-110"
                >
                  <RotateCw className="w-4 h-4 text-coral" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Click refresh to change slogan
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
              <Button
                onClick={handleDownload}
                disabled={isDownloading || !customTitle.trim()}
                className="w-full h-12 text-base bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold rounded-lg shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Card...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Social Card
                  </>
                )}
              </Button>
              <Button
                onClick={onClose}
                disabled={isDownloading}
                variant="outline"
                className="w-full h-11 text-base border-2 hover:bg-gray-50 font-medium"
              >
                Cancel
              </Button>
            </div>

            {/* Social Share Section */}
            <div className="text-center pt-5 sm:pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="group p-2.5 sm:p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Copy Link"
                >
                  {isCopied ? (
                    <Check className="w-6 h-6 text-green-600" />
                  ) : (
                    <Copy className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
                  )}
                </button>

                {/* Facebook */}
                <button
                  onClick={handleShareFacebook}
                  className="group p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Share on Facebook"
                >
                  <Facebook className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                </button>

                {/* X (Twitter) */}
                <button
                  onClick={handleShareX}
                  className="group p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Share on X"
                >
                  <Twitter className="w-6 h-6 text-gray-600 group-hover:text-sky-600" />
                </button>

                {/* Pinterest */}
                <button
                  onClick={handleSharePinterest}
                  className="group p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Share on Pinterest"
                >
                  <Share2 className="w-6 h-6 text-gray-600 group-hover:text-red-600" />
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-700">
                Share Your PixPaw Star
              </p>
              {isCopied && (
                <p className="text-xs text-green-600 mt-1 animate-in fade-in">
                  Link copied to clipboard!
                </p>
              )}
            </div>
          
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
