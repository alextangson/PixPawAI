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
    const filterReason = searchParams.get('filter_reason')
    const featureType = searchParams.get('feature_type')
    const dateRange = searchParams.get('date_range') || '30' // days

    const offset = (page - 1) * limit
    const dateFrom = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)

    // 构建查询
    let query = supabase
      .from('filtered_features_log')
      .select('*', { count: 'exact' })
      .gte('created_at', dateFrom.toISOString())

    if (filterReason) {
      query = query.eq('filter_reason', filterReason)
    }

    if (featureType) {
      query = query.eq('feature_type', featureType)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('Filtered features error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filtered features', message: error.message },
      { status: 500 }
    )
  }
}
