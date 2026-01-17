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
      <DialogContent className="max-w-md p-0 overflow-hidden border-0">
        {!submitted ? (
          <>
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-coral to-orange-600 p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-coral" />
              </div>
              <h3 className="text-2xl font-bold text-white">Store Opening Soon!</h3>
            </div>

            {/* Content - Minimal */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700 text-center leading-relaxed">
                We're preparing the factory lines to print <strong>{petName}</strong> on 
                high-quality canvas, pillows, and mugs.
              </p>

              {/* Product Icons - Simple */}
              <div className="flex justify-center gap-6 py-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center text-2xl">
                    🖼️
                  </div>
                  <p className="text-xs text-gray-600">Canvas</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center text-2xl">
                    🛋️
                  </div>
                  <p className="text-xs text-gray-600">Pillows</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center text-2xl">
                    ☕
                  </div>
                  <p className="text-xs text-gray-600">Mugs</p>
                </div>
              </div>

              {/* Email Input - Clean */}
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all"
                  disabled={isSubmitting}
                />
              </div>

              {/* CTA */}
              <Button 
                onClick={handleNotifyMe}
                disabled={isSubmitting || !email.trim()}
                className="w-full h-12 bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold"
              >
                {isSubmitting ? 'Submitting...' : 'Notify Me'}
              </Button>

              {/* Close */}
              <Button 
                onClick={onClose}
                disabled={isSubmitting}
                variant="ghost"
                className="w-full h-10 text-sm text-gray-600"
              >
                Close
              </Button>

              {/* Trust Message */}
              <p className="text-xs text-gray-500 text-center">
                We'll email you as soon as the store opens. No spam, we promise! 🐾
              </p>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="flex flex-col items-center text-center gap-6 p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                You're on the list!
              </h3>
              <p className="text-gray-600">
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
