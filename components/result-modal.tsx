'use client'

import { useState, useMemo } from 'react'
import { X, Download, Sparkles, ShoppingBag, CheckCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArtCardModal } from '@/components/art-card-modal'
import { ShareSuccessModal } from '@/components/share-success-modal'
import { ShopFakeDoorDialog } from '@/components/shop-fake-door-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ✨ Magical placeholder suggestions for naming PixPaw Stars
const PIXPAW_NAME_SUGGESTIONS = [
  "Luna the Starlight Princess",
  "Max the Adventure Hero",
  "Bella the Enchanted Queen",
  "Charlie the Cosmic Explorer",
  "Milo the Dreamweaver",
  "Ruby the Radiant Star",
  "Cooper the Brave Knight",
  "Daisy the Magical Sprite",
  "Oliver the Wonder Pup",
  "Zoe the Celestial Dancer"
]

interface ResultModalProps {
  isOpen: boolean
  onClose: () => void
  generatedImageUrl: string
  generationId: string
  remainingCredits: number | null
  isRewarded?: boolean
  onShareSuccess?: () => void
}

export function ResultModal({
  isOpen,
  onClose,
  generatedImageUrl,
  generationId,
  remainingCredits,
  isRewarded = false,
  onShareSuccess
}: ResultModalProps) {
  // Share states
  const [isSharing, setIsSharing] = useState(false)
  const [isShared, setIsShared] = useState(isRewarded)
  const [shareTitle, setShareTitle] = useState('')
  const [showShareInput, setShowShareInput] = useState(false)
  
  // Art Card Modal
  const [artCardModalOpen, setArtCardModalOpen] = useState(false)
  
  // Share Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successShareCardUrl, setSuccessShareCardUrl] = useState('')
  const [successSlogan, setSuccessSlogan] = useState('')
  
  // Shop Fake Door Dialog
  const [shopFakeDoorOpen, setShopFakeDoorOpen] = useState(false)

  // ✨ Random placeholder for naming (stable per render)
  const randomPlaceholder = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * PIXPAW_NAME_SUGGESTIONS.length)
    return `e.g., ${PIXPAW_NAME_SUGGESTIONS[randomIndex]}`
  }, [generationId]) // Change placeholder when generationId changes

  if (!isOpen) return null

  const handleShopClick = () => {
    // Log fake door interaction
    console.log('🚪 FakeDoor_Shop_Clicked', {
      source: 'ResultModal',
      generationId,
      timestamp: new Date().toISOString()
    })
    setShopFakeDoorOpen(true)
  }

  const handleShareClick = () => {
    setShowShareInput(true)
  }

  const handleShareConfirm = async () => {
    if (!generationId) return
    
    setIsSharing(true)

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generation_id: generationId,
          title: shareTitle.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to share')
      }

      // Update state
      setIsShared(true)
      setShowShareInput(false)

      // Show success modal with share card
      if (result.share_card_url && result.slogan) {
        setSuccessShareCardUrl(result.share_card_url)
        setSuccessSlogan(result.slogan)
        setShowSuccessModal(true)
      }

      // Notify parent
      if (onShareSuccess) {
        onShareSuccess()
      }

    } catch (err: any) {
      console.error('Share error:', err)
      alert(`Failed to share: ${err.message}`)
    } finally {
      setIsSharing(false)
    }
  }

  const handleDownloadOriginal = () => {
    window.open(generatedImageUrl, '_blank')
  }

  const handleCreateArtCard = () => {
    setArtCardModalOpen(true)
  }

  return (
    <>
      {/* Main Result Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full h-full lg:h-[90vh] lg:max-w-7xl lg:rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">
          
          {/* Close Button (Top Right) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* LEFT PANEL: The Asset (Image + Actions) */}
          <div className="lg:w-[58%] flex flex-col bg-zinc-900 overflow-y-auto">
            {/* Image Display Area */}
            <div className="flex-shrink-0 relative flex items-center justify-center p-4 lg:p-8 min-h-[50vh] lg:min-h-[60vh]">
              <img
                src={generatedImageUrl}
                alt="Your AI-generated pet portrait"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-zoom-in hover:scale-[1.02] transition-transform duration-300"
                onClick={() => window.open(generatedImageUrl, '_blank')}
              />
            </div>

            {/* Unified Action Bar */}
            <div className="bg-white p-4 lg:p-6 border-t border-gray-200 flex-shrink-0">
              <div className="max-w-2xl mx-auto space-y-3">
                
                {/* Share Input (Conditional) */}
                {showShareInput && !isShared && (
                  <div className="bg-gradient-to-br from-orange-50 to-coral/10 rounded-xl p-4 space-y-3 animate-in slide-in-from-bottom border-2 border-coral/20">
                    <div className="flex items-center justify-between">
                      <label className="block text-base font-semibold text-gray-800">
                        ✨ Name Your PixPaw Star
                      </label>
                      <span className="text-xs text-gray-500 font-medium">
                        {shareTitle.length}/100
                      </span>
                    </div>
                    <input
                      type="text"
                      value={shareTitle}
                      onChange={(e) => setShareTitle(e.target.value)}
                      placeholder={randomPlaceholder}
                      className="w-full px-4 py-3 border-2 border-coral/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral bg-white shadow-sm transition-all"
                      maxLength={100}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleShareConfirm}
                        disabled={isSharing}
                        className="flex-1 bg-coral hover:bg-orange-600 text-white font-semibold"
                      >
                        {isSharing ? 'Sharing...' : 'Confirm Share'}
                      </Button>
                      <Button
                        onClick={() => setShowShareInput(false)}
                        disabled={isSharing}
                        variant="outline"
                        className="px-6"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Button 1: Share to Gallery / Create Art Card (PRIMARY CTA) */}
                  {!isShared ? (
                    <Button
                      onClick={handleShareClick}
                      disabled={showShareInput}
                      className="sm:col-span-2 bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold h-12 text-base shadow-lg"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Share to PixPaw Gallery (+1 Credit)
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCreateArtCard}
                      className="sm:col-span-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-purple-600 text-white font-bold h-12 text-base shadow-lg"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      ✨ Create Art Card
                    </Button>
                  )}

                  {/* Button 2: Download */}
                  {!isShared ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="sm:col-span-2 border-2 hover:bg-gray-50 font-medium h-11"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem onClick={handleDownloadOriginal}>
                          <Download className="w-4 h-4 mr-2" />
                          Original High-Res
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCreateArtCard}>
                          <Sparkles className="w-4 h-4 mr-2" />
                          ✨ Create Art Card
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      onClick={handleDownloadOriginal}
                      variant="outline"
                      className="sm:col-span-2 border-2 hover:bg-gray-50 font-medium h-11"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Original
                    </Button>
                  )}
                </div>
                
                {/* Success Message (Below buttons when shared) */}
                {isShared && (
                  <div className="flex items-center justify-center py-2 text-sm text-green-700 font-medium animate-in fade-in">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Shared to PixPaw Gallery ✓
                  </div>
                )}

                {/* Credits Display */}
                {remainingCredits !== null && (
                  <p className="text-center text-sm text-gray-500">
                    {remainingCredits} credits remaining
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: The Hook (Wall Art Mockup) */}
          <div className="lg:w-[42%] bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col p-6 lg:p-12 space-y-6 overflow-y-auto">
            
            {/* Header */}
            <div className="text-center lg:text-left pt-8 lg:pt-0">
              <h2 className="text-3xl lg:text-4xl font-serif text-gray-900 mb-3 leading-tight">
                Your PixPaw Star is Born
              </h2>
              <p className="text-gray-600 text-lg">
                See your masterpiece come to life.
              </p>
            </div>

            {/* Wall Art Mockup (Clickable) */}
            <button
              onClick={handleShopClick}
              className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-2xl hover:shadow-3xl transition-all duration-300 group cursor-pointer border-2 border-transparent hover:border-coral/30 flex-shrink-0"
            >
              {/* Wall Background */}
              <div className="absolute inset-0 bg-[#E5E5E5]"></div>
              
              {/* Framed Portrait on Wall */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="w-2/5 aspect-square bg-white border-4 border-white rounded shadow-2xl overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={generatedImageUrl}
                    alt="Wall preview mockup"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-coral/0 group-hover:bg-coral/10 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/95 rounded-lg px-4 py-2 shadow-lg">
                  <span className="text-coral font-semibold">Bring your PixPaw Star home →</span>
                </div>
              </div>
            </button>

            {/* CTA Text */}
            <div className="text-center lg:text-left">
              <p className="text-gray-700 text-base leading-relaxed">
                Transform your PixPaw creation into premium merchandise. From custom pillows to museum-quality prints.
              </p>
            </div>

            {/* Unlock Merchandise Button */}
            <Button
              onClick={handleShopClick}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-12 shadow-lg"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Unlock PixPaw Merch
            </Button>

            {/* Trust Badges */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="text-green-600 text-lg">✓</span>
                <span>Premium quality materials</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="text-green-600 text-lg">✓</span>
                <span>Fast worldwide shipping</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="text-green-600 text-lg">✓</span>
                <span>Money-back guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Art Card Modal */}
      {artCardModalOpen && (
        <ArtCardModal
          isOpen={artCardModalOpen}
          onClose={() => setArtCardModalOpen(false)}
          generationId={generationId}
          imageUrl={generatedImageUrl}
          originalTitle={shareTitle || 'My Pet Portrait'}
          onTitleUpdate={(newTitle) => {
            setShareTitle(newTitle)
          }}
        />
      )}

      {/* Share Success Modal */}
      {showSuccessModal && (
        <ShareSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          shareCardUrl={successShareCardUrl}
          slogan={successSlogan}
          generationId={generationId}
          title={shareTitle}
          onSloganRefresh={(newUrl, newSlogan) => {
            setSuccessShareCardUrl(newUrl)
            setSuccessSlogan(newSlogan)
          }}
        />
      )}

      {/* Shop Fake Door Dialog */}
      <ShopFakeDoorDialog
        isOpen={shopFakeDoorOpen}
        onClose={() => setShopFakeDoorOpen(false)}
        generationId={generationId}
        petName={shareTitle || 'your pet'}
      />
    </>
  )
}
