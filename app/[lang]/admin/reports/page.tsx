/**
 * Admin Reports Dashboard
 * 
 * Purpose: Review user-submitted reports of inappropriate content
 * Features:
 * - View pending reports
 * - Preview reported images
 * - Take action (dismiss, delete content, warn/ban user)
 * - View violation history
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportsClient from './reports-client'

export const metadata = {
  title: 'Content Reports - Admin',
  description: 'Review and moderate user-reported content'
}

async function getReportsData() {
  const supabase = await createClient()
  
  // Check admin auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    redirect('/')
  }
  
  // Fetch pending reports with generation details
  const { data: reports, error } = await supabase
    .from('user_reports')
    .select(`
      *,
      reporter:profiles!user_reports_reporter_id_fkey(id, email, full_name),
      generation:generations(
        id,
        output_url,
        style,
        prompt,
        user_id,
        is_public,
        created_at,
        owner:profiles!generations_user_id_fkey(id, email, full_name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (error) {
    console.error('Error fetching reports:', error)
    return { reports: [], stats: { pending: 0, reviewing: 0, total: 0 } }
  }
  
  // Calculate stats
  const stats = {
    pending: reports?.filter(r => r.status === 'pending').length || 0,
    reviewing: reports?.filter(r => r.status === 'reviewing').length || 0,
    total: reports?.length || 0
  }
  
  return { reports: reports || [], stats }
}

export default async function ReportsPage() {
  const { reports, stats } = await getReportsData()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Reports</h1>
        <p className="text-gray-600">
          Review user-submitted reports and take appropriate action
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-medium">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium">In Review</p>
          <p className="text-3xl font-bold text-blue-900">{stats.reviewing}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 font-medium">Total Reports</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
      </div>
      
      <Suspense fallback={<div>Loading reports...</div>}>
        <ReportsClient initialReports={reports} />
      </Suspense>
    </div>
  )
}
