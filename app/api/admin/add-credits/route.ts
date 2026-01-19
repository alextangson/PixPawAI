/**
 * Admin API - 给用户充值 Credits
 * 
 * 功能：
 * - 管理员权限验证
 * - 通过邮箱或 ID 查找用户
 * - 增加用户 credits
 * - 记录操作日志
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
    const { userIdentifier, amount, reason } = await request.json()

    if (!userIdentifier || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Missing required fields: userIdentifier, amount' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json(
        { error: 'Amount must be a non-zero number' },
        { status: 400 }
      )
    }

    // 3. 查找目标用户（支持通过邮箱或 UUID）
    let targetUserId: string | null = null
    let targetUserEmail: string | null = null

    // 使用 admin client（需要 Service Role Key）
    const adminClient = createAdminClient()

    // 判断是邮箱还是 UUID
    const isEmail = userIdentifier.includes('@')
    
    if (isEmail) {
      // 通过邮箱查找
      const { data: authUser, error: userError } = await adminClient.auth.admin.listUsers()
      
      if (userError) {
        console.error('[Admin API] Error listing users:', userError)
        return NextResponse.json(
          { error: 'Failed to search for user' },
          { status: 500 }
        )
      }

      const foundUser = authUser.users.find(u => u.email === userIdentifier)
      
      if (!foundUser) {
        return NextResponse.json(
          { error: `User not found: ${userIdentifier}` },
          { status: 404 }
        )
      }

      targetUserId = foundUser.id
      targetUserEmail = foundUser.email || userIdentifier
    } else {
      // 假设是 UUID
      targetUserId = userIdentifier
      
      // 验证用户是否存在
      const { data: profileData, error: profileError } = await adminClient
        .from('profiles')
        .select('id')
        .eq('id', targetUserId)
        .single()

      if (profileError || !profileData) {
        return NextResponse.json(
          { error: `User not found: ${userIdentifier}` },
          { status: 404 }
        )
      }

      // 获取用户邮箱
      const { data: authData } = await adminClient.auth.admin.getUserById(targetUserId)
      targetUserEmail = authData?.user?.email || 'Unknown'
    }

    // 4. 如果是扣除操作，先检查余额
    if (amount < 0) {
      const { data: currentProfile } = await adminClient
        .from('profiles')
        .select('credits')
        .eq('id', targetUserId)
        .single()
      
      const currentCredits = currentProfile?.credits || 0
      if (currentCredits + amount < 0) {
        return NextResponse.json(
          { error: `Insufficient credits. User has ${currentCredits} credits, cannot deduct ${Math.abs(amount)}` },
          { status: 400 }
        )
      }
    }

    // 5. 增加/扣除 credits（使用 admin client 绕过 RLS）
    const { error: updateError } = await adminClient.rpc(
      'increment_credits',
      { 
        user_id: targetUserId,
        amount: amount
      }
    )

    if (updateError) {
      console.error('[Admin API] Failed to update credits:', updateError)
      return NextResponse.json(
        { error: 'Failed to update credits: ' + updateError.message },
        { status: 500 }
      )
    }

    // 6. 记录操作日志
    const operation = amount > 0 ? 'added' : 'deducted'
    const absAmount = Math.abs(amount)
    console.log(`[Admin Credit] ${user.email} ${operation} ${absAmount} credits ${amount > 0 ? 'to' : 'from'} ${targetUserEmail} (${targetUserId})`)
    
    if (reason) {
      console.log(`[Admin Credit] Reason: ${reason}`)
    }

    // 7. 获取更新后的 credits
    const { data: finalProfile } = await adminClient
      .from('profiles')
      .select('credits')
      .eq('id', targetUserId)
      .single()

    const operation = amount > 0 ? 'added' : 'deducted'
    const absAmount = Math.abs(amount)
    const preposition = amount > 0 ? 'to' : 'from'
    
    return NextResponse.json({
      success: true,
      message: `Successfully ${operation} ${absAmount} credits ${preposition} ${targetUserEmail}`,
      user: {
        id: targetUserId,
        email: targetUserEmail,
        newCredits: finalProfile?.credits || 0
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
