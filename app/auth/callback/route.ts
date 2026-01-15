import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/en'

  if (code) {
    const cookieStore = await cookies()
    
    // Create response first
    const response = NextResponse.redirect(`${origin}${next}`)
    
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
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            } catch (error) {
              console.error('Error setting cookies:', error)
            }
          },
        },
      }
    )
    
    // Exchange the auth code for a user session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/?error=auth-failed`)
    }
    
    if (data.session) {
      console.log('Session created successfully for user:', data.user?.email)
      // Revalidate the layout to update the navbar with the new user state
      revalidatePath('/', 'layout')
      // Return the response with cookies set
      return response
    }
  }

  // If error, redirect to home with an error query param
  console.error('No code provided or session creation failed')
  return NextResponse.redirect(`${origin}/?error=auth-code-error`)
}
