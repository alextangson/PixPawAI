/**
 * 管理后台首页
 * 显示系统概览和快速入口
 */

import Link from 'next/link'
import { ArrowRight, Beaker, Palette, FileText, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getAllFeatureFlags } from '@/lib/feature-flags'

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const featureFlags = getAllFeatureFlags()
  
  const quickLinks = [
    {
      icon: Beaker,
      title: 'Test Lab',
      description: '测试提示词构建流程',
      href: `/${lang}/admin/test-lab`,
      color: 'text-blue-500',
    },
    {
      icon: Palette,
      title: 'Style Library',
      description: '管理风格库和上传图片',
      href: `/${lang}/admin/styles`,
      color: 'text-purple-500',
    },
    {
      icon: FileText,
      title: 'Prompts',
      description: '编辑提示词模板',
      href: `/${lang}/admin/prompts`,
      color: 'text-green-500',
    },
    {
      icon: Search,
      title: 'Qwen Config',
      description: '配置AI识别参数',
      href: `/${lang}/admin/qwen-config`,
      color: 'text-orange-500',
    },
  ]
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">欢迎使用管理后台</h1>
        <p className="text-gray-600">
          提示词管理系统 - 可视化调试和配置工具
        </p>
      </div>
      
      {/* 功能开关状态 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🎛️ 功能开关状态</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">新提示词系统</div>
              <div className="text-sm text-gray-500">USE_NEW_PROMPT_SYSTEM</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              featureFlags.USE_NEW_PROMPT_SYSTEM 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-200 text-gray-700'
            }`}>
              {featureFlags.USE_NEW_PROMPT_SYSTEM ? '✅ ON' : '⚪ OFF'}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">风格库数据库</div>
              <div className="text-sm text-gray-500">USE_DATABASE_STYLES</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              featureFlags.USE_DATABASE_STYLES 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-200 text-gray-700'
            }`}>
              {featureFlags.USE_DATABASE_STYLES ? '✅ ON' : '⚪ OFF'}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">详细日志</div>
              <div className="text-sm text-gray-500">ENABLE_DETAILED_LOGS</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              featureFlags.ENABLE_DETAILED_LOGS 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-200 text-gray-700'
            }`}>
              {featureFlags.ENABLE_DETAILED_LOGS ? '✅ ON' : '⚪ OFF'}
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 提示：功能开关默认关闭，测试通过后再在 Vercel 环境变量中开启。
          </p>
        </div>
      </Card>
      
      {/* 快速入口 */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">🚀 快速入口</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon
            
            return (
              <Link key={link.href} href={link.href}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-gray-100 ${link.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{link.title}</h3>
                      <p className="text-sm text-gray-600">{link.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
      
      {/* 开发指南 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📚 开发指南</h2>
        <div className="space-y-3 text-sm">
          <div>
            <strong>Phase 1 (当前)：</strong> Test Lab 基础版 - 搭建测试工具
          </div>
          <div>
            <strong>Phase 2-3：</strong> 提示词解析器和清理器 - 独立模块
          </div>
          <div>
            <strong>Phase 4：</strong> 风格库数据库化 - 可视化管理
          </div>
          <div>
            <strong>Phase 5：</strong> 提示词构建器 - 核心组装
          </div>
          <div>
            <strong>Phase 6：</strong> 灰度上线 - 安全切换
          </div>
        </div>
      </Card>
    </div>
  )
}
