/**
 * Style Version Restore API
 * 
 * POST: 恢复到指定历史版本
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

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

export async function POST(
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
    
    // 解析请求体
    const body = await request.json()
    const { version_number } = body
    
    if (!version_number || typeof version_number !== 'number') {
      return NextResponse.json({ 
        error: 'version_number is required and must be a number' 
      }, { status: 400 })
    }
    
    const adminSupabase = await createAdminClient()
    
    // 1. 获取要恢复的历史版本
    const { data: version, error: versionError } = await adminSupabase
      .from('style_versions')
      .select('*')
      .eq('style_id', id)
      .eq('version_number', version_number)
      .single()
    
    if (versionError || !version) {
      return NextResponse.json({ 
        error: 'Version not found', 
        details: versionError?.message 
      }, { status: 404 })
    }
    
    // 2. 获取当前风格配置（用于备份）
    const { data: currentStyle, error: currentError } = await adminSupabase
      .from('styles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (currentError || !currentStyle) {
      return NextResponse.json({ 
        error: 'Style not found', 
        details: currentError?.message 
      }, { status: 404 })
    }
    
    // 3. 获取下一个版本号（用于保存当前配置）
    const { data: latestVersions } = await adminSupabase
      .from('style_versions')
      .select('version_number')
      .eq('style_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
    
    const nextVersion = (latestVersions?.[0]?.version_number || 0) + 1
    
    // 4. 保存当前配置为新版本（回退前先备份）
    const { error: backupError } = await adminSupabase
      .from('style_versions')
      .insert({
        style_id: id,
        version_number: nextVersion,
        prompt_suffix: currentStyle.prompt_suffix,
        negative_prompt: currentStyle.negative_prompt,
        recommended_strength_min: currentStyle.recommended_strength_min,
        recommended_guidance: currentStyle.recommended_guidance,
        created_by: authCheck.user?.id,
        notes: `Auto-backup before restoring to v${version_number}`
      })
    
    if (backupError) {
      console.error('Error creating backup:', backupError)
      return NextResponse.json({ 
        error: 'Failed to create backup', 
        details: backupError.message 
      }, { status: 500 })
    }
    
    // 5. 恢复到历史版本
    const { data: updatedStyle, error: restoreError } = await adminSupabase
      .from('styles')
      .update({
        prompt_suffix: version.prompt_suffix,
        negative_prompt: version.negative_prompt,
        recommended_strength_min: version.recommended_strength_min,
        recommended_guidance: version.recommended_guidance,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (restoreError) {
      console.error('Error restoring version:', restoreError)
      return NextResponse.json({ 
        error: 'Failed to restore version', 
        details: restoreError.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Restored to version ${version_number}`,
      backupVersion: nextVersion,
      style: updatedStyle
    })
  } catch (error: any) {
    console.error('Restore version API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}
