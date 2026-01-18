/**
 * 管理后台侧边栏导航
 * 
 * 功能：
 * - 导航菜单
 * - 当前路由高亮
 * - 响应式设计（移动端可折叠）
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Beaker, Palette, FileText, Search, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  lang: string
  userEmail: string
}

export function AdminSidebar({ lang, userEmail }: AdminSidebarProps) {
  const pathname = usePathname()
  
  const navItems = [
    { 
      icon: Beaker, 
      label: 'Test Lab', 
      href: `/${lang}/admin/test-lab`,
      description: '测试工具'
    },
    { 
      icon: Palette, 
      label: 'Style Library', 
      href: `/${lang}/admin/styles`,
      description: '风格库管理'
    },
    { 
      icon: FileText, 
      label: 'Prompts', 
      href: `/${lang}/admin/prompts`,
      description: '提示词管理'
    },
    { 
      icon: Search, 
      label: 'Qwen Config', 
      href: `/${lang}/admin/qwen-config`,
      description: 'AI配置'
    },
  ]
  
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo和标题 */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">PixPaw Admin</h1>
        <p className="text-sm text-gray-400 mt-1">管理后台</p>
      </div>
      
      {/* 导航菜单 */}
      <nav className="flex-1 p-4 overflow-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname?.startsWith(item.href)
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    'hover:bg-gray-800',
                    isActive && 'bg-gray-800 border-l-4 border-blue-500'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
        
        {/* 分隔线 */}
        <div className="my-4 border-t border-gray-800" />
        
        {/* 返回首页 */}
        <Link 
          href={`/${lang}`}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-gray-800"
        >
          <Home className="w-5 h-5" />
          <span>返回首页</span>
        </Link>
      </nav>
      
      {/* 用户信息 */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-sm text-gray-400 mb-1">当前用户</div>
        <div className="text-sm font-medium truncate">{userEmail}</div>
        <div className="mt-2 text-xs text-gray-500">
          Role: <span className="text-blue-400">admin</span>
        </div>
      </div>
    </aside>
  )
}
