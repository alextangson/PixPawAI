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
    const feedbackType = searchParams.get('feedback_type')
    const dateRange = searchParams.get('date_range') || '30' // days

    const offset = (page - 1) * limit
    const dateFrom = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)

    // 查询包含反馈的生成记录
    let query = supabase
      .from('generations')
      .select('id, user_id, style, created_at, metadata, output_url', { count: 'exact' })
      .gte('created_at', dateFrom.toISOString())
      .not('metadata->feedback_type', 'is', null)

    if (feedbackType) {
      query = query.eq('metadata->feedback_type', feedbackType)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // 处理数据，提取feedback信息
    const processedData = data?.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      style: item.style,
      created_at: item.created_at,
      output_url: item.output_url,
      feedback_type: item.metadata?.feedback_type,
      feedback_reason: item.metadata?.reason,
      rating: item.metadata?.rating,
      improvement_suggestion: item.metadata?.improvement_suggestion
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
    console.error('User feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user feedback', message: error.message },
      { status: 500 }
    )
  }
}
