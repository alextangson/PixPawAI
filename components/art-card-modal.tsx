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
        link.download = `pixpaw-${customTitle.replace(/\s+/g, '-')}-card.jpg`
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
      <DialogContent className="sm:max-w-6xl h-[70vh] !p-0 overflow-hidden !block">
        {/* Hidden title for screen readers */}
        <DialogTitle className="sr-only">Customize Your Art Card</DialogTitle>
        
        {/* Modal Layout: Vertical on Mobile, Side-by-Side on Desktop */}
        <div className="flex flex-col md:flex-row h-full w-full">
          
          {/* Left Panel: Preview Area (60% on desktop) */}
          <div className="md:w-[60%] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 relative min-h-[40vh] md:min-h-full">
            <div className="w-full max-w-md">
              {/* Simulated Card with CSS */}
              <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
                {/* Image */}
                <div className="relative aspect-square mb-4 overflow-hidden rounded">
                  <img
                    src={imageUrl}
                    alt={customTitle}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Footer - Redesigned Layout */}
                <div className="space-y-3">
                  {/* Title & Date */}
                  <div>
                    <div className="font-bold text-gray-900 truncate text-sm">
                      {customTitle || 'Untitled'}
                    </div>
                    <div className="text-gray-500 text-[10px] mt-0.5">
                      {previewDate}
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-gray-200"></div>

                  {/* Slogan - Larger and More Artistic with Caveat */}
                  <div className="text-gray-700 italic text-xl leading-relaxed font-caveat min-h-[3rem] flex items-center justify-center text-center">
                    "{selectedSlogan}"
                  </div>

                  {/* Separator */}
                  <div className="border-t border-gray-200"></div>

                  {/* Logo + URL in Bottom Right (Stacked) */}
                  <div className="flex flex-col items-end gap-1">
                    <img 
                      src={BRANDING.logos.svg.color} 
                      alt="PixPaw AI"
                      className="h-12 opacity-90"
                    />
                    <span className="text-gray-600 text-xs font-medium">
                      PixPawAI.com
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Controls & Actions (40% on desktop) */}
          <div className="md:w-[40%] bg-white h-full grid grid-rows-[1fr_auto_1fr] overflow-y-auto">
            <div></div> {/* Top spacer for vertical centering */}
            <div className="p-6">
            
              {/* Header - Compressed */}
              <div className="mb-3">
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  Customize Your Art Card
              </h2>
                <p className="text-xs text-gray-600">
                Personalize before downloading
              </p>
            </div>

            {/* Title Input - Compressed */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Artwork Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Coco's Adventure"
                maxLength={50}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral text-gray-900 bg-white transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                {customTitle.length}/50 characters
              </p>
            </div>

            {/* Slogan Selector - Compressed */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Cinematic Slogan
              </label>
              <div className="relative">
                <div className="p-3 bg-gray-50 border-2 border-gray-200 rounded-lg min-h-[50px] flex items-center">
                  <p className="text-sm text-gray-700 italic font-serif">
                    "{selectedSlogan}"
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
              <p className="text-xs text-gray-500 mt-1">
                Click refresh to change slogan
              </p>
            </div>

            {/* Social Share Icons */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Share Your Creation
              </label>
              <div className="flex items-center gap-3">
                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="group p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Copy Link"
                >
                  {isCopied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                  )}
                </button>

                {/* Facebook */}
                <button
                  onClick={handleShareFacebook}
                  className="group p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Share on Facebook"
                >
                  <Facebook className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                </button>

                {/* X (Twitter) */}
                <button
                  onClick={handleShareX}
                  className="group p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Share on X"
                >
                  <Twitter className="w-5 h-5 text-gray-600 group-hover:text-sky-600" />
                </button>

                {/* Pinterest */}
                <button
                  onClick={handleSharePinterest}
                  className="group p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Share on Pinterest"
                >
                  <Share2 className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                </button>
              </div>
              {isCopied && (
                <p className="text-xs text-green-600 mt-1.5 animate-in fade-in">
                  Link copied to clipboard!
                </p>
              )}
            </div>

            {/* Action Buttons - Compressed */}
            <div className="space-y-2 mt-4">
              <Button
                onClick={handleDownload}
                disabled={isDownloading || !customTitle.trim()}
                className="w-full h-10 text-sm bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold rounded-lg shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Card...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Social Card
                  </>
                )}
              </Button>
              <Button
                onClick={onClose}
                disabled={isDownloading}
                variant="outline"
                className="w-full h-9 text-sm border-2 hover:bg-gray-50 font-medium"
              >
                Cancel
              </Button>
            </div>
            
            </div> {/* Close content container */}
            <div></div> {/* Bottom spacer for vertical centering */}
          </div> {/* Close outer right panel container */}
        </div>
      </DialogContent>
    </Dialog>
  )
}
