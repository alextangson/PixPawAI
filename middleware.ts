import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { i18n } from './lib/i18n-config'
import { updateSession } from './lib/supabase/middleware'

import { match as matchLocale } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

const ROOT_SEO_PATHS = new Set([
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/robots.txt',
  '/llms.txt',
  '/ai.txt',
])

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

function isRootSeoPath(pathname: string): boolean {
  const normalized = normalizePath(pathname)
  if (ROOT_SEO_PATHS.has(pathname) || ROOT_SEO_PATHS.has(normalized)) {
    return true
  }
  return pathname.startsWith('/.well-known') || normalized.startsWith('/.well-known')
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('sb-') || cookie.name.includes('-auth-token')
  )
}

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
  const pathname = request.nextUrl.pathname

  // Serve IndexNow key file at standard path (required for domain verification)
  const INDEXNOW_KEY = process.env.INDEXNOW_API_KEY || '5d6f3058001c4ea8a1db7fc252f417fb'
  if (pathname === `/${INDEXNOW_KEY}.txt`) {
    return new NextResponse(INDEXNOW_KEY, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // llms.txt / sitemap / robots / .well-known must 200 at the site root.
  // Never 301 them into /en/* (that 404s).
  if (isRootSeoPath(pathname)) {
    return NextResponse.next()
  }

  // Skip middleware for RSC prefetch requests
  const requestHeaders = new Headers(request.headers)
  const isRSCRequest = requestHeaders.get('RSC') === '1' ||
                       requestHeaders.get('Next-Router-Prefetch') === '1'

  // For RSC requests, just pass through
  if (isRSCRequest) {
    return NextResponse.next()
  }

  // Only refresh the Supabase session when auth cookies are present.
  // Calling getUser() on every anonymous marketing hit Set-Cookies the
  // response and forces cache-control: private, no-store.
  const supabaseResponse = hasSupabaseAuthCookie(request)
    ? await updateSession(request)
    : NextResponse.next()

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

  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // Handle trailing slash for /en → /en/
  if (pathname === '/en') {
    return NextResponse.redirect(new URL('/en/', request.url), { status: 301 })
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
      { status: 301 }
    )
  }

  // Return the Supabase response to maintain session cookies
  return supabaseResponse
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  // Also ignore static files and root SEO/GEO files so the locale matcher
  // cannot 301 /llms.txt, /ai.txt, /sitemap.xml, or /.well-known into /en/*.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots\\.txt|sitemap\\.xml|sitemap_index\\.xml|llms\\.txt|ai\\.txt|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|txt|xml|woff|woff2|ttf|eot)$).*)',
    '/5d6f3058001c4ea8a1db7fc252f417fb.txt',
  ],
}
