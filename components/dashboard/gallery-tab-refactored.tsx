'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download, Sparkles, CheckCircle, ShoppingBag, Trash2, EyeOff, BarChart3, Loader2, Heart, Eye, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { ShareSuccessModal } from '@/components/share-success-modal'
import { ArtCardModal } from '@/components/art-card-modal'
import { ShopFakeDoorDialog } from '@/components/shop-fake-door-dialog'
import { createClient } from '@/lib/supabase/client'
import confetti from 'canvas-confetti'

interface GalleryTabProps {
  generations: any[]
  onGenerationsUpdate?: () => void
  onLocalUpdate?: (updater: (prevGenerations: any[]) => any[]) => void
  totalCount?: number
}

export function GalleryTabRefactored({ generations, onGenerationsUpdate, onLocalUpdate, totalCount = 0 }: GalleryTabProps) {
  const succeededGenerations = generations.filter(g => g.status === 'succeeded')
  
  // Share Dialog States
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedGeneration, setSelectedGeneration] = useState<any>(null)
  const [shareTitle, setShareTitle] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState('')
  
  // Success Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successGenerationId, setSuccessGenerationId] = useState('')
  const [successShareCardUrl, setSuccessShareCardUrl] = useState('')
  const [successSlogan, setSuccessSlogan] = useState('')
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [generationToDelete, setGenerationToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Art Card Modal
  const [artCardModalOpen, setArtCardModalOpen] = useState(false)
  const [selectedGenerationForCard, setSelectedGenerationForCard] = useState<any>(null)
  
  // Analytics Modal
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false)
  const [selectedGenerationForAnalytics, setSelectedGenerationForAnalytics] = useState<any>(null)
  
  // Shop Fake Door
  const [shopFakeDoorOpen, setShopFakeDoorOpen] = useState(false)
  const [selectedGenerationForShop, setSelectedGenerationForShop] = useState<any>(null)

  // Load More Pagination
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const hasMore = generations.length < totalCount

  const handleShareClick = (generation: any) => {
    setSelectedGeneration(generation)
    setShareTitle(generation.title || '')
    setShareError('')
    setShareDialogOpen(true)
  }
  
  const handleShopClick = (generation: any) => {
    // Log fake door interaction
    console.log('🚪 FakeDoor_Shop_Clicked', {
      source: 'GalleryTab',
      generationId: generation.id,
      petTitle: generation.title,
      timestamp: new Date().toISOString()
    })
    setSelectedGenerationForShop(generation)
    setShopFakeDoorOpen(true)
  }

  const handleShareConfirm = async () => {
    if (!selectedGeneration) return
    
    setIsSharing(true)
    setShareError('')

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generation_id: selectedGeneration.id,
          title: shareTitle.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to share')
      }

      // Success! Show confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      })

      // Close input dialog
      setShareDialogOpen(false)

      // Show Success Modal with share card data
      setSuccessGenerationId(selectedGeneration.id)
      if (result.share_card_url && result.slogan) {
        setSuccessShareCardUrl(result.share_card_url)
        setSuccessSlogan(result.slogan)
      }
      setShowSuccessModal(true)

      // Update local state immediately (instant UI feedback)
      if (onLocalUpdate) {
        onLocalUpdate((prevGenerations) =>
          prevGenerations.map((gen) =>
            gen.id === selectedGeneration.id
              ? { ...gen, is_public: true, is_rewarded: true, title: shareTitle.trim() || gen.title }
              : gen
          )
        )
      }
      
      // Refresh data from server (background sync)
      if (onGenerationsUpdate) {
        onGenerationsUpdate()
      }

      setSelectedGeneration(null)
      setShareTitle('')

    } catch (err: any) {
      console.error('Share error:', err)
      setShareError(err.message || 'Failed to share')
    } finally {
      setIsSharing(false)
    }
  }

  const handleUnshare = async (generationId: string) => {
    try {
      const response = await fetch('/api/unshare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation_id: generationId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to unshare')
      }

      console.log('✅ Unshared successfully')
      
      // Update local state immediately (instant UI feedback)
      if (onLocalUpdate) {
        onLocalUpdate((prevGenerations) =>
          prevGenerations.map((gen) =>
            gen.id === generationId
              ? { ...gen, is_public: false }
              : gen
          )
        )
      }
      
      // Refresh data from server (background sync)
      if (onGenerationsUpdate) {
        onGenerationsUpdate()
      }
    } catch (err: any) {
      console.error('Unshare error:', err)
      alert(`Failed to unshare: ${err.message}`)
    }
  }

  const handleDelete = async () => {
    if (!generationToDelete) return
    
    setIsDeleting(true)
    console.log('🗑️  Deleting generation:', generationToDelete.id)
    
    try {
      const response = await fetch('/api/delete-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation_id: generationToDelete.id }),
      })

      console.log('📡 Delete API response status:', response.status)
      const result = await response.json()
      console.log('📡 Delete API result:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete')
      }

      console.log('✅ Deleted successfully from server')
      
      const deletedId = generationToDelete.id
      setDeleteDialogOpen(false)
      setGenerationToDelete(null)
      
      // Update local state immediately (instant UI feedback)
      if (onLocalUpdate) {
        console.log('🔄 Updating local state to remove:', deletedId)
        onLocalUpdate((prevGenerations) => {
          const filtered = prevGenerations.filter((gen) => gen.id !== deletedId)
          console.log('📊 Before:', prevGenerations.length, 'After:', filtered.length)
          return filtered
        })
      } else {
        console.warn('⚠️  onLocalUpdate not available')
      }
      
      // Refresh data from server (background sync)
      if (onGenerationsUpdate) {
        console.log('🔄 Triggering server refresh')
        onGenerationsUpdate()
      } else {
        console.warn('⚠️  onGenerationsUpdate not available')
      }
      
      console.log('✅ Delete operation completed')
    } catch (err: any) {
      console.error('❌ Delete error:', err)
      alert(`Failed to delete: ${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Fetch next batch of generations
      const { data: moreGenerations, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(generations.length, generations.length + 49) // Load 50 more

      if (error) {
        console.error('Error loading more:', error)
        return
      }

      if (moreGenerations && moreGenerations.length > 0) {
        // Append new generations to existing list
        if (onLocalUpdate) {
          onLocalUpdate((prevGenerations) => [...prevGenerations, ...moreGenerations])
        }
      }
    } catch (err) {
      console.error('Failed to load more:', err)
    } finally {
      setIsLoadingMore(false)
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

      {/* Share Input Dialog - Redesigned */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl">
          {/* Centered Icon and Title */}
          <div className="flex flex-col items-center text-center pt-6 pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-coral to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            {/* Title & Description */}
            <DialogHeader className="space-y-4 mb-6 text-center">
              <DialogTitle className="text-3xl font-bold text-gray-900 text-center">
                Share to Gallery
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-base leading-relaxed">
                Get a premium branded card to share on social media
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Input Section */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm font-medium text-gray-700">
                <span>Add a title</span>
                <span className="text-xs text-coral font-semibold">(Recommended)</span>
              </label>
              <input
                type="text"
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
                placeholder="e.g., Luna the Corgi Superhero"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                maxLength={100}
                disabled={isSharing}
              />
              <p className="text-xs text-gray-500">
                💡 Titles help your art get discovered in the gallery
              </p>
            </div>

            {shareError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 font-medium">{shareError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleShareConfirm}
                disabled={isSharing}
                className="w-full bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold h-14 text-base shadow-lg rounded-xl"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating card...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Share & Unlock Card
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShareDialogOpen(false)}
                disabled={isSharing}
                variant="ghost"
                className="w-full h-12 text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          {/* Icon and Title Section */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Delete this portrait?
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-2">
                  This action cannot be undone. The portrait and all associated data will be permanently removed from your gallery.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              variant="ghost"
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Art Card Modal */}
      {selectedGenerationForCard && (
        <ArtCardModal
          isOpen={artCardModalOpen}
          onClose={() => {
            setArtCardModalOpen(false)
            setSelectedGenerationForCard(null)
          }}
          generationId={selectedGenerationForCard.id}
          imageUrl={selectedGenerationForCard.output_url}
          originalTitle={selectedGenerationForCard.title || 'Untitled Portrait'}
          currentSlogan={selectedGenerationForCard.slogan}
          onTitleUpdate={(newTitle) => {
            // Update local state
            selectedGenerationForCard.title = newTitle
            // Refresh data
            if (onGenerationsUpdate) {
              onGenerationsUpdate()
            }
          }}
        />
      )}

      {/* Analytics Modal */}
      <Dialog open={analyticsModalOpen} onOpenChange={setAnalyticsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-coral" />
              Analytics
            </DialogTitle>
            <DialogDescription>
              Performance metrics for your shared artwork
            </DialogDescription>
          </DialogHeader>

          {selectedGenerationForAnalytics && (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={selectedGenerationForAnalytics.output_url}
                  alt={selectedGenerationForAnalytics.title || 'Portrait'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title */}
              {selectedGenerationForAnalytics.title && (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {selectedGenerationForAnalytics.title}
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Eye className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-900">
                    {selectedGenerationForAnalytics.views ?? 0}
                  </p>
                  <p className="text-xs text-blue-700 font-medium">Views</p>
                </div>
                <div className="bg-pink-50 rounded-lg p-4 text-center">
                  <Heart className="w-6 h-6 text-pink-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-pink-900">
                    {selectedGenerationForAnalytics.likes ?? 0}
                  </p>
                  <p className="text-xs text-pink-700 font-medium">Likes</p>
                </div>
              </div>

              {/* Date Info */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shared on:</span>
                  <span className="font-medium">
                    {new Date(selectedGenerationForAnalytics.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Gallery Link */}
              <Button
                onClick={() => window.open(`/en/gallery?id=${selectedGenerationForAnalytics.id}`, '_blank')}
                variant="outline"
                className="w-full border-coral/30 hover:bg-coral/10 text-coral"
              >
                <Share2 className="w-4 h-4 mr-2" />
                View in Public Gallery
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {succeededGenerations.map((generation) => (
          <div
            key={generation.id}
            className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative"
          >
            {/* Image */}
            <div className="relative aspect-square">
              <Image
                src={generation.output_url}
                alt={generation.title || 'Generated portrait'}
                fill
                className="object-cover"
                unoptimized
              />
              
              {/* Delete Menu (Top Right) - Destructive actions only */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-red-50 shadow-lg transition-colors"
                  onClick={() => {
                    setGenerationToDelete(generation)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
                </Button>
              </div>
            </div>
            
            {/* Info & Actions */}
            <div className="p-4">
              {/* Date & Status */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500" suppressHydrationWarning>
                  {new Date(generation.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                {generation.status === 'processing' && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing
                  </span>
                )}
                {generation.status === 'failed' && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    Failed
                  </span>
                )}
                {generation.status === 'succeeded' && generation.is_public && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Shared
                  </span>
                )}
              </div>

              {/* Title */}
              {generation.title && (
                <p className="text-sm font-medium text-gray-800 mb-3 line-clamp-1">
                  {generation.title}
                </p>
              )}

              {/* Stats (if public) */}
              {generation.is_public && (
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {generation.views ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {generation.likes ?? 0}
                  </span>
                </div>
              )}

              {/* Action Buttons - PERMANENT 3-BUTTON LAYOUT */}
              <div className="flex gap-2">
                {generation.status === 'succeeded' ? (
                  <>
                    {/* Button 1: Download (TOOLS - Always Active) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => window.open(generation.output_url, '_blank')}>
                          <Download className="w-4 h-4 mr-2" />
                          Original Image
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedGenerationForCard(generation)
                          setArtCardModalOpen(true)
                        }}>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Create Art Card
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Button 2: Status (Toggle - Share or Download Card) */}
                    {!generation.is_public ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-coral/30 hover:bg-coral/10 text-coral font-semibold"
                        onClick={() => handleShareClick(generation)}
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-coral/5 border-coral/30 text-coral hover:bg-coral/10 font-semibold"
                        onClick={() => {
                          setSelectedGenerationForCard(generation)
                          setArtCardModalOpen(true)
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Card
                      </Button>
                    )}

                    {/* Button 3: Shop (COMMERCE - Always Active) */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-coral/20 hover:bg-coral/5"
                      onClick={() => handleShopClick(generation)}
                    >
                      <ShoppingBag className="w-4 h-4 mr-1" />
                      Shop
                    </Button>
                  </>
                ) : generation.status === 'processing' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Processing...
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-red-500"
                    disabled
                  >
                    Generation Failed
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Section */}
      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{generations.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalCount}</span> total generations
          </div>
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="px-8 py-6 text-base font-medium border-2 border-coral/30 hover:bg-coral/10 hover:border-coral text-coral"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Load More
              </>
            )}
          </Button>
        </div>
      )}

      {/* Shop Fake Door Dialog */}
      {selectedGenerationForShop && (
        <ShopFakeDoorDialog
          isOpen={shopFakeDoorOpen}
          onClose={() => {
            setShopFakeDoorOpen(false)
            setSelectedGenerationForShop(null)
          }}
          generationId={selectedGenerationForShop.id}
          petName={selectedGenerationForShop.title || 'your pet'}
        />
      )}
    </>
  )
}
