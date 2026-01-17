'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Gift, Lock, Loader2 } from 'lucide-react'
import { signInWithGoogle } from '@/lib/auth/actions'

interface GuestLoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GuestLoginModal({ isOpen, onClose }: GuestLoginModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      // Redirect back to the current page after login
      const redirectTo = typeof window !== 'undefined' ? window.location.pathname : '/'
      await signInWithGoogle(redirectTo)
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-0 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-coral/5">
        {/* Header Section */}
        <div className="relative p-6 sm:p-8 pb-4 sm:pb-6 text-center">
          {/* Decorative Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-coral/10 to-orange-100/20"></div>
          
          <div className="relative">
            {/* Icon */}
            <div className="mx-auto w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-coral to-orange-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-xl">
              <Sparkles className="w-7 sm:w-8 h-7 sm:h-8 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Almost There!
            </h2>
            <p className="text-gray-600 text-sm">
              Sign in to create your PixPaw masterpiece
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="px-6 sm:px-8 pb-4 sm:pb-6 space-y-2.5 sm:space-y-3">
          <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gift className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Get 2 Free Credits</p>
              <p className="text-xs text-gray-600">Start creating immediately</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Save Your Creations</p>
              <p className="text-xs text-gray-600">Access your gallery anytime</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Your Photo is Safe</p>
              <p className="text-xs text-gray-600">We've saved your upload</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-2.5 sm:space-y-3">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full min-h-[48px] sm:h-12 bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 touch-manipulation"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </div>
            ) : (
              'Sign in to Continue'
            )}
          </Button>
          
          <Button
            onClick={onClose}
            disabled={isLoading}
            variant="ghost"
            className="w-full min-h-[44px] sm:h-10 text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-50 touch-manipulation"
          >
            Maybe Later
          </Button>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 pb-4 sm:pb-6 text-center">
          <p className="text-xs text-gray-500">
            Free to sign up • No credit card required
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
