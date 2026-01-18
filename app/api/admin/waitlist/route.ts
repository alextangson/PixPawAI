import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 验证admin权限
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') // 'active', 'need_recharge', etc.

    const offset = (page - 1) * limit

    // 查询用户列表（按注册时间倒序）
    let query = supabase
      .from('profiles')
      .select('id, email, credits, created_at, metadata', { count: 'exact' })

    // 根据状态过滤
    if (status === 'need_recharge') {
      query = query.eq('credits', 0)
    } else if (status === 'new') {
      query = query.eq('credits', 3) // 新用户初始积分
    } else if (status === 'active') {
      query = query.gt('credits', 0)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // 获取每个用户的生成数
    const userIds = data?.map((u: any) => u.id) || []
    const { data: generationsData } = await supabase
      .from('generations')
      .select('user_id')
      .in('user_id', userIds)

    const generationCounts: Record<string, number> = {}
    generationsData?.forEach((g: any) => {
      generationCounts[g.user_id] = (generationCounts[g.user_id] || 0) + 1
    })

    // 合并数据
    const processedData = data?.map((user: any) => ({
      id: user.id,
      email: user.email,
      credits: user.credits,
      created_at: user.created_at,
      generation_count: generationCounts[user.id] || 0,
      source: user.metadata?.source || 'direct',
      is_active: (generationCounts[user.id] || 0) > 0
    })) || []

    return NextResponse.json({
      data: processedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('Waitlist error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waitlist', message: error.message },
      { status: 500 }
    )
  }
}
