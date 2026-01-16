'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download, Share2, Trash2, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ShareSuccessModal } from '@/components/share-success-modal'
import confetti from 'canvas-confetti'

interface GalleryTabProps {
  generations: any[]
  onGenerationsUpdate?: () => void
}

export function GalleryTab({ generations, onGenerationsUpdate }: GalleryTabProps) {
  const succeededGenerations = generations.filter(g => g.status === 'succeeded')
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedGeneration, setSelectedGeneration] = useState<any>(null)
  const [shareTitle, setShareTitle] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState('')
  
  // Success Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successShareCardUrl, setSuccessShareCardUrl] = useState('')
  const [successSlogan, setSuccessSlogan] = useState('')
  const [successGenerationId, setSuccessGenerationId] = useState('')

  const handleShareClick = (generation: any) => {
    setSelectedGeneration(generation)
    setShareTitle(generation.title || '')
    setShareError('')
    setShareDialogOpen(true)
  }

  const handleShareConfirm = async () => {
    if (!selectedGeneration) return
    
    setIsSharing(true)
    setShareError('')

    try {
      // Call the unified share API (it now generates the card automatically)
      const shareResponse = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generation_id: selectedGeneration.id,
          title: shareTitle.trim() || undefined,
        }),
      })

      const shareResult = await shareResponse.json()

      if (!shareResponse.ok) {
        throw new Error(shareResult.error || 'Failed to share')
      }

      // Success! Show confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      })

      // Close the input dialog
      setShareDialogOpen(false)

      // Show the Success Modal with the share card
      if (shareResult.share_card_url && shareResult.slogan) {
        setSuccessShareCardUrl(shareResult.share_card_url)
        setSuccessSlogan(shareResult.slogan)
        setSuccessGenerationId(selectedGeneration.id)
        setShowSuccessModal(true)
      }

      // Update local state
      selectedGeneration.is_public = true
      selectedGeneration.is_rewarded = true
      selectedGeneration.share_card_url = shareResult.share_card_url
      
      // Refresh data
      if (onGenerationsUpdate) {
        onGenerationsUpdate()
      }

      // Reset input fields
      setSelectedGeneration(null)
      setShareTitle('')

    } catch (err: any) {
      console.error('Share error:', err)
      setShareError(err.message || 'Failed to share')
    } finally {
      setIsSharing(false)
    }
  }

  if (succeededGenerations.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg mb-4">
          You haven't created any portraits yet.
        </p>
        <Button
          onClick={() => window.location.href = '/en'}
          className="bg-coral hover:bg-orange-600 text-white"
        >
          Create Your First Portrait
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Share Success Modal */}
      {showSuccessModal && (
        <ShareSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          shareCardUrl={successShareCardUrl}
          slogan={successSlogan}
          generationId={successGenerationId}
          title={shareTitle}
          onSloganRefresh={(newUrl, newSlogan) => {
            setSuccessShareCardUrl(newUrl)
            setSuccessSlogan(newSlogan)
          }}
        />
      )}

      {/* Share Confirmation Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-coral/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-coral/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Share2 className="w-6 h-6 text-coral" />
            </div>
            <div className="flex-1">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Share to Gallery
                </DialogTitle>
                <div className="text-sm font-semibold text-coral mt-1">Earn +1 Credit</div>
                <DialogDescription className="text-gray-700 mt-2 text-base">
                  🎉 Share your masterpiece with the community and unlock a <strong>premium branded social media card</strong>!
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
          
          <div className="space-y-5 mt-6">
            {/* Title Input */}
            <div className="bg-white rounded-xl p-4 border-2 border-coral/20 shadow-sm">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                📝 Add a title (optional)
              </label>
              <input
                type="text"
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
                placeholder="e.g., My Golden Retriever as a Pixar Star"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral text-gray-900 bg-white text-base"
                maxLength={100}
                disabled={isSharing}
              />
              <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                <span>💡</span> This helps others discover your artwork in the gallery
              </p>
            </div>

            {/* Error Message */}
            {shareError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 font-medium">{shareError}</p>
              </div>
            )}

            {/* Benefits Preview */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-coral/30">
              <p className="text-sm font-semibold text-gray-800 mb-2">✨ What you'll get:</p>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> +1 Credit added to your account
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Premium Leica-style branded card
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Featured in public gallery
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Customizable slogan (20 options)
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleShareConfirm}
                disabled={isSharing}
                className="flex-1 bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold h-12 text-base shadow-lg hover:shadow-xl transition-all"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating your card...
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5 mr-2" />
                    Share & Unlock Card
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShareDialogOpen(false)}
                disabled={isSharing}
                variant="outline"
                className="px-8 h-12 border-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {succeededGenerations.map((generation) => (
        <div
          key={generation.id}
          className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="relative aspect-square">
            <Image
              src={generation.output_url}
              alt={generation.title || 'Generated portrait'}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500" suppressHydrationWarning>
                {new Date(generation.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              {generation.is_public && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Shared
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {generation.title || generation.prompt?.substring(0, 100)}
            </p>

            <div className="flex gap-2">
              {/* Download Options */}
              {generation.is_public && generation.share_card_url ? (
                <div className="flex-1 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(generation.output_url, '_blank')}
                    title="Download original image"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Original
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-coral/10 border-coral/30 hover:bg-coral/20"
                    onClick={() => window.open(generation.share_card_url, '_blank')}
                    title="Download social media card"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Social
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(generation.output_url, '_blank')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              )}
              
              {/* Share Button (only for unshared) */}
              {!generation.is_public && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-coral/30 hover:bg-coral/10"
                  onClick={() => handleShareClick(generation)}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
      </div>
    </>
  )
}
