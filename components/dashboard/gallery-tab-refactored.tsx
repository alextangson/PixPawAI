'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download, Sparkles, CheckCircle, ShoppingBag, MoreVertical, Trash2, EyeOff, BarChart3, Loader2, Heart, Eye } from 'lucide-react'
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
import confetti from 'canvas-confetti'

interface GalleryTabProps {
  generations: any[]
  onGenerationsUpdate?: () => void
}

export function GalleryTabRefactored({ generations, onGenerationsUpdate }: GalleryTabProps) {
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
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [generationToDelete, setGenerationToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

      // Show Success Modal
      setSuccessGenerationId(selectedGeneration.id)
      setShowSuccessModal(true)

      // Update local state
      selectedGeneration.is_public = true
      selectedGeneration.is_rewarded = true
      
      // Refresh data
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
      
      // Refresh data
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
    try {
      const response = await fetch('/api/delete-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation_id: generationToDelete.id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete')
      }

      console.log('✅ Deleted successfully')
      
      setDeleteDialogOpen(false)
      setGenerationToDelete(null)
      
      // Refresh data
      if (onGenerationsUpdate) {
        onGenerationsUpdate()
      }
    } catch (err: any) {
      console.error('Delete error:', err)
      alert(`Failed to delete: ${err.message}`)
    } finally {
      setIsDeleting(false)
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
          generationId={successGenerationId}
          title={shareTitle}
        />
      )}

      {/* Share Input Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-coral/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-coral/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-coral" />
            </div>
            <div className="flex-1">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Share to Gallery
                </DialogTitle>
                <div className="text-sm font-semibold text-coral mt-1">Earn +1 Credit</div>
                <DialogDescription className="text-gray-700 mt-2 text-base">
                  🎉 Share your masterpiece and unlock a <strong>premium branded social media card</strong>!
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
          
          <div className="space-y-5 mt-6">
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
            </div>

            {shareError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 font-medium">{shareError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleShareConfirm}
                disabled={isSharing}
                className="flex-1 bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold h-12 text-base shadow-lg"
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
                variant="outline"
                className="px-8 h-12 border-2"
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
              
              {/* More Menu (Top Right) */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {generation.is_public && (
                      <>
                        <DropdownMenuItem onClick={() => handleUnshare(generation.id)}>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Make Private
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => {
                        setGenerationToDelete(generation)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete permanently
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                {generation.is_public && (
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
                    {generation.views || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {generation.likes || 0}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Download Dropdown */}
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
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => window.open(generation.output_url, '_blank')}>
                      Original
                    </DropdownMenuItem>
                    {generation.share_card_url && (
                      <DropdownMenuItem onClick={() => window.open(generation.share_card_url, '_blank')}>
                        Art Card
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Share Button */}
                {!generation.is_public ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-coral/30 hover:bg-coral/10"
                    onClick={() => handleShareClick(generation)}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-green-50 border-green-200 text-green-700"
                    disabled
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Shared
                  </Button>
                )}

                {/* Shop Button */}
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white"
                  onClick={() => window.location.href = `/shop/${generation.id}`}
                >
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  Shop
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
