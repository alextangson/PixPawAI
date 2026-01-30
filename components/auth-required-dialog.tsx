/**
 * Auth Required Dialog
 * 
 * Friendly prompt for users to sign in before making a purchase
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, X } from 'lucide-react';

interface AuthRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

export function AuthRequiredDialog({
  isOpen,
  onClose,
  onSignIn,
  onSignUp,
}: AuthRequiredDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 bg-white overflow-hidden">
        <DialogTitle className="sr-only">
          Sign in required
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
            <div className="w-16 h-16 bg-gradient-to-br from-coral to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Sign In Required
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Please sign in or create a free account to complete your purchase and start creating amazing pet portraits!
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onSignIn}
              className="w-full bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold py-4 text-base shadow-lg hover:shadow-xl transition-all"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </Button>

            <Button
              onClick={onSignUp}
              variant="outline"
              className="w-full border-2 border-gray-300 hover:border-coral hover:bg-orange-50 text-gray-900 font-semibold py-4 text-base transition-all"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Create Free Account
            </Button>
          </div>

          {/* Trust Signal */}
          <p className="text-xs text-gray-500 mt-6">
            🔒 Secure sign in • No credit card required for free account
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
