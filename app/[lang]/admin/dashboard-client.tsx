'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  CreditCard,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Filter
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import Link from 'next/link'

interface DashboardStats {
  keyMetrics: {
    totalGenerations: number
    todayGenerations: number
    weekGenerations: number
    successRate24h: number
    activeUsers7d: number
    totalUsers: number
    totalCredits: number
    usersNeedRecharge: number
    loveItCount7d: number
    notQuiteCount7d: number
    filteredFeatures7d: number
  }
  charts: {
    dailyTrends: Array<{
      date: string
      total: number
      succeeded: number
      failed: number
    }>
    styleDistribution: Array<{
      name: string
      value: number
    }>
  }
  lastUpdated: string
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#6366f1', '#14b8a6']

export function DashboardClient({ lang }: { lang: string }) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'filtered' | 'feedback' | 'waitlist'>('filtered')

  useEffect(() => {
    fetchDashboardStats()
    // 每30秒刷新一次
    const interval = setInterval(fetchDashboardStats, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchDashboardStats() {
    try {
      const response = await fetch('/api/admin/dashboard-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load dashboard data</p>
        <button 
          onClick={fetchDashboardStats}
          className="mt-4 px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral-dark"
        >
          Retry
        </button>
      </div>
    )
  }

  const { keyMetrics, charts } = stats

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Real-time system monitoring and data analytics
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<BarChart3 className="w-5 h-5" />}
          title="Total Generations"
          value={keyMetrics.totalGenerations.toLocaleString()}
          subtitle={`${keyMetrics.todayGenerations} today | ${keyMetrics.weekGenerations} this week`}
          color="bg-purple-100 text-purple-600"
        />
        
        <MetricCard
          icon={<TrendingUp className="w-5 h-5" />}
          title="Success Rate (24h)"
          value={`${keyMetrics.successRate24h}%`}
          subtitle={keyMetrics.successRate24h >= 95 ? 'Excellent' : keyMetrics.successRate24h >= 90 ? 'Good' : 'Needs attention'}
          color="bg-green-100 text-green-600"
        />
        
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          title="Active Users"
          value={keyMetrics.activeUsers7d.toLocaleString()}
          subtitle={`${keyMetrics.totalUsers} total users`}
          color="bg-blue-100 text-blue-600"
        />
        
        <MetricCard
          icon={<CreditCard className="w-5 h-5" />}
          title="Total Credits"
          value={keyMetrics.totalCredits.toLocaleString()}
          subtitle={`${keyMetrics.usersNeedRecharge} users need recharge`}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      {/* 用户反馈指标 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                <span className="font-semibold">Love It (7d)</span>
              </div>
              <div className="text-3xl font-bold">{keyMetrics.loveItCount7d}</div>
            </div>
            <div className="text-sm text-gray-500">
              {keyMetrics.loveItCount7d + keyMetrics.notQuiteCount7d > 0 
                ? `${Math.round(keyMetrics.loveItCount7d / (keyMetrics.loveItCount7d + keyMetrics.notQuiteCount7d) * 100)}% satisfaction`
                : 'No data'}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ThumbsDown className="w-5 h-5 text-red-600" />
                <span className="font-semibold">Not Quite (7d)</span>
              </div>
              <div className="text-3xl font-bold">{keyMetrics.notQuiteCount7d}</div>
            </div>
            <Link 
              href={`/${lang}/admin`}
              className="text-sm text-blue-600 hover:underline"
            >
              View reasons →
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">Filtered Features (7d)</span>
              </div>
              <div className="text-3xl font-bold">{keyMetrics.filteredFeatures7d}</div>
            </div>
            <button 
              onClick={() => setActiveTab('filtered')}
              className="text-sm text-blue-600 hover:underline"
            >
              View details →
            </button>
          </div>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 生成趋势图 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Generation Trends (7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8b5cf6" name="Total" strokeWidth={2} />
              <Line type="monotone" dataKey="succeeded" stroke="#10b981" name="Succeeded" />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* 风格使用分布 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Style Distribution (Top 10)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={charts.styleDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {charts.styleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* 快速入口 */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickLink
            href={`/${lang}/admin/test-lab`}
            title="Test Lab"
            description="测试提示词系统"
            color="bg-blue-50 hover:bg-blue-100"
          />
          <QuickLink
            href={`/${lang}/admin/styles`}
            title="Style Library"
            description="管理风格库"
            color="bg-purple-50 hover:bg-purple-100"
          />
          <QuickLink
            href={`/${lang}/admin/prompts`}
            title="Prompts"
            description="提示词模板管理"
            color="bg-green-50 hover:bg-green-100"
          />
          <QuickLink
            href={`/${lang}/admin/qwen-config`}
            title="Qwen Config"
            description="AI配置管理"
            color="bg-orange-50 hover:bg-orange-100"
          />
        </div>
      </div>

      {/* 数据表格区域 - 简化版，只显示统计 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Data Tables</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <div>• <strong>Filtered Features</strong>: Use SQL scripts in <code className="bg-gray-100 px-2 py-1 rounded">scripts/sql/data-analysis.sql</code></div>
          <div>• <strong>User Feedback</strong>: Query <code className="bg-gray-100 px-2 py-1 rounded">generations</code> table with feedback metadata</div>
          <div>• <strong>Waitlist</strong>: Access via <code className="bg-gray-100 px-2 py-1 rounded">profiles</code> table</div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800">
              Tip: Use Supabase SQL Editor to run detailed queries from the scripts folder
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function MetricCard({ icon, title, value, subtitle, color }: {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  color: string
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </Card>
  )
}

function QuickLink({ href, title, description, color }: {
  href: string
  title: string
  description: string
  color: string
}) {
  return (
    <Link href={href}>
      <Card className={`p-6 transition-colors cursor-pointer ${color}`}>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </Card>
    </Link>
  )
}
