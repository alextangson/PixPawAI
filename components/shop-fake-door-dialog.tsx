'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Sparkles, Bell } from 'lucide-react'

interface ShopFakeDoorDialogProps {
  isOpen: boolean
  onClose: () => void
  generationId: string
  petName?: string
}

export function ShopFakeDoorDialog({ 
  isOpen, 
  onClose, 
  generationId,
  petName = 'your pet'
}: ShopFakeDoorDialogProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleNotifyMe = async () => {
    if (!email.trim()) {
      alert('Please enter your email')
      return
    }

    setIsSubmitting(true)

    // Log the fake door interaction for analytics
    console.log('🚪 FakeDoor_Shop_Clicked', {
      generationId,
      petName,
      email,
      timestamp: new Date().toISOString()
    })

    // Simulate API call (2 second delay)
    await new Promise(resolve => setTimeout(resolve, 2000))

    setSubmitted(true)
    setIsSubmitting(false)

    // Auto-close after 3 seconds
    setTimeout(() => {
      onClose()
      setSubmitted(false)
      setEmail('')
    }, 3000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {!submitted ? (
          <>
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-coral to-orange-600 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif font-bold text-gray-900">
                  PixPaw Store Opening Soon! 🛍️
                </DialogTitle>
                <DialogDescription className="text-base text-gray-700 mt-2 font-sans">
                  We're preparing the factory lines to print <strong>{petName}</strong> on high-quality canvas, pillows, and mugs.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Product Preview */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-coral" />
                Coming Soon
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-coral mt-0.5">✓</span>
                  <span><strong>Custom Canvas Prints</strong> - Museum-quality wall art</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-coral mt-0.5">✓</span>
                  <span><strong>Shaped Pet Pillows</strong> - Exact silhouette of your pet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-coral mt-0.5">✓</span>
                  <span><strong>Premium Mugs & More</strong> - Perfect for gifts</span>
                </li>
              </ul>
            </div>

            {/* Email Capture */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                <Bell className="w-4 h-4 inline mr-1" />
                Get notified when we launch:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral"
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleNotifyMe}
                  disabled={isSubmitting || !email.trim()}
                  className="flex-1 bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold"
                >
                  {isSubmitting ? 'Submitting...' : 'Notify Me'}
                </Button>
                <Button
                  onClick={onClose}
                  disabled={isSubmitting}
                  variant="outline"
                  className="px-6"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Fine Print */}
            <p className="text-xs text-gray-500 text-center mt-4">
              We'll email you as soon as the store opens. No spam, we promise! 🐾
            </p>
          </>
        ) : (
          /* Success State */
          <div className="flex flex-col items-center text-center gap-6 py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                You're on the list! ✅
              </h3>
              <p className="text-gray-600 font-sans">
                We'll notify you at <strong>{email}</strong> when the store launches.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              This window will close automatically...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
