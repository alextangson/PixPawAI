/**
 * Payment Modal Component
 * 
 * Real payment checkout modal (replaces fake door)
 * Redirects to Creem's hosted checkout
 * Beautiful design with gradient accents
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Shield, Zap, CheckCircle, Sparkles, Clock } from 'lucide-react';
import { CreemCheckoutButton } from './creem-checkout-button';
import { trackEvent } from '@/components/analytics';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 'starter' | 'pro' | 'master';
  price: string;
  credits: number;
}

const TIER_INFO = {
  starter: {
    name: 'Starter Pack',
    tagline: '✨ A simple pack for your first portraits',
    icon: Sparkles,
    gradient: 'from-blue-500 to-cyan-500',
    badgeColor: 'bg-blue-500',
    features: [
      '15 portrait generation credits',
      'Credits never expire',
      'Watermark-free downloads for your portraits',
      'All currently available styles and aspect ratios',
    ],
  },
  pro: {
    name: 'Pro Bundle',
    tagline: '🔥 More room to explore different portraits',
    icon: Zap,
    gradient: 'from-coral to-orange-600',
    badgeColor: 'bg-coral',
    features: [
      '50 portrait generation credits',
      'Credits never expire',
      'Watermark-free downloads for your portraits',
      'All currently available styles and aspect ratios',
    ],
  },
  master: {
    name: 'Master Plan',
    tagline: '👑 Lowest cost per generation',
    icon: Shield,
    gradient: 'from-purple-600 to-pink-600',
    badgeColor: 'bg-purple-600',
    features: [
      '200 portrait generation credits',
      'Credits never expire',
      'Watermark-free downloads for your portraits',
      'All currently available styles and aspect ratios',
    ],
  },
};

export function PaymentModal({ 
  isOpen, 
  onClose, 
  tier, 
  price,
  credits,
}: PaymentModalProps) {
  const tierInfo = TIER_INFO[tier];
  const Icon = tierInfo.icon;
  const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;

  React.useEffect(() => {
    if (isOpen) {
      // Funnel event: reached checkout (bottom-of-funnel for paid-traffic tests)
      trackEvent('begin_checkout', { value: numericPrice, currency: 'USD', tier });
    }
  }, [isOpen, numericPrice, tier]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] p-0 bg-white overflow-hidden !z-[9999]">
        <DialogTitle className="sr-only">
          Complete Purchase - {tierInfo.name}
        </DialogTitle>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 transition-colors z-[10000]"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="grid md:grid-cols-2 min-h-[600px]">
          {/* Left Column - Package Info */}
          <div className="bg-gradient-to-br from-gray-50 to-white p-6 md:p-8 md:border-r border-gray-200">
            {/* Icon and Title */}
            <div className="mb-6">
              <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${tierInfo.gradient} rounded-xl mb-4 shadow-lg`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {tierInfo.name}
              </h2>
              
              <p className="text-sm text-gray-600">
                {tierInfo.tagline}
              </p>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`text-5xl font-black bg-gradient-to-r ${tierInfo.gradient} bg-clip-text text-transparent`}>
                  {price}
                </span>
                <span className="text-gray-500 text-sm">USD</span>
              </div>
              <p className="text-sm text-gray-600">
                {credits} credits • One-time payment
              </p>
            </div>

            {/* Features List */}
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-coral" />
                What's included
              </h3>
              <ul className="space-y-2.5">
                {tierInfo.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Shield className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">Secure</div>
                </div>
                <div>
                  <Zap className="w-5 h-5 text-coral mx-auto mb-1" />
                  <div className="text-xs text-gray-600">Instant</div>
                </div>
                <div>
                  <CheckCircle className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">30-Day</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment */}
          <div className="p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-white to-gray-50">
            <div className="w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                💳 Complete Your Purchase
              </h3>
              
              <p className="text-xs text-gray-600 mb-6 text-center">
                ⚡ Tip: Click button and complete payment quickly for best experience
              </p>
              
              <CreemCheckoutButton tier={tier} />

              {/* Security & Info */}
              <div className="mt-6 space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-800 text-center font-medium flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    Secure payment via Creem
                  </p>
                </div>
                
                <div className="text-center space-y-1.5">
                  <p className="text-xs text-gray-600">
                    💳 Pay securely with available card and wallet methods
                  </p>
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Credits never expire • Use anytime
                  </p>
                  <p className="text-xs text-gray-500">
                    By purchasing, you agree to our{' '}
                    <a href="/en/terms" target="_blank" className="text-coral hover:underline">
                      Terms of Service
                    </a>
                    {' '}and{' '}
                    <a href="/en/refund" target="_blank" className="text-coral hover:underline">
                      Refund Policy
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
