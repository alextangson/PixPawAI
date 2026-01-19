/**
 * Style Version History API
 * 
 * GET: 获取某个风格的所有历史版本
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 验证管理员权限
async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { isAdmin: false, error: 'Unauthorized', status: 401 }
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return { isAdmin: false, error: 'Forbidden: Admin only', status: 403 }
  }
  
  return { isAdmin: true, user }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 验证管理员
    const authCheck = await checkAdmin()
    if (!authCheck.isAdmin) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }
    
    const supabase = await createClient()
    
    // 获取版本历史
    const { data: versions, error } = await supabase
      .from('style_versions')
      .select('*')
      .eq('style_id', id)
      .order('version_number', { ascending: false })
    
    if (error) {
      console.error('Error fetching style versions:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch versions', 
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ versions: versions || [] })
  } catch (error: any) {
    console.error('Version history API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}
