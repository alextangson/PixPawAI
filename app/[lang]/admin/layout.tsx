/**
 * 管理后台布局
 * 
 * 功能：
 * - 权限检查：只有 role='admin' 的用户才能访问
 * - 侧边栏导航
 * - 响应式布局
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  
  // 检查功能开关
  if (!FEATURE_FLAGS.ENABLE_ADMIN_PANEL) {
    redirect(`/${lang}`)
  }
  
  // 验证用户身份
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect(`/${lang}/auth`)
  }
  
  // 检查管理员权限
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    console.log(`[Admin Access Denied] User ${user.email} is not an admin`)
    redirect(`/${lang}`)
  }
  
  console.log(`[Admin Access] User ${user.email} accessed admin panel`)
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <AdminSidebar lang={lang} userEmail={user.email || ''} />
      
      {/* 主内容区 */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
