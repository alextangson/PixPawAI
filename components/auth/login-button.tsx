'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { signInWithEmail, signInWithGoogle } from '@/lib/auth/actions'
import { Mail, Loader2 } from 'lucide-react'
import { BRANDING } from '@/lib/constants/branding'

interface LoginButtonProps {
  children: React.ReactNode
  redirectTo?: string
}

export function LoginButton({ children, redirectTo = '/' }: LoginButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      await signInWithGoogle(redirectTo)
      // Browser will redirect to Google
    } catch (error) {
      console.error('Error:', error)
      setMessage('Failed to sign in with Google')
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setMessage('')

    try {
      const result = await signInWithEmail(email, redirectTo)
      if (result.error) {
        setMessage(result.error)
      } else {
        setMessage(result.message || 'Check your email for the magic link!')
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('Failed to send magic link')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-0 overflow-hidden rounded-3xl shadow-2xl border-0 bg-gradient-to-br from-coral via-orange-500 to-orange-600">
        
        {/* Brand Color Background with White Logo & Card */}
        <div className="px-4 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-16 text-center">
          
          {/* White Logo */}
          <div className="mb-6 sm:mb-10">
            <Image
              src={BRANDING.logos.svg.white}
              alt="PixPaw AI"
              width={280}
              height={90}
              className="mx-auto opacity-95 w-48 sm:w-[280px] h-auto"
            />
          </div>
          
          {/* White Card Container */}
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 lg:p-10 max-w-md mx-auto">
            
            {/* Headline */}
            <DialogHeader className="mb-6 sm:mb-8">
              <DialogTitle className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight mb-2">
                Sign in
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                to continue to PixPaw AI
              </DialogDescription>
            </DialogHeader>

            {/* Login Options */}
            <div className="flex flex-col gap-4">

              {/* Google Sign In */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full min-h-[48px] sm:h-[52px] bg-white hover:bg-gray-50 text-gray-900 border-[1.5px] border-gray-300 font-medium flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all rounded-xl touch-manipulation"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-4 text-gray-400 font-medium uppercase tracking-wider">
                    or
                  </span>
                </div>
              </div>

              {/* Email Magic Link */}
              <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full min-h-[48px] sm:h-[52px] pl-12 pr-4 border-[1.5px] border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral transition-all text-gray-900 placeholder:text-gray-400 bg-white text-base"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full min-h-[48px] sm:h-[52px] bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Get Magic Link'
                  )}
                </Button>
              </form>

              {/* Success/Error Message */}
              {message && (
                <div className={`text-xs text-center p-3 rounded-lg font-medium ${
                  message.includes('error') || message.includes('Failed')
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'bg-green-50 text-green-700 border border-green-100'
                }`}>
                  {message}
                </div>
              )}

            </div>
            
          </div>

          {/* Footer - White Text on Brand Background */}
          <p className="text-xs text-white/80 mt-6 sm:mt-8 leading-relaxed px-2">
            By continuing, you agree to our{' '}
            <a href="#" className="text-white hover:text-white/90 underline font-medium">
              Terms
            </a>
            {' '}and{' '}
            <a href="#" className="text-white hover:text-white/90 underline font-medium">
              Privacy Policy
            </a>
          </p>
          
        </div>

      </DialogContent>
    </Dialog>
  )
}
