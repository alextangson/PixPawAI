/**
 * Auth Required Dialog
 * 
 * Friendly prompt for users to sign in before making a purchase
 */

'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, X, Loader2, Mail, Lock, CreditCard } from 'lucide-react';
import { signInWithGoogle, signInWithEmail } from '@/lib/auth/actions';

interface AuthRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthRequiredDialog({
  isOpen,
  onClose,
}: AuthRequiredDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      // Redirect back to pricing page after login
      const redirectTo = typeof window !== 'undefined' ? window.location.pathname : '/';
      await signInWithGoogle(redirectTo);
      // Browser will redirect to Google
    } catch (error) {
      console.error('Login error:', error);
      setMessage('Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage('');

    try {
      const redirectTo = typeof window !== 'undefined' ? window.location.pathname : '/';
      const result = await signInWithEmail(email, redirectTo);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage(result.message || 'Check your email for the magic link!');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 bg-gradient-to-br from-orange-50 via-white to-coral/5 overflow-hidden">
        <DialogTitle className="sr-only">
          Sign in required to complete purchase
        </DialogTitle>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 transition-colors z-20"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-coral to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Sign In to Continue
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed text-sm">
            Please sign in to complete your purchase and start creating amazing pet portraits!
          </p>

          {/* Benefits */}
          <div className="mb-6 space-y-2 text-left bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CreditCard className="w-4 h-4 text-green-600" />
              <span>Secure payment processing</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Save your creations forever</span>
            </div>
          </div>

          {/* Login Options */}
          <div className="space-y-3">
            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 font-semibold py-4 text-base shadow-sm hover:shadow transition-all"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
                  Continue with Google
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gradient-to-br from-orange-50 via-white to-coral/5 px-3 text-gray-400 font-medium uppercase tracking-wider">
                  or
                </span>
              </div>
            </div>

            {/* Email Magic Link */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-12 pl-11 pr-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold py-4 text-base shadow-lg hover:shadow-xl transition-all"
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
              <div className={`text-sm text-center p-3 rounded-lg ${
                message.includes('error') || message.includes('Failed')
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Trust Signal */}
          <p className="text-xs text-gray-500 mt-6">
            🔒 Free to sign up • No credit card required
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
