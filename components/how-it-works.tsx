'use client';

import { Upload, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HowItWorksProps {
  dict: {
    howItWorks: {
      title: string;
      steps: {
        upload: {
          title: string;
          description: string;
        };
        aiMagic: {
          title: string;
          description: string;
        };
        shop: {
          title: string;
          description: string;
        };
      };
    };
  };
  onOpenUpload: () => void;
}

export function HowItWorks({ dict, onOpenUpload }: HowItWorksProps) {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1: Pick Your Best Shot (Interactive) */}
          <button
            onClick={onOpenUpload}
            className="group text-left w-full"
          >
            <div className="relative bg-gradient-to-br from-orange-50 to-coral/10 rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden h-full">
              {/* Step Number */}
              <div className="absolute top-4 left-4 w-12 h-12 bg-coral rounded-full flex items-center justify-center text-white text-xl font-bold shadow-xl z-20">
                1
              </div>

              {/* Visual: Upload Zone */}
              <div className="relative h-48 mb-6 bg-white rounded-2xl border-2 border-dashed border-coral/30 flex flex-col items-center justify-center group-hover:border-coral group-hover:bg-coral/5 transition-all">
                <Upload className="w-12 h-12 text-coral mb-3 group-hover:scale-110 transition-transform" />
                <div className="bg-coral hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  Select Photo
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Pick Your Best Shot
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  No pro photos needed. Just make sure the face is visible.
                </p>
              </div>
            </div>
          </button>

          {/* Step 2: Watch the Magic */}
          <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            {/* Step Number */}
            <div className="absolute top-4 left-4 w-12 h-12 bg-coral rounded-full flex items-center justify-center text-white text-xl font-bold shadow-xl z-20">
              2
            </div>

            {/* Visual: Processing Animation */}
            <div className="relative h-48 mb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=300&fit=crop"
                alt="AI Processing"
                className="w-full h-full object-cover opacity-30"
              />
              {/* Scanning Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="font-semibold text-lg drop-shadow-lg">Processing...</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Watch the Magic
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI captures your pet's personality in ~30 seconds.
              </p>
            </div>
          </div>

          {/* Step 3: Preview & Customize */}
          <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            {/* Step Number */}
            <div className="absolute top-4 left-4 w-12 h-12 bg-coral rounded-full flex items-center justify-center text-white text-xl font-bold shadow-xl z-20">
              3
            </div>

            {/* Visual: Phone Mockup with Result */}
            <div className="relative h-48 mb-6 flex items-center justify-center">
              <div className="w-32 h-48 bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-800 relative">
                {/* Phone Screen */}
                <img
                  src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=300&fit=crop"
                  alt="Result preview"
                  className="w-full h-full object-cover"
                />
                {/* Success Checkmark */}
                <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-2">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Preview & Customize
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Love the result? Download in 4K or print it on a pillow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
