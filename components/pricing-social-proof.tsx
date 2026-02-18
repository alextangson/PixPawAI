'use client';

import { Star, Users, Sparkles, Award } from 'lucide-react';

interface SocialProofProps {
  dict: any;
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
          <Star className="w-6 h-6 inline-block text-coral" />
        </div>
        <p className="text-sm text-gray-600">
          {socialProof.upgradeCount || 'Trusted by pet lovers worldwide'}
        </p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border border-green-100 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
          <Sparkles className="w-6 h-6 text-green-500" />
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          3x
        </div>
        <p className="text-sm text-gray-600">
          {socialProof.satisfaction || 'Multi-image selection'}
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 mb-3">
          <Award className="w-6 h-6 text-blue-500" />
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          #1
        </div>
        <p className="text-sm text-gray-600">
          {socialProof.proChoice || 'Most popular choice'}
        </p>
      </div>
    </div>
  );
}

