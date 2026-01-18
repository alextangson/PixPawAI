'use client';

import { useEffect, useState } from 'react';
import { Gift, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function ReferralWelcomeToast() {
  const [show, setShow] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [referralType, setReferralType] = useState<'beta_invite' | 'user_referral' | null>(null);

  useEffect(() => {
    checkForReferralReward();
  }, []);

  const checkForReferralReward = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Check if user was referred
      const { data: profile } = await supabase
        .from('profiles')
        .select('referred_by_code, created_at')
        .eq('id', user.id)
        .single();

      if (!profile?.referred_by_code) return;

      // Check if user is new (created within last 5 minutes)
      const createdAt = new Date(profile.created_at);
      const now = new Date();
      const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / 1000 / 60;

      if (minutesSinceCreation > 5) return; // Only show for very new users

      // Check if there's a pending referral claim
      const { data: claim } = await supabase
        .from('referral_claims')
        .select('new_user_reward, code')
        .eq('new_user_id', user.id)
        .eq('reward_status', 'pending')
        .single();

      if (claim) {
        setRewardAmount(claim.new_user_reward);
        
        // Determine type based on code prefix
        const type = claim.code.startsWith('REF') ? 'user_referral' : 'beta_invite';
        setReferralType(type);
        
        setShow(true);

        // Auto-hide after 8 seconds
        setTimeout(() => {
          setShow(false);
        }, 8000);
      }
    } catch (error) {
      console.error('Failed to check referral reward:', error);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-coral/30 p-5 max-w-sm">
        {/* Close Button */}
        <button
          onClick={() => setShow(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 pr-6">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-coral to-orange-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <Gift className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              🎉 Welcome to PixPaw!
            </h3>
            <p className="text-sm text-gray-700 mb-2">
              {referralType === 'beta_invite' 
                ? `You've received ${rewardAmount} free credits to get started!`
                : `You and your friend each got ${rewardAmount} free credits!`
              }
            </p>
            <p className="text-xs text-coral font-semibold">
              Complete your first portrait to unlock your credits ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
