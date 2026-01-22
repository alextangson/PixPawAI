import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// Helper function to process referral code for new users
async function processReferralCode(
  userId: string,
  userEmail: string,
  referralCode: string,
  userIp: string
) {
  try {
    // Import admin client dynamically to avoid circular dependencies
    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminSupabase = createAdminClient()

    // 0. Check if user already has a referral code associated
    const { data: existingProfile, error: profileCheckError } = await adminSupabase
      .from('profiles')
      .select('referred_by_code')
      .eq('id', userId)
      .single()

    if (profileCheckError) {
      console.error('❌ Failed to check existing profile:', profileCheckError)
      return
    }

    // If user already has a referral code, don't process again
    if (existingProfile?.referred_by_code) {
      console.log('ℹ️ User already associated with referral code:', existingProfile.referred_by_code, '- Skipping')
      return
    }

    // 1. Validate referral code
    const { data: codeData, error: codeError } = await adminSupabase
      .from('referral_codes')
      .select('*')
      .eq('code', referralCode.toUpperCase())
      .single()

    if (codeError || !codeData) {
      console.error('⚠️ Invalid referral code:', referralCode)
      return
    }

    // 2. Check if code is active and not expired
    if (!codeData.is_active) {
      console.log('⚠️ Referral code is inactive:', referralCode)
      return
    }

    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      console.log('⚠️ Referral code has expired:', referralCode)
      return
    }

    if (codeData.max_uses !== null && codeData.current_uses >= codeData.max_uses) {
      console.log('⚠️ Referral code has reached max uses:', referralCode)
      return
    }

    // 3. Update user profile with referral information
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({
        referred_by_code: codeData.code,
        referred_by_user_id: codeData.created_by, // NULL for beta invites
      })
      .eq('id', userId)

    if (profileError) {
      console.error('❌ Failed to update profile with referral:', profileError)
      return
    }

    // 4. Create referral claim record (status: pending, will be granted on first generation)
    const { error: claimError } = await adminSupabase
      .from('referral_claims')
      .insert({
        referral_code_id: codeData.id,
        code: codeData.code,
        new_user_id: userId,
        new_user_email: userEmail,
        new_user_ip: userIp,
        referrer_id: codeData.created_by,
        new_user_reward: codeData.new_user_reward,
        referrer_reward: codeData.referrer_reward,
        reward_status: 'pending',
      })

    if (claimError) {
      console.error('❌ Failed to create referral claim:', claimError)
      return
    }

    console.log('✅ Referral claim created successfully:', {
      userId,
      code: codeData.code,
      type: codeData.type,
      newUserReward: codeData.new_user_reward,
      referrerReward: codeData.referrer_reward,
    })

  } catch (error) {
    console.error('❌ Error processing referral code:', error)
  }
}

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
                  path: '/',
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
      
      // ============================================
      // REFERRAL SYSTEM: Check for referral code cookie
      // ============================================
      const referralCodeCookie = cookieStore.get('referral_code')
      
      if (referralCodeCookie?.value) {
        console.log('🔗 Referral code detected in cookie:', referralCodeCookie.value)
        
        // Process referral code asynchronously (don't block redirect)
        // The function will check if user already has a referral code associated
        processReferralCode(
          data.user.id,
          data.user.email || '',
          referralCodeCookie.value,
          request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown'
        ).catch(err => {
          console.error('❌ Failed to process referral code:', err)
        })
      }
      
      // Clear referral code cookie after processing
      if (referralCodeCookie) {
        cookieStore.delete('referral_code')
      }
      
      console.log('✅ Session established, redirecting to:', next)
      
      // Revalidate to update UI
      revalidatePath('/', 'layout')
      
      // Create redirect response
      // Supabase cookies are already set in cookieStore via exchangeCodeForSession
      // We need to explicitly copy them to the redirect response
      const redirectUrl = `${origin}${next}`
      const redirectResponse = NextResponse.redirect(redirectUrl)
      
      // Copy all cookies from cookieStore to redirect response
      // This is necessary because NextResponse.redirect() creates a new response
      // that doesn't automatically include cookies from cookieStore
      const allCookies = cookieStore.getAll()
      console.log('📦 Copying cookies to redirect response:', allCookies.map(c => c.name).join(', '))
      
      allCookies.forEach((cookie) => {
        // Copy all cookies, but ensure proper settings for auth cookies
        const isAuthCookie = cookie.name.includes('auth') || 
                            cookie.name.startsWith('sb-') ||
                            cookie.name.includes('supabase')
        
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: isAuthCookie,
          maxAge: isAuthCookie ? 60 * 60 * 24 * 7 : undefined, // 7 days for auth cookies
        })
      })
      
      console.log('✅ Redirect response prepared with cookies')
      return redirectResponse
    }
  }

  // If error, redirect to home with an error query param
  console.error('❌ No code provided or session creation failed')
  return NextResponse.redirect(`${origin}/en?error=auth-code-missing`)
}
