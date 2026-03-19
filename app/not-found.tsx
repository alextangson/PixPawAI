'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-orange-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-extrabold text-coral opacity-20 select-none">
            404
          </div>
          <div className="relative -mt-16">
            <div className="text-6xl mb-4">🐾</div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Oops! Page Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Looks like this page wandered off...
            </p>
            <p className="text-base text-gray-500">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link href="/en">
            <Button
              size="lg"
              className="bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>

          <Link href="/en/gallery">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-gray-300 hover:border-coral hover:bg-orange-50 font-semibold px-8 py-6 text-lg transition-all"
            >
              <Search className="w-5 h-5 mr-2" />
              Browse Gallery
            </Button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Popular Pages
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/en/pricing"
              className="text-coral hover:text-orange-600 font-medium hover:underline transition-colors"
            >
              Pricing Plans
            </Link>
            <Link
              href="/en/blog/"
              className="text-coral hover:text-orange-600 font-medium hover:underline transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/en/dashboard"
              className="text-coral hover:text-orange-600 font-medium hover:underline transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/en#upload"
              className="text-coral hover:text-orange-600 font-medium hover:underline transition-colors"
            >
              Create Portrait
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-sm text-gray-500 mt-8">
          Need help? Contact us at{' '}
          <a
            href="mailto:support@pixpawai.com"
            className="text-coral hover:underline font-medium"
          >
            support@pixpawai.com
          </a>
        </p>
      </div>
    </div>
  );
}
