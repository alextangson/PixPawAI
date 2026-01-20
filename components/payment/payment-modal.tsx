/**
 * Payment Modal Component
 * 
 * Real payment checkout modal (replaces fake door)
 * Integrates PayPal advanced buttons
 * Beautiful design with gradient accents
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Shield, Zap, CheckCircle, Sparkles, Lock, Clock } from 'lucide-react';
import { PayPalButtonsAdvanced } from './paypal-buttons-advanced';

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
    tagline: '✨ Perfect for Social Sharing',
    icon: Sparkles,
    gradient: 'from-blue-500 to-cyan-500',
    badgeColor: 'bg-blue-500',
    features: [
      '15 High-Resolution Generations',
      'No Watermarks',
      'All 9 Aspect Ratios',
      '8 Style Options',
      'Personal Use License',
    ],
  },
  pro: {
    name: 'Pro Bundle',
    tagline: '🔥 Best Value - Most Popular',
    icon: Zap,
    gradient: 'from-coral to-orange-600',
    badgeColor: 'bg-coral',
    features: [
      '50 Generation Credits',
      '✨ 3-Image Selection',
      '2K High Resolution (2048px)',
      '15 Premium Styles',
      '10% Off Physical Products',
    ],
  },
  master: {
    name: 'Master Plan',
    tagline: '👑 For Professionals',
    icon: Shield,
    gradient: 'from-purple-600 to-pink-600',
    badgeColor: 'bg-purple-600',
    features: [
      '200 Ultra-HD Generations',
      '5-Image Selection (Best Quality)',
      '4K Resolution (4096px)',
      '30+ Premium Styles',
      'Priority Queue (2x Speed)',
      'Full Commercial License',
      'Priority Support (4h)',
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
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);
  const tierInfo = TIER_INFO[tier];
  const Icon = tierInfo.icon;

  // Pre-warm PayPal token when modal opens
  React.useEffect(() => {
    if (isOpen) {
      // Reset success state when modal opens
      setPaymentSuccess(false);
      
      // Warmup token in background
      fetch('/api/payments/paypal/warmup', { method: 'POST' })
        .then(() => console.log('🔥 PayPal token pre-warmed'))
        .catch(() => console.log('⚠️ Token warmup failed (not critical)'));
    }
  }, [isOpen]);

  // Handle payment success
  const handlePaymentSuccess = (payment: any) => {
    setPaymentSuccess(true);
    
    // Auto-close after 5 seconds and reload
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 5000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] p-0 bg-white overflow-hidden">
        <DialogTitle className="sr-only">
          Complete Purchase - {tierInfo.name}
        </DialogTitle>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 transition-colors z-20"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Conditional Rendering: Success OR Payment Form */}
        {paymentSuccess ? (
          /* Success View - Full screen */
          <div className="flex items-center justify-center p-12 min-h-[600px] bg-gradient-to-br from-green-50 via-white to-blue-50">
            <div className="text-center max-w-md relative">
              {/* Confetti decoration */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full opacity-70"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      backgroundColor: ['#FF6B6B', '#FFA500', '#FFD700', '#90EE90', '#87CEEB'][Math.floor(Math.random() * 5)],
                      animation: `float ${2 + Math.random() * 3}s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>

              {/* Success Icon */}
              <div className="flex justify-center mb-6 relative z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-40 animate-ping"></div>
                  <div className="relative w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
                    <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
              
              {/* Success Message */}
              <h3 className="text-4xl font-bold text-gray-900 mb-4 relative z-10">
                <span className="text-5xl mr-2">🎉</span>
                <br />
                Payment Successful!
              </h3>
              
              <p className="text-xl text-gray-700 mb-8 relative z-10">
                You're now a <span className="font-bold text-coral capitalize">{tier}</span> member
              </p>
              
              {/* Credits Badge */}
              <div className="inline-flex items-center gap-4 bg-gradient-to-r from-coral to-orange-600 text-white rounded-2xl px-10 py-5 shadow-2xl mb-8 relative z-10">
                <span className="text-5xl font-black">+{credits}</span>
                <div className="text-left border-l-2 border-white/40 pl-4">
                  <div className="text-lg font-bold">Credits</div>
                  <div className="text-sm opacity-90">Added</div>
                </div>
              </div>
              
              {/* Auto-close message */}
              <div className="relative z-10 space-y-2">
                <p className="text-base text-gray-700 font-medium">
                  Updating your account...
                </p>
                <p className="text-sm text-gray-500">
                  This window will close automatically in 5 seconds
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Payment Form - Two Column Layout */
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
              
              {/* PayPal Buttons */}
              <PayPalButtonsAdvanced
                tier={tier}
                price={price}
                credits={credits}
                onSuccess={handlePaymentSuccess}
                onError={(error) => {
                  console.error('Payment error:', error);
                }}
              />

              {/* Security & Info */}
              <div className="mt-6 space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-800 text-center font-medium flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    Secure payment via PayPal
                  </p>
                </div>
                
                <div className="text-center space-y-1.5">
                  <p className="text-xs text-gray-600">
                    💳 Pay with PayPal, Card, Apple Pay, or Google Pay
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
        )}
      </DialogContent>
    </Dialog>
  );
}

// Add floating animation for confetti
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
`;
if (typeof document !== 'undefined' && !document.head.querySelector('#paypal-confetti-style')) {
  style.id = 'paypal-confetti-style';
  document.head.appendChild(style);
}
