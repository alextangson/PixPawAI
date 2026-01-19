/**
 * Admin API - 搜索用户
 * 
 * 功能：
 * - 通过邮箱搜索用户
 * - 返回用户 ID、邮箱和当前 credits
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. 验证管理员权限
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 检查是否为管理员
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      console.log(`[Admin API] Access denied for user ${user.email}`)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 2. 解析请求参数
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Missing required field: email' },
        { status: 400 }
      )
    }

    // 3. 通过 Auth Admin API 搜索用户（需要 Service Role Key）
    const adminClient = createAdminClient()
    const { data: authData, error: userError } = await adminClient.auth.admin.listUsers()
    
    if (userError) {
      console.error('[Admin API] Error listing users:', userError)
      return NextResponse.json(
        { error: 'Failed to search for user' },
        { status: 500 }
      )
    }

    const foundUser = authData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!foundUser) {
      return NextResponse.json(
        { error: `User not found: ${email}` },
        { status: 404 }
      )
    }

    // 4. 获取用户的 credits（使用 admin client 绕过 RLS）
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .select('credits')
      .eq('id', foundUser.id)
      .single()

    if (profileError) {
      console.error('[Admin API] Error fetching profile:', profileError)
      // 如果 profile 不存在，返回默认值
    }

    // 5. 返回用户信息
    return NextResponse.json({
      success: true,
      user: {
        id: foundUser.id,
        email: foundUser.email || email,
        currentCredits: profileData?.credits || 0
      }
    })

  } catch (error: any) {
    console.error('[Admin API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
