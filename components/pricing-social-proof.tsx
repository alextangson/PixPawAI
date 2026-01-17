'use client';

import { useEffect, useState } from 'react';
import { Star, CheckCircle, TrendingUp, Users } from 'lucide-react';

interface SocialProofProps {
  dict: any;
}

const mockNotifications = [
  { name: 'Sarah M.', action: 'upgraded to Pro', location: 'San Francisco', tier: 'pro' },
  { name: 'James L.', action: 'purchased Master', location: 'New York', tier: 'master' },
  { name: 'Emily R.', action: 'upgraded to Pro', location: 'Los Angeles', tier: 'pro' },
  { name: 'Michael T.', action: 'purchased Starter', location: 'Chicago', tier: 'starter' },
  { name: 'Lisa K.', action: 'upgraded to Pro', location: 'Seattle', tier: 'pro' },
];

export function FloatingNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(mockNotifications[0]);

  useEffect(() => {
    const showNotification = () => {
      // Pick a random notification
      const randomNotif = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
      setCurrentNotification(randomNotif);
      setIsVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // Show first notification after 3 seconds
    const initialTimeout = setTimeout(showNotification, 3000);

    // Show notification every 30 seconds
    const interval = setInterval(showNotification, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-left duration-300">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-orange-600 flex items-center justify-center text-white font-bold">
              {currentNotification.name[0]}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {currentNotification.name}
              </p>
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            </div>
            <p className="text-sm text-gray-600">
              {currentNotification.action}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              📍 {currentNotification.location} • Just now
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatsBadges({ dict }: SocialProofProps) {
  const socialProof = dict?.pricing?.socialProof || {};
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
      <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 border border-orange-100 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-coral/10 mb-3">
          <Users className="w-6 h-6 text-coral" />
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          8,234+
        </div>
        <p className="text-sm text-gray-600">
          {socialProof.upgradeCount || 'Users upgraded to Pro'}
        </p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border border-green-100 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
          <Star className="w-6 h-6 text-green-500 fill-green-500" />
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          85%
        </div>
        <p className="text-sm text-gray-600">
          {socialProof.satisfaction || 'Pro user satisfaction rate'}
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 mb-3">
          <TrendingUp className="w-6 h-6 text-blue-500" />
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          68%
        </div>
        <p className="text-sm text-gray-600">
          {socialProof.proChoice || 'Choose Pro Bundle'}
        </p>
      </div>
    </div>
  );
}

interface Testimonial {
  name: string;
  role: string;
  location: string;
  quote: string;
  rating: number;
  tier: 'starter' | 'pro' | 'master';
  verified: boolean;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Mitchell',
    role: 'Golden Retriever Mom',
    location: 'San Francisco, CA',
    quote: 'Upgraded to Pro and got the perfect portrait on the first try! The 3-choice feature is a game-changer.',
    rating: 5,
    tier: 'pro',
    verified: true,
  },
  {
    name: 'David Chen',
    role: 'Professional Designer',
    location: 'New York, NY',
    quote: 'Master plan is worth every penny. The 4K quality and commercial license are essential for my client work.',
    rating: 5,
    tier: 'master',
    verified: true,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Cat Parent',
    location: 'Austin, TX',
    quote: 'Started with Starter pack and loved it so much I upgraded to Pro. Best decision ever!',
    rating: 5,
    tier: 'pro',
    verified: true,
  },
];

export function TestimonialCarousel({ dict }: SocialProofProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const socialProof = dict?.pricing?.socialProof || {};

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const current = testimonials[currentIndex];

  return (
    <div className="max-w-3xl mx-auto my-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-orange-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-coral to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
            {current.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900">{current.name}</h4>
              {current.verified && (
                <span title="Verified Purchase">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{current.role}</p>
            <p className="text-xs text-gray-500">📍 {current.location}</p>
          </div>
          <div className="flex gap-1">
            {[...Array(current.rating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
        </div>
        <blockquote className="text-gray-700 text-lg italic leading-relaxed">
          &ldquo;{current.quote}&rdquo;
        </blockquote>
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
            current.tier === 'master' 
              ? 'bg-amber-100 text-amber-700'
              : current.tier === 'pro'
              ? 'bg-orange-100 text-coral'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {current.tier.charAt(0).toUpperCase() + current.tier.slice(1)} User
          </span>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-coral w-8' : 'bg-gray-300'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
