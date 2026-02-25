'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Gift, Loader2 } from 'lucide-react'
import { signInWithGoogle } from '@/lib/auth/actions'

interface GuestSignupPromptProps {
  isOpen: boolean
  onClose: () => void
  message?: string
  remaining?: number
  total?: number
}

export function GuestSignupPrompt({
  isOpen,
  onClose,
  message,
  remaining = 0,
  total = 2
}: GuestSignupPromptProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      // Redirect back to the current page with hash to reopen modal
      const redirectTo = typeof window !== 'undefined' ? window.location.pathname + '#upload' : '/'
      await signInWithGoogle(redirectTo)
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-0 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-coral/5">
        {/* Accessible title for screen readers */}
        <DialogTitle className="sr-only">Sign up for more free credits</DialogTitle>

        {/* Header Section */}
        <div className="relative p-6 sm:p-8 pb-4 sm:pb-6 text-center">
          {/* Decorative Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-coral/10 to-orange-100/20"></div>

          <div className="relative">
            {/* Icon */}
            <div className="mx-auto w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-coral to-orange-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-xl">
              <Gift className="w-7 sm:w-8 h-7 sm:h-8 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              🎨 Love Your Pet Portrait?
            </h2>
            <p className="text-gray-600 text-sm">
              Sign up for <span className="font-bold text-coral">2 FREE credits</span> to keep creating!
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="px-6 sm:px-8 pb-4 sm:pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-gray-700">
              {message || `You've used all your free generations today. Sign up to get 2 free credits and unlimited creative possibilities!`}
            </p>
          </div>

          {/* Remaining indicator */}
          {remaining === 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                {total} free generations per day • <span className="font-semibold text-coral">Unlimited</span> with account
              </p>
            </div>
          )}
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
                Signing up...
              </div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Sign Up & Get 2 Free Credits
              </>
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
            Free to sign up • No credit card required • Cancel anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
