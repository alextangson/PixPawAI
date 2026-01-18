'use client';

import { useState } from 'react';
import { Gift, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReferralLinkModal } from '@/components/referral-link-modal';

interface LowCreditsReferralBannerProps {
  credits: number;
  onDismiss?: () => void;
}

export function LowCreditsReferralBanner({ credits, onDismiss }: LowCreditsReferralBannerProps) {
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show if user has 0-2 credits
  if (credits > 2 || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <>
      <div className="relative bg-gradient-to-r from-orange-50 via-coral/10 to-orange-50 border-2 border-coral/30 rounded-2xl p-5 shadow-lg animate-in fade-in slide-in-from-top-2">
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 pr-8">
          {/* Icon */}
          <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-coral to-orange-600 rounded-full flex items-center justify-center shadow-lg">
            <Gift className="w-7 h-7 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {credits === 0 ? 'Out of Credits?' : 'Running Low on Credits?'}
            </h3>
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              {credits === 0 
                ? "Don't stop creating! Invite friends and both get 5 free credits instantly."
                : "Keep the magic going! Share PixPaw with friends and earn 5 credits for each friend who tries it."
              }
            </p>

            {/* CTA Button */}
            <Button
              onClick={() => setShowReferralModal(true)}
              className="bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold px-6 py-2.5 h-auto shadow-md hover:shadow-lg transition-all"
            >
              <Gift className="w-4 h-4 mr-2" />
              Get Free Credits Now
            </Button>

            {/* Small Print */}
            <p className="text-xs text-gray-500 mt-3">
              ✨ Unlimited referrals • Both you and your friend get 5 credits
            </p>
          </div>
        </div>
      </div>

      {/* Referral Modal */}
      <ReferralLinkModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
      />
    </>
  );
}
