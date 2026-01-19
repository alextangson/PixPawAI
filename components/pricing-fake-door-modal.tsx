'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Mail, Bell, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface FakeDoorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 'starter' | 'pro' | 'master';
  price: string;
}

export function PricingFakeDoorModal({ isOpen, onClose, tier, price }: FakeDoorModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const tierNames = {
    starter: 'Starter Pack',
    pro: 'Pro Bundle',
    master: 'Master Plan',
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/payment-waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, tier, price }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setIsSubmitted(true);
      
      // 3秒后关闭
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setEmail('');
      }, 3000);

    } catch (err: any) {
      console.error('Waitlist error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {/* Accessible title for screen readers */}
        <DialogTitle className="sr-only">Payment Coming Soon - Join Waitlist</DialogTitle>
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="text-center py-6">
          {!isSubmitted ? (
            <>
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-coral to-orange-600 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Coming Soon! 🚀
              </h2>
              
              <p className="text-gray-600 mb-4">
                We're putting the finishing touches on our payment system.
              </p>

              {/* Selected Plan Info */}
              <div className="bg-orange-50 rounded-xl p-4 mb-6 border-2 border-coral/20">
                <div className="text-sm text-gray-600 mb-1">You selected:</div>
                <div className="text-xl font-bold text-gray-900">
                  {tierNames[tier]}
                </div>
                <div className="text-2xl font-extrabold text-coral mt-1">
                  {price}
                </div>
              </div>

              {/* Waitlist Form */}
              <div className="mb-6">
                <p className="text-sm text-gray-700 mb-4 font-medium">
                  Get notified when payments go live + exclusive early bird discount!
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral text-gray-900 transition-all"
                    />
                  </div>
                  
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                      {error}
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-6 text-base font-bold bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Joining...
                      </>
                    ) : (
                      <>
                        <Bell className="w-5 h-5 mr-2" />
                        Notify Me + Get 20% Off
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Benefits */}
              <div className="text-left bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm font-semibold text-green-800 mb-2">
                  Early Bird Benefits:
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ 20% launch discount</li>
                  <li>✅ Priority access</li>
                  <li>✅ Exclusive bonus credits</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <span className="text-4xl">✅</span>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  You're on the list!
                </h2>
                
                <p className="text-gray-600">
                  We'll email you at <span className="font-semibold text-coral">{email}</span> when payments go live.
                </p>
                
                <p className="text-sm text-gray-500 mt-4">
                  Check your inbox for a confirmation email.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
