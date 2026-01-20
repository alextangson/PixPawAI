'use client';

import Script from 'next/script';

/**
 * Google Analytics 4 Component
 * Tracks page views, events, and conversions
 * 
 * Setup:
 * 1. Get your GA4 Measurement ID from https://analytics.google.com
 * 2. Add to .env.local: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 * 3. Import this component in your root layout
 */
export function Analytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Don't load in development or if ID is not set
  if (!measurementId || process.env.NODE_ENV === 'development') {
    return null;
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  );
}

/**
 * Track custom events
 * Usage: trackEvent('generate_image', { style: 'Pixar 3D', pet_type: 'dog' })
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams);
  }
}

/**
 * Track conversions (purchases, signups, etc.)
 * Usage: trackConversion('purchase', 9.99, 'USD')
 */
export function trackConversion(
  eventName: string,
  value: number,
  currency: string = 'USD'
) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      currency: currency,
      value: value,
    });
  }
}

/**
 * Recommended events to track:
 * 
 * - 'page_view' - Automatic
 * - 'generate_image' - When user generates an image
 * - 'purchase' - When user buys credits
 * - 'share' - When user shares to gallery
 * - 'download' - When user downloads an image
 * - 'signup' - When user creates an account
 * - 'login' - When user logs in
 */
