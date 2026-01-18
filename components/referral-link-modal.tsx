'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, Users, Gift, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/lib/auth/actions';

interface ReferralLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferralLinkModal({ isOpen, onClose }: ReferralLinkModalProps) {
  const [referralUrl, setReferralUrl] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReferralLink();
    }
  }, [isOpen]);

  const fetchReferralLink = async () => {
    setLoading(true);
    setError(null);
    setIsUnauthorized(false);

    try {
      // Try to get existing referral link
      const getResponse = await fetch('/api/referral/generate');
      
      // Check if user is not logged in
      if (getResponse.status === 401) {
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }

      const getData = await getResponse.json();

      if (getData.hasReferralCode) {
        setReferralUrl(getData.referralUrl);
        setReferralCode(getData.referralCode);
        setStats(getData.stats);
        setLoading(false);
        return;
      }

      // Generate new referral link
      const postResponse = await fetch('/api/referral/generate', {
        method: 'POST',
      });

      if (postResponse.status === 401) {
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }

      if (!postResponse.ok) {
        throw new Error('Failed to generate referral link');
      }

      const postData = await postResponse.json();
      setReferralUrl(postData.referralUrl);
      setReferralCode(postData.referralCode);
      setStats(postData.stats);

    } catch (err: any) {
      console.error('Failed to fetch referral link:', err);
      setError(err.message || 'Failed to load referral link');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    await signInWithGoogle('/en/pricing');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareNatively = async () => {
    if (typeof window !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'PixPaw AI - Turn Your Pet Into 3D Art!',
          text: 'Try PixPaw AI and get 5 free credits! Transform your pet into amazing 3D Pixar-style portraits.',
          url: referralUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback to copy
      copyToClipboard();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-coral to-orange-600 rounded-full mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Share & Earn Credits
          </h2>
          <p className="text-gray-600">
            Invite friends and both of you get <span className="font-bold text-coral">5 free credits</span>!
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral"></div>
          </div>
        ) : isUnauthorized ? (
          /* Login Prompt for Guests */
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-coral to-orange-600 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Sign In to Get Your Referral Link
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Create a free account to generate your referral link and start earning credits by inviting friends!
            </p>
            <Button
              onClick={handleSignIn}
              className="bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In with Google
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Free to join • Get 2 free credits on signup
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchReferralLink} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <Users className="w-5 h-5 text-coral mx-auto mb-1" />
                  <div className="text-2xl font-bold text-gray-900">{stats.successfulReferrals}</div>
                  <div className="text-xs text-gray-600">Referred</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <Gift className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-gray-900">{stats.totalRewardsEarned}</div>
                  <div className="text-xs text-gray-600">Credits Earned</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <Share2 className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-gray-900">{stats.remainingReferrals}</div>
                  <div className="text-xs text-gray-600">Remaining</div>
                </div>
              </div>
            )}

            {/* Warning if reached limit */}
            {stats?.hasReachedLimit && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800 text-center">
                  🎉 You've reached the maximum referral limit (50 friends)!
                </p>
              </div>
            )}

            {/* Referral Code Display */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Referral Code
              </label>
              <div className="bg-gradient-to-r from-coral/10 to-orange-100 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-coral tracking-wider">
                  {referralCode}
                </div>
              </div>
            </div>

            {/* Referral Link */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Referral Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  onClick={copyToClipboard}
                  className="bg-coral hover:bg-orange-600 text-white px-6"
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Share Button - Only show on supported browsers */}
            {typeof window !== 'undefined' && 'share' in navigator && (
              <Button
                onClick={shareNatively}
                className="w-full bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold py-3 mb-4"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share with Friends
              </Button>
            )}

            {/* How it works */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">How it works:</h4>
              <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                <li>Share your referral link with friends</li>
                <li>They sign up and create their first portrait</li>
                <li>You both get <span className="font-bold text-coral">5 free credits</span>!</li>
                <li>You can refer up to {stats?.maxReferrals || 50} friends</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
