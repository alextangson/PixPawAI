/**
 * 单个 Style CRUD API
 * 
 * GET: 获取单个风格
 * PUT: 更新风格（Admin only）
 * DELETE: 删除风格（Admin only）
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('styles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Style not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch style' }, { status: 500 })
    }
    
    return NextResponse.json({ style: data })
  } catch (error: any) {
    console.error('Get style API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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
    const {
      name,
      prompt_suffix,
      negative_prompt,
      category,
      description,
      tags,
      recommended_strength_min,
      recommended_guidance,
      sort_order,
      is_enabled,
      is_premium,
      preview_image_url,
      example_image_url
    } = body
    
    const adminSupabase = await createAdminClient()
    
    // 1. 获取当前配置（用于检测是否有重要变化和保存版本）
    const { data: currentStyle, error: fetchError } = await adminSupabase
      .from('styles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !currentStyle) {
      return NextResponse.json({ 
        error: 'Style not found', 
        details: fetchError?.message 
      }, { status: 404 })
    }
    
    // 2. 检测是否有重要参数变化（需要保存版本）
    const hasSignificantChange = 
      (prompt_suffix !== undefined && prompt_suffix !== currentStyle.prompt_suffix) ||
      (negative_prompt !== undefined && negative_prompt !== currentStyle.negative_prompt) ||
      (recommended_strength_min !== undefined && recommended_strength_min !== currentStyle.recommended_strength_min) ||
      (recommended_guidance !== undefined && recommended_guidance !== currentStyle.recommended_guidance)
    
    // 3. 如果有重要变化，保存当前配置为历史版本
    if (hasSignificantChange) {
      // 获取下一个版本号
      const { data: latestVersions } = await adminSupabase
        .from('style_versions')
        .select('version_number')
        .eq('style_id', id)
        .order('version_number', { ascending: false })
        .limit(1)
      
      const nextVersion = (latestVersions?.[0]?.version_number || 0) + 1
      
      // 保存当前配置为历史版本
      const { error: versionError } = await adminSupabase
        .from('style_versions')
        .insert({
          style_id: id,
          version_number: nextVersion,
          prompt_suffix: currentStyle.prompt_suffix,
          negative_prompt: currentStyle.negative_prompt,
          recommended_strength_min: currentStyle.recommended_strength_min,
          recommended_guidance: currentStyle.recommended_guidance,
          created_by: authCheck.user?.id,
          notes: body._version_notes || 'Auto-saved before update'
        })
      
      if (versionError) {
        console.warn('Failed to save version history:', versionError)
        // 不阻止更新，只记录警告
      }
    }
    
    // 4. 构建更新对象（只更新提供的字段）
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (prompt_suffix !== undefined) updateData.prompt_suffix = prompt_suffix
    if (negative_prompt !== undefined) updateData.negative_prompt = negative_prompt
    if (category !== undefined) updateData.category = category
    if (description !== undefined) updateData.description = description
    if (tags !== undefined) updateData.tags = tags
    if (recommended_strength_min !== undefined) updateData.recommended_strength_min = recommended_strength_min
    if (recommended_guidance !== undefined) updateData.recommended_guidance = recommended_guidance
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (is_enabled !== undefined) updateData.is_enabled = is_enabled
    if (is_premium !== undefined) updateData.is_premium = is_premium
    if (preview_image_url !== undefined) updateData.preview_image_url = preview_image_url
    if (example_image_url !== undefined) updateData.example_image_url = example_image_url
    
    // 5. 更新风格
    const { data, error } = await adminSupabase
      .from('styles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating style:', error)
      return NextResponse.json({ 
        error: 'Failed to update style', 
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ style: data })
  } catch (error: any) {
    console.error('Update style API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(
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
    
    // 删除风格
    const adminSupabase = await createAdminClient()
    const { error } = await adminSupabase
      .from('styles')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting style:', error)
      return NextResponse.json({ 
        error: 'Failed to delete style', 
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Style deleted successfully' })
  } catch (error: any) {
    console.error('Delete style API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}
