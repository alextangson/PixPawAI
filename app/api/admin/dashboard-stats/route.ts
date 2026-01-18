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

    // 获取关键指标
    const stats = await getDashboardStats(supabase)

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', message: error.message },
      { status: 500 }
    )
  }
}

async function getDashboardStats(supabase: any) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // 1. 总生成数
  const { count: totalGenerations } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })

  const { count: todayGenerations } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  const { count: weekGenerations } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last7Days.toISOString())

  // 2. 成功率（24小时）
  const { data: last24HoursGens } = await supabase
    .from('generations')
    .select('status')
    .gte('created_at', last24Hours.toISOString())

  const successCount = last24HoursGens?.filter((g: any) => g.status === 'succeeded').length || 0
  const successRate24h = last24HoursGens?.length ? (successCount / last24HoursGens.length * 100).toFixed(2) : '0.00'

  // 3. 活跃用户（7天）
  const { data: activeUsers } = await supabase
    .from('generations')
    .select('user_id')
    .gte('created_at', last7Days.toISOString())

  const uniqueActiveUsers = new Set(activeUsers?.map((g: any) => g.user_id) || []).size

  // 4. 总用户数
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // 5. Credits统计
  const { data: profilesCredits } = await supabase
    .from('profiles')
    .select('credits')

  const totalCredits = profilesCredits?.reduce((sum: number, p: any) => sum + (p.credits || 0), 0) || 0
  const usersNeedRecharge = profilesCredits?.filter((p: any) => (p.credits || 0) === 0).length || 0

  // 6. 用户反馈（7天）
  const { data: feedbackData } = await supabase
    .from('generations')
    .select('metadata')
    .gte('created_at', last7Days.toISOString())

  const loveItCount = feedbackData?.filter((g: any) => g.metadata?.feedback_type === 'love_it').length || 0
  const notQuiteCount = feedbackData?.filter((g: any) => g.metadata?.feedback_type === 'not_quite').length || 0

  // 7. 被过滤特征（7天）
  const { count: filteredFeatures7d } = await supabase
    .from('filtered_features_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last7Days.toISOString())

  // 8. 生成趋势（7天）
  const { data: trendData } = await supabase
    .from('generations')
    .select('created_at, status')
    .gte('created_at', last7Days.toISOString())
    .order('created_at', { ascending: true })

  const dailyTrends = processDailyTrends(trendData || [])

  // 9. 风格使用分布（30天）
  const { data: styleData } = await supabase
    .from('generations')
    .select('style')
    .gte('created_at', last30Days.toISOString())

  const styleDistribution = processStyleDistribution(styleData || [])

  return {
    keyMetrics: {
      totalGenerations: totalGenerations || 0,
      todayGenerations: todayGenerations || 0,
      weekGenerations: weekGenerations || 0,
      successRate24h: parseFloat(successRate24h),
      activeUsers7d: uniqueActiveUsers,
      totalUsers: totalUsers || 0,
      totalCredits,
      usersNeedRecharge,
      loveItCount7d: loveItCount,
      notQuiteCount7d: notQuiteCount,
      filteredFeatures7d: filteredFeatures7d || 0
    },
    charts: {
      dailyTrends,
      styleDistribution
    },
    lastUpdated: new Date().toISOString()
  }
}

function processDailyTrends(data: any[]) {
  const trends: Record<string, { date: string; total: number; succeeded: number; failed: number }> = {}

  data.forEach((item) => {
    const date = new Date(item.created_at).toISOString().split('T')[0]
    if (!trends[date]) {
      trends[date] = { date, total: 0, succeeded: 0, failed: 0 }
    }
    trends[date].total++
    if (item.status === 'succeeded') trends[date].succeeded++
    if (item.status === 'failed') trends[date].failed++
  })

  return Object.values(trends).sort((a, b) => a.date.localeCompare(b.date))
}

function processStyleDistribution(data: any[]) {
  const distribution: Record<string, number> = {}

  data.forEach((item) => {
    const style = item.style || 'Unknown'
    distribution[style] = (distribution[style] || 0) + 1
  })

  return Object.entries(distribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // Top 10
}
