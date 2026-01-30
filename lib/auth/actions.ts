'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signInWithGoogle(redirectTo: string = '/') {
  const supabase = await createClient()
  
  // 从请求头动态获取真实访问的 origin，适配所有环境（localhost:3000/3001/生产域名）
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3001'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const origin = `${protocol}://${host}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=${redirectTo}`,
    },
  })

  if (error) {
    console.error('Error signing in with Google:', error)
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signInWithEmail(email: string, redirectTo: string = '/') {
  const supabase = await createClient()
  
  // 从请求头动态获取真实访问的 origin，适配所有环境（localhost:3000/3001/生产域名）
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3001'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const origin = `${protocol}://${host}`

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${redirectTo}`,
    },
  })

  if (error) {
    console.error('Error signing in with email:', error)
    return { error: error.message }
  }

  return { success: true, message: 'Check your email for the magic link!' }
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error)
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // 静默处理未登录情况，不记录错误日志
  if (error) {
    // AuthSessionMissingError 是正常情况（用户未登录），不需要记录
    if (error.name !== 'AuthSessionMissingError') {
      console.error('Error getting user:', error)
    }
    return null
  }

  return user
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Error getting session:', error)
    return null
  }

  return session
}
