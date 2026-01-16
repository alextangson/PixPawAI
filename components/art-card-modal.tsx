'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RotateCw, Download, Sparkles, Loader2 } from 'lucide-react'

// 20 cinematic slogans (same as backend)
const SLOGANS = [
  "Every paw has a story.",
  "Captured forever in pixels.",
  "A moment frozen in time.",
  "Where memories become art.",
  "The look that says everything.",
  "More than just a portrait.",
  "Timeless. Priceless. Yours.",
  "From lens to legacy.",
  "Eyes that speak volumes.",
  "A masterpiece in the making.",
  "Love at first sight.",
  "The soul behind the gaze.",
  "Forever begins here.",
  "Whiskers, wonders, and all.",
  "The art of being you.",
  "Elegance in every pixel.",
  "A tale of fur and feeling.",
  "Cherished. Always.",
  "The magic of you.",
  "Life, in full color."
]

interface ArtCardModalProps {
  isOpen: boolean
  onClose: () => void
  generationId: string
  imageUrl: string
  originalTitle: string
  currentSlogan?: string
  onTitleUpdate?: (newTitle: string) => void
}

export function ArtCardModal({
  isOpen,
  onClose,
  generationId,
  imageUrl,
  originalTitle,
  currentSlogan,
  onTitleUpdate
}: ArtCardModalProps) {
  const [customTitle, setCustomTitle] = useState(originalTitle || '')
  const [selectedSlogan, setSelectedSlogan] = useState(currentSlogan || SLOGANS[0])
  const [isDownloading, setIsDownloading] = useState(false)
  const [previewDate] = useState(new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }))

  // Initialize title and slogan from props
  useEffect(() => {
    setCustomTitle(originalTitle || 'Untitled Portrait')
    setSelectedSlogan(currentSlogan || SLOGANS[0])
  }, [originalTitle, currentSlogan])

  const handleRefreshSlogan = () => {
    // Pick a random slogan different from current
    const availableSlogans = SLOGANS.filter(s => s !== selectedSlogan)
    const randomIndex = Math.floor(Math.random() * availableSlogans.length)
    setSelectedSlogan(availableSlogans[randomIndex])
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

      // Trigger download
      const link = document.createElement('a')
      link.href = data.share_card_url
      link.download = `pixpaw-${customTitle.replace(/\s+/g, '-')}-card.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

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
      <DialogContent className="sm:max-w-5xl max-h-[90vh] !p-0 overflow-hidden !block">
        {/* Modal Layout: Vertical on Mobile, Side-by-Side on Desktop */}
        <div className="flex flex-col md:flex-row min-h-[80vh] md:h-[90vh] w-full">
          
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

                {/* Footer - 3 Sections */}
                <div className="space-y-2 text-xs">
                  {/* Title & Date */}
                  <div>
                    <div className="font-bold text-gray-800 truncate" style={{ color: '#333333' }}>
                      {customTitle || 'Untitled'}
                    </div>
                    <div className="text-gray-500 text-[10px]">
                      {previewDate}
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="text-gray-600 text-[10px] font-medium">
                      PixPawAI.com
                    </div>
                  </div>

                  {/* Slogan */}
                  <div className="text-gray-600 italic text-[11px] line-clamp-2" style={{ 
                    fontFamily: 'Georgia, serif',
                    color: '#666666'
                  }}>
                    "{selectedSlogan}"
                  </div>

                  {/* Logo */}
                  <div className="flex justify-end">
                    <div className="text-coral font-bold text-[10px] tracking-wider">
                      PIXPAW AI
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Preview Note */}
              <p className="text-xs text-gray-500 text-center mt-3">
                Low-res preview. Final card will be high-resolution (2000px+).
              </p>
            </div>
          </div>

          {/* Right Panel: Controls & Actions (40% on desktop) */}
          <div className="md:w-[40%] flex flex-col p-6 bg-white overflow-y-auto max-h-[50vh] md:max-h-full">
            
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-coral" />
                <h2 className="text-xl font-bold text-gray-900">
                  Customize Your Card
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                Personalize before downloading
              </p>
            </div>

            {/* Title Input */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Artwork Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Coco's Adventure"
                maxLength={50}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral text-gray-900 bg-white transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                {customTitle.length}/50 characters
              </p>
            </div>

            {/* Slogan Selector */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cinematic Slogan
              </label>
              <div className="relative">
                <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg min-h-[60px] flex items-center">
                  <p className="text-sm text-gray-700 italic font-serif">
                    "{selectedSlogan}"
                  </p>
                </div>
                <Button
                  onClick={handleRefreshSlogan}
                  size="sm"
                  variant="outline"
                  className="absolute -top-3 -right-3 h-10 w-10 p-0 rounded-full bg-white border-2 border-coral hover:bg-coral/10 shadow-lg transition-all hover:scale-110"
                >
                  <RotateCw className="w-5 h-5 text-coral" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Click refresh to change slogan
              </p>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mb-5">
              <p className="text-xs text-blue-900 font-medium">
                💡 Title updates will sync to Dashboard & Gallery
              </p>
            </div>

            {/* Spacer - Pushes buttons to bottom */}
            <div className="flex-1 min-h-4"></div>

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
              <Button
                onClick={handleDownload}
                disabled={isDownloading || !customTitle.trim()}
                className="w-full h-12 bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold rounded-lg shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                className="w-full h-11 border-2 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
