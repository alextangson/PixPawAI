'use client'

import { useState, useMemo, useEffect } from 'react'
import { X, Download, Sparkles, ShoppingBag, CheckCircle, ChevronDown, AlertCircle, ArrowLeft, Loader2, Gift, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { BRANDING } from '@/lib/constants/branding'
import { ArtCardModal } from '@/components/art-card-modal'
import Link from 'next/link'
import { ReferralLinkModal } from '@/components/referral-link-modal'
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

// Helper function to get style display name
function getStyleDisplayName(styleId: string): string {
  const styleNames: Record<string, string> = {
    'Johannes Vermeer': 'Renaissance Portrait',
    'Victorian-Royal': 'Royal Majesty',
    'Christmas-Vibe': 'Holiday Magic',
    'Flower-Crown': 'Blooming Beauty',
    'Embroidery-Art': 'Embroidered Masterpiece',
    'Watercolor-Dream': 'Watercolor Wonder',
    'Pixel-Mosaic': 'Pixel Perfect',
    'Retro-Pop-Art': 'Pop Art Icon',
    'Spring-Vibes': 'Spring Blossom',
    '3D-Movie-Star': 'Cinematic Style',
    'Psychedelic-60s': 'Psychedelic Art'
  }
  return styleNames[styleId] || styleId
}

interface ResultModalProps {
  isOpen: boolean
  onClose: () => void
  generatedImageUrl: string
  generationId: string
  remainingCredits: number | null
  isRewarded?: boolean
  isRefunded?: boolean // Whether user has already been refunded for this generation
  isGuest?: boolean // Whether this was a guest generation
  guestRemaining?: number // Remaining guest credits (for anonymous users)
  onShareSuccess?: () => void
  onReupload?: (targetStep?: 'upload' | 'configure') => void // Callback to reopen upload step
  petName?: string
  generationMetadata?: {
    hasHeterochromia?: boolean
    heterochromiaDetails?: string
    style?: string
    strength?: number
    preGeneratedCardUrl?: string
    originalImagePath?: string // High-quality PNG for download
    inputImageUrl?: string // User's uploaded image for blur preview
  }
}

export function ResultModal({
  isOpen,
  onClose,
  generatedImageUrl,
  generationId,
  remainingCredits,
  isRewarded = false,
  isRefunded: initialIsRefunded = false,
  isGuest = false,
  guestRemaining,
  onShareSuccess,
  onReupload,
  petName,
  generationMetadata
}: ResultModalProps) {
  // Share states
  const [isSharing, setIsSharing] = useState(false)
  const [isShared, setIsShared] = useState(isRewarded)
  const [shareTitle, setShareTitle] = useState('')
  const [showShareInput, setShowShareInput] = useState(false)
  
  // Art Card Modal
  const [artCardModalOpen, setArtCardModalOpen] = useState(false)
  
  // Shop link
  const shopUrl = `/en/shop/pillow?generationId=${generationId}`
  
  // Referral Modal
  const [showReferralPrompt, setShowReferralPrompt] = useState(false)

  // User satisfaction choice
  const [userChoice, setUserChoice] = useState<'love' | 'not_quite' | null>(null)
  
  // Not satisfied feedback
  const [notSatisfiedReasons, setNotSatisfiedReasons] = useState<string[]>([])
  const [otherReasonText, setOtherReasonText] = useState('')
  const [hasRefunded, setHasRefunded] = useState(initialIsRefunded)

  // Image loading state
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // ✨ Random placeholder for naming (stable per render)
  const randomPlaceholder = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * PIXPAW_NAME_SUGGESTIONS.length)
    return `e.g., ${PIXPAW_NAME_SUGGESTIONS[randomIndex]}`
  }, [generationId]) // Change placeholder when generationId changes

  // Auto-fill share title with pet name + style
  useEffect(() => {
    if (petName && generationMetadata?.style && !shareTitle) {
      const formattedTitle = `${petName} - ${getStyleDisplayName(generationMetadata.style)}`
      setShareTitle(formattedTitle)
    }
  }, [petName, generationMetadata?.style])

  if (!isOpen) return null

  const handleShopClick = () => {
    window.location.href = shopUrl
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

      // Open Art Card Modal directly
      setArtCardModalOpen(true)

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

  const addWatermarkAndDownload = async (imageUrl: string, filename: string) => {
    try {
      setIsDownloading(true)
      
      // Check if user is admin or paid user
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      let shouldAddWatermark = true // Default: add watermark for unpaid users
      
      if (user) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, tier')
          .eq('id', user.id)
          .single()
        
        // Admin or paid users don't get watermark
        // Free tier = watermark, Starter/Pro/Master = no watermark
        if (
          profile?.role === 'admin' || 
          profile?.tier === 'starter' || 
          profile?.tier === 'pro' || 
          profile?.tier === 'master'
        ) {
          shouldAddWatermark = false
        }
      }
      
      if (!shouldAddWatermark) {
        // Admin/Paid users download without watermark
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = filename
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setIsDownloading(false)
        return
      }
      
      // For unpaid users, add watermark using Canvas API
      const img = new Image()
      img.crossOrigin = 'anonymous' // Enable CORS
      
      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })
      
      // Create canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }
      
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw original image
      ctx.drawImage(img, 0, 0)
      
      // Load and draw watermark logo
      const logo = new Image()
      logo.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        logo.onload = resolve
        logo.onerror = reject
        logo.src = '/brand/png/logo-orange-256.png'
      })
      
      // Calculate watermark size and position
      const watermarkWidth = 160
      const watermarkHeight = (logo.height / logo.width) * watermarkWidth
      const margin = 20
      const x = canvas.width - watermarkWidth - margin
      const y = canvas.height - watermarkHeight - margin
      
      // Draw watermark with opacity
      ctx.globalAlpha = 0.7
      ctx.drawImage(logo, x, y, watermarkWidth, watermarkHeight)
      ctx.globalAlpha = 1.0
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob')
        }
        
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      }, 'image/png', 1.0)
      
    } catch (error) {
      console.error('Watermark failed, downloading without watermark:', error)
      // Fallback to direct download if watermark fails
      window.open(imageUrl, '_blank')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadOriginal = async () => {
    // If original high-quality image path is available in metadata, fetch it
    const originalImagePath = generationMetadata?.originalImagePath
    
    if (originalImagePath) {
      try {
        // Initialize Supabase client
        const supabase = createClient()
        
        // Get signed URL for original high-quality image
        const { data } = await supabase.storage
          .from('generated-results')
          .createSignedUrl(originalImagePath, 60) // 1 minute expiry
        
        if (data?.signedUrl) {
          await addWatermarkAndDownload(data.signedUrl, `pixpaw-${generationId}-hq.png`)
          return
        }
      } catch (error) {
        console.error('Failed to get original image URL:', error)
      }
    }
    
    // Fallback to compressed image if original is not available
    await addWatermarkAndDownload(generatedImageUrl, `pixpaw-${generationId}.png`)
  }

  const handleCreateArtCard = () => {
    // If pre-generated Art Card exists, download it directly
    if (generationMetadata?.preGeneratedCardUrl) {
      window.open(generationMetadata.preGeneratedCardUrl, '_blank')
    } else {
    setArtCardModalOpen(true)
  }
  }

  // Handle "Not quite" click - trigger credit refund
  const handleNotQuite = async () => {
    setUserChoice('not_quite')
    
    // Refund credit if first time
    if (!hasRefunded) {
      try {
        const response = await fetch('/api/refund-credit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generationId })
        })
        
        if (response.ok) {
          setHasRefunded(true)
        }
      } catch (error) {
        console.error('Failed to refund credit:', error)
      }
    }
  }

  // Log feedback to database
  const logFeedback = async (action: string) => {
    try {
      await fetch('/api/log-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId,
          reasons: notSatisfiedReasons,
          otherReason: otherReasonText || undefined,
          action,
          style: generationMetadata?.style,
          strength: generationMetadata?.strength
        })
      })
    } catch (error) {
      console.error('Failed to log feedback:', error)
    }
  }

  // Get recommended styles based on current style
  const getRecommendedStyles = () => {
    const currentStyle = generationMetadata?.style
    
    // Tier 1 (Realistic) → Recommend Tier 3 (Artistic)
    const realisticStyles = ['Johannes Vermeer', 'Victorian-Royal', 'Flower-Crown']
    const artisticStyles = ['3D-Movie-Star', 'Retro-Pop-Art', 'Psychedelic-60s']
    
    if (realisticStyles.includes(currentStyle || '')) {
      return artisticStyles.slice(0, 3)
    }
    
    // Tier 3 (Artistic) → Recommend Tier 1 (Realistic)
    if (artisticStyles.includes(currentStyle || '')) {
      return realisticStyles.slice(0, 3)
    }
    
    // Default: popular styles
    return ['3D-Movie-Star', 'Victorian-Royal', 'Retro-Pop-Art']
  }

  // Try different style
  const handleTryDifferentStyle = async () => {
    await logFeedback('try_different_style')
    
    // Don't delete - let user keep the original in gallery
    if (onReupload) {
      onReupload('configure') // Open at style selection
    } else {
      onClose()
    }
  }


  // Regenerate
  const handleRegenerate = async () => {
    await logFeedback('regenerate')
    
    // Return to configure step (keep current style, allow user to adjust settings)
    if (onReupload) {
      onReupload('configure')
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Main Result Modal */}
      <div className={`fixed inset-0 ${artCardModalOpen ? 'z-40' : 'z-50'} flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in`}>
        <div className="bg-white w-full h-full max-h-screen sm:max-h-[96vh] md:max-h-[94vh] lg:max-h-[92vh] xl:max-h-[90vh] lg:max-w-7xl rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">
          
          {/* Close Button (Top Right) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-3 sm:p-2 touch-target bg-white/90 hover:bg-white rounded-full shadow-lg transition-all flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 sm:w-5 sm:h-5 text-gray-600" />
          </button>

          {/* LEFT PANEL: The Asset (Image + Actions) */}
          <div className="lg:w-3/5 xl:w-2/3 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
            {/* Image Display Area */}
            <div className="flex-1 relative flex items-center justify-center p-4 min-h-[40vh] max-h-[60vh] lg:min-h-0 lg:max-h-none lg:flex-1">
              {/* Skeleton Loader */}
              {/* Skeleton Loader - Show while image is loading */}
              {!imageLoaded && (
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  {/* Blurred placeholder background (if input image is available) */}
                  {generationMetadata?.inputImageUrl && (
                    <img
                      src={generationMetadata.inputImageUrl}
                      alt="Loading preview"
                      className="w-full h-full object-cover blur-2xl opacity-50 scale-110"
                    />
                  )}
                  {/* Loading indicator */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                    <Loader2 className="w-12 h-12 text-white animate-spin mb-2" />
                    <p className="text-sm text-white font-medium">Almost ready...</p>
                  </div>
                </div>
              )}
              
              {/* Actual Image - Compressed WebP for fast loading */}
              <img
                src={generatedImageUrl}
                alt="Your AI-generated pet portrait"
                className={cn(
                  "w-full h-auto max-w-full max-h-[50vh] lg:max-h-[65vh] object-contain rounded-xl shadow-2xl cursor-zoom-in hover:scale-[1.02] transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onClick={() => window.open(generatedImageUrl, '_blank')}
              />
            </div>

            {/* Action Bar - Only show when Love it */}
            {userChoice === 'love' && (
            <div className="bg-white p-3 sm:p-4 md:p-4 lg:p-5 border-t border-gray-200 flex-shrink-0">
              <div className="max-w-2xl mx-auto space-y-2 sm:space-y-3">
                
                {/* Share Input (Conditional) - Hide when Art Card Modal is open */}
                {showShareInput && !isShared && !artCardModalOpen && (
                  <div className="bg-gradient-to-br from-orange-50 to-coral/10 rounded-xl p-4 space-y-3 animate-in slide-in-from-bottom border-2 border-coral/20">
                    <div className="flex items-center justify-between">
                      <label className="block text-base font-semibold text-gray-800">
                          Name Your PixPaw Star
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

                  {/* Heterochromia Alert */}
                  {generationMetadata?.hasHeterochromia && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-amber-900 text-sm">
                            Feature Preservation Alert
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            We detected heterochromia ({generationMetadata.heterochromiaDetails}), 
                            but it may not be fully preserved in the generated image.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons - Responsive: single column on mobile, grid on desktop */}
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                  {!isShared ? (
                    <>
                      <Button
                        onClick={handleShareClick}
                        disabled={showShareInput}
                        className="w-full sm:col-span-2 bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold h-12 text-base shadow-lg"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Share to Gallery (+1 Credit)
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full sm:col-span-2 border-2 hover:bg-gray-50 font-medium h-11"
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
                            Create Art Card
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleCreateArtCard}
                        className="w-full sm:col-span-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-purple-600 text-white font-bold h-12 text-base shadow-lg"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Create Art Card
                      </Button>
                      <Button
                        onClick={handleDownloadOriginal}
                        variant="outline"
                        className="w-full sm:col-span-2 border-2 hover:bg-gray-50 font-medium h-11"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Original
                      </Button>
                    </>
                  )}
                </div>
                
                  {/* Success Message */}
                {isShared && (
                  <div className="flex items-center justify-center py-2 text-sm text-green-700 font-medium animate-in fade-in">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Shared to PixPaw Gallery ✓
                  </div>
                )}

                {/* Credits Display */}
                {remainingCredits !== null && !isGuest && (
                  <p className="text-center text-sm text-gray-500">
                    {remainingCredits} credits remaining
                  </p>
                )}

                {/* Guest Remaining Free Generations */}
                {isGuest && guestRemaining !== undefined && (
                  <div className="bg-gradient-to-r from-orange-50 to-coral/10 rounded-lg p-3 text-center border border-coral/20">
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      🎉 You have <span className="text-coral">{guestRemaining}</span> free generation{guestRemaining !== 1 ? 's' : ''} left today!
                    </p>
                    <p className="text-xs text-gray-600">
                      Sign up to get unlimited credits and keep creating
                    </p>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

          {/* RIGHT PANEL: Dynamic Content */}
          <div className="lg:w-2/5 xl:w-1/3 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-y-auto">
            
            {!userChoice ? (
              /* Initial State: Choice Buttons - Vertically Centered */
              <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 lg:p-8">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">
                    How do you feel about your creation?
                  </h3>
                  <p className="text-gray-600">
                    Your feedback helps us improve
                  </p>
                </div>
                
                <div className="w-full max-w-md space-y-4">
                  <Button
                    onClick={() => setUserChoice('love')}
                    className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral"
                  >
                    Love it! I'm happy with the result
                  </Button>
                  
                  <Button
                    onClick={handleNotQuite}
                    variant="outline"
                    className="w-full h-16 text-lg font-semibold border-2"
                  >
                    Not quite... Let's improve it
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500 mt-6">
                  Either choice is fine - we're here to help!
                </p>
              </div>
            ) : userChoice === 'love' ? (
              /* Love it: Product Push */
              <div className="p-4 sm:p-6 lg:p-12 flex flex-col justify-between min-h-full">
                {/* Back Button */}
                <button 
                  onClick={() => setUserChoice(null)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change Response
                </button>
                
                {/* Main Content - Centered */}
                <div className="flex-1 flex flex-col justify-center space-y-6">
            {/* Header */}
                  <div className="text-center lg:text-left">
              <h2 className="text-3xl lg:text-4xl font-serif text-gray-900 mb-3 leading-tight">
                Your PixPaw Star is Born
              </h2>
              <p className="text-gray-600 text-lg">
                See your masterpiece come to life.
              </p>
            </div>

                  {/* Wall Art Mockup */}
            <button
              onClick={handleShopClick}
                    className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-2xl hover:shadow-3xl transition-all duration-300 group cursor-pointer border-2 border-transparent hover:border-coral/30"
            >
              <div className="absolute inset-0 bg-[#E5E5E5]"></div>
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="w-2/5 aspect-square bg-white border-4 border-white rounded shadow-2xl overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={generatedImageUrl}
                    alt="Wall preview mockup"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
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

                  {/* Unlock Button */}
            <Button
              onClick={handleShopClick}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-12 shadow-lg"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Unlock PixPaw Merch
            </Button>

                  {/* Referral Prompt Card - Share with Friends */}
                  <div className="bg-gradient-to-br from-orange-50 to-coral/10 rounded-2xl p-5 border-2 border-coral/20 shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-coral to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                        <Gift className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-1">
                          Love this result?
                        </h4>
                        <p className="text-sm text-gray-700 mb-3">
                          Share with friends and <span className="font-bold text-coral">both get 5 free credits!</span>
                        </p>
                        <Button
                          onClick={() => setShowReferralPrompt(true)}
                          className="w-full bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold h-10 text-sm shadow-md"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Get Your Referral Link
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Badges - Bottom Fixed */}
                <div className="border-t border-gray-200 pt-4 space-y-2 mt-6">
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
            ) : (
              /* Not quite: Feedback Form */
              <div className="p-4 sm:p-6 lg:p-12 flex flex-col justify-between min-h-full">
                {/* Back Button */}
                <button 
                  onClick={() => setUserChoice(null)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4 p-2 -ml-2 touch-target rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change Response
                </button>
                
                {/* Main Content - Centered */}
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  {/* Title */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900">
                      What's not quite right?
                    </h3>
                    <p className="text-gray-600 mt-2">
                      Help us understand so we can make it perfect
                    </p>
                  </div>
                
                {/* Issue Checkboxes */}
                <div className="space-y-2">
                  {[
                    { id: 'wrong_style', label: 'Wrong style (not what I expected)' },
                    { id: 'pet_likeness', label: "Pet doesn't look like mine" },
                    { id: 'quality', label: 'Quality or clarity issues' },
                    { id: 'colors', label: 'Colors are off' }
                  ].map(issue => (
                    <label key={issue.id} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 cursor-pointer transition-colors border-2 border-gray-200">
                      <input
                        type="checkbox"
                        checked={notSatisfiedReasons.includes(issue.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNotSatisfiedReasons([...notSatisfiedReasons, issue.id])
                          } else {
                            setNotSatisfiedReasons(notSatisfiedReasons.filter(r => r !== issue.id))
                          }
                        }}
                        className="w-4 h-4 text-coral focus:ring-coral"
                      />
                      <span className="text-sm font-medium text-gray-700">{issue.label}</span>
                    </label>
                  ))}
                  
                  {/* Other option with textarea */}
                  <label className="flex items-start gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 cursor-pointer transition-colors border-2 border-gray-200">
                    <input
                      type="checkbox"
                      checked={notSatisfiedReasons.includes('other')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNotSatisfiedReasons([...notSatisfiedReasons, 'other'])
                        } else {
                          setNotSatisfiedReasons(notSatisfiedReasons.filter(r => r !== 'other'))
                          setOtherReasonText('')
                        }
                      }}
                      className="w-4 h-4 text-coral focus:ring-coral mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700 block mb-2">Other (please specify)</span>
                      {notSatisfiedReasons.includes('other') && (
                        <textarea
                          value={otherReasonText}
                          onChange={(e) => setOtherReasonText(e.target.value)}
                          placeholder="Tell us what we can improve..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-coral text-sm"
                          rows={3}
                        />
                      )}
                    </div>
                  </label>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={handleTryDifferentStyle}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral shadow-lg transition-all hover:scale-[1.02]"
                    disabled={notSatisfiedReasons.length === 0}
                  >
                    Try Different Style
                  </Button>
                  
                  <Button
                    onClick={handleRegenerate}
                    className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-blue-600 hover:to-purple-600 shadow-md transition-all hover:scale-[1.01]"
                  >
                    Regenerate
                  </Button>
                </div>
                </div>
                
                {/* Refund Message - Bottom Fixed */}
                <div className={`${hasRefunded ? 'bg-blue-50 border-blue-300' : 'bg-green-100 border-green-300'} border rounded-lg p-3 text-center mt-6`}>
                  {!hasRefunded ? (
                    <>
                      <p className="text-sm font-semibold text-green-800">
                        Don't worry - we'll refund your credit!
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Try again on us, no charge for this one
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-blue-800">
                        Let's try again to get it perfect!
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Each generation uses 1 credit
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
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
          petName={petName}
          onTitleUpdate={(newTitle) => {
            setShareTitle(newTitle)
          }}
        />
      )}

      {/* Shop link is now handled via navigation */}

      {/* Referral Link Modal */}
      {showReferralPrompt && (
        <ReferralLinkModal
          isOpen={showReferralPrompt}
          onClose={() => setShowReferralPrompt(false)}
        />
      )}
    </>
  )
}
