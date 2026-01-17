import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/en'

  console.log('🔐 Auth callback triggered', { code: code?.substring(0, 10), origin, next })

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, {
                  ...options,
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                })
              })
            } catch (error) {
              console.error('❌ Error setting cookies in cookieStore:', error)
            }
          },
        },
      }
    )
    
    // Exchange the auth code for a user session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ Error exchanging code for session:', error.message, error.status)
      return NextResponse.redirect(`${origin}/en?error=auth-failed&details=${encodeURIComponent(error.message)}`)
    }
    
    if (data.session) {
      console.log('✅ Session created successfully for user:', data.user?.email)
      
      // Create response with proper cookie settings
      const response = NextResponse.redirect(`${origin}${next}`)
      
      // Set cookies on the response
      const allCookies = cookieStore.getAll()
      allCookies.forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value, {
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: cookie.name.includes('auth-token'),
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
      })
      
      console.log('🍪 Cookies set:', allCookies.map(c => c.name))
      
      // Revalidate to update UI
      revalidatePath('/', 'layout')
      
      return response
    }
  }

  // If error, redirect to home with an error query param
  console.error('❌ No code provided or session creation failed')
  return NextResponse.redirect(`${origin}/en?error=auth-code-missing`)
}
