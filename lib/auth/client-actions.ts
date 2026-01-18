'use client';

import { createClient } from '@/lib/supabase/client';

type SignInResult = {
  success?: boolean;
  error?: string;
  popup?: boolean;
  session?: any;
};

/**
 * Sign in with Google using popup window (client-side)
 * Better UX - doesn't interrupt user's browsing
 */
export async function signInWithGooglePopup(): Promise<SignInResult> {
  const supabase = createClient();
  const origin = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    // Get the OAuth URL without auto-redirecting
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
        skipBrowserRedirect: true, // We'll handle the popup manually
      },
    });

    if (error) {
      console.error('Error getting Google OAuth URL:', error);
      return { error: error.message };
    }

    if (!data?.url) {
      return { error: 'Failed to get OAuth URL' };
    }

    // Open popup window
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      data.url,
      'Google Sign In',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      // Popup blocked - fallback to redirect
      console.warn('Popup blocked, falling back to redirect');
      window.location.href = data.url;
      return { success: true, popup: false };
    }

    // Monitor popup and auth state
    return new Promise((resolve) => {
      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in via popup');
          
          // Close popup if still open
          if (popup && !popup.closed) {
            popup.close();
          }
          
          // Clean up listener
          subscription.unsubscribe();
          
          // Reload page to refresh user state
          window.location.reload();
          
          resolve({ success: true, session, popup: true });
        }
      });

      // Check if popup was closed manually
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          subscription.unsubscribe();
          
          // Check if user managed to sign in before closing
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              window.location.reload();
              resolve({ success: true, session, popup: true });
            } else {
              resolve({ error: 'Sign in cancelled', popup: true });
            }
          });
        }
      }, 500);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkPopupClosed);
        subscription.unsubscribe();
        if (popup && !popup.closed) {
          popup.close();
        }
        resolve({ error: 'Sign in timeout', popup: true });
      }, 5 * 60 * 1000);
    });

  } catch (error: any) {
    console.error('Unexpected error during Google sign in:', error);
    return { error: error.message || 'Failed to sign in with Google' };
  }
}

/**
 * Sign in with Google using full page redirect (fallback)
 */
export async function signInWithGoogleRedirect(): Promise<SignInResult> {
  const supabase = createClient();
  const origin = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Error signing in with Google:', error);
    return { error: error.message };
  }

  // Browser will automatically redirect
  return { success: true };
}
