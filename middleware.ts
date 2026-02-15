import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { i18n } from './lib/i18n-config'
import { updateSession } from './lib/supabase/middleware'

import { match as matchLocale } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

function getLocale(request: NextRequest): string | undefined {
  // Negotiator expects plain object so we need to transform headers
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  // @ts-ignore locales are readonly
  const locales: string[] = i18n.locales

  // Use negotiator and intl-localematcher to get best locale
  let languages = new Negotiator({ headers: negotiatorHeaders }).languages(
    locales
  )

  const locale = matchLocale(languages, locales, i18n.defaultLocale)

  return locale
}

export async function middleware(request: NextRequest) {
  // Skip middleware for RSC prefetch requests
  const requestHeaders = new Headers(request.headers)
  const isRSCRequest = requestHeaders.get('RSC') === '1' || 
                       requestHeaders.get('Next-Router-Prefetch') === '1'
  
  // For RSC requests, just pass through
  if (isRSCRequest) {
    return NextResponse.next()
  }
  
  // First, handle Supabase session refresh
  const supabaseResponse = await updateSession(request)
  
  const pathname = request.nextUrl.pathname
  const { searchParams } = request.nextUrl

  // ============================================
  // REFERRAL SYSTEM: Capture ref/invite params
  // ============================================
  // Check for referral code in URL: ?ref=XXX (user referral) or ?invite=XXX (beta invite)
  const refCode = searchParams.get('ref') || searchParams.get('invite')
  
  if (refCode) {
    // Store referral code in cookie (valid for 7 days)
    const response = supabaseResponse || NextResponse.next()
    response.cookies.set('referral_code', refCode.toUpperCase(), {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    
    console.log('🔗 Referral code captured in middleware:', refCode)
    
    // Continue with i18n redirect if needed, but return modified response
    const pathnameIsMissingLocale = i18n.locales.every(
      (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    )
    
    if (pathnameIsMissingLocale && !pathname.startsWith('/auth/')) {
      const locale = getLocale(request)
      const redirectUrl = new URL(
        `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
        request.url
      )
      
      // Preserve query params in redirect (but remove ref/invite to clean URL)
      searchParams.delete('ref')
      searchParams.delete('invite')
      searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value)
      })
      
      const redirectResponse = NextResponse.redirect(redirectUrl)
      redirectResponse.cookies.set('referral_code', refCode.toUpperCase(), {
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
      
      return redirectResponse
    }
    
    return response
  }

  // Skip i18n redirect for /auth routes (API routes)
  if (pathname.startsWith('/auth/')) {
    return supabaseResponse
  }

  // Skip i18n redirect for SEO files (sitemap, robots)
  // These must be accessible at root level for search engines
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    return supabaseResponse || NextResponse.next()
  }

  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // Handle trailing slash for /en → /en/
  if (pathname === '/en') {
    return NextResponse.redirect(new URL('/en/', request.url), { status: 308 })
  }

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request)

    // e.g. incoming request is /products
    // The new URL is now /en/products
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
        request.url
      ),
      { status: 308 }
    )
  }
  
  // Return the Supabase response to maintain session cookies
  return supabaseResponse
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  // Also ignore static files (images, fonts, json, etc.) and RSC prefetch requests
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|woff|woff2|ttf|eot)$).*)',
  ],
}
