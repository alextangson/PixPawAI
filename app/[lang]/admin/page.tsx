/**
 * 管理后台首页 - 数据中心
 * 显示系统概览、关键指标、图表和数据表格
 */

import { DashboardClient } from './dashboard-client'

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  
  return <DashboardClient lang={lang} />
}
