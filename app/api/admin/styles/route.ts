/**
 * Styles 管理 API
 * 
 * GET: 获取所有风格（支持过滤）
 * POST: 创建新风格（Admin only）
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // 参数
    const includeDisabled = searchParams.get('includeDisabled') === 'true'
    const category = searchParams.get('category')
    
    // 构建查询
    let query = supabase
      .from('styles')
      .select('*')
      .order('sort_order', { ascending: true })
    
    // 过滤
    if (!includeDisabled) {
      query = query.eq('is_enabled', true)
    }
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('[Styles API] Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch styles',
        details: error.message 
      }, { status: 500 })
    }
    
    // Add cache headers for better performance
    const response = NextResponse.json({ styles: data || [] })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    
    return response
  } catch (error: any) {
    console.error('[Styles API] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 检查是否为管理员
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    
    // 解析请求体
    const body = await request.json()
    const {
      id,
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
      is_premium
    } = body
    
    // 验证必需字段
    if (!id || !name || !prompt_suffix) {
      return NextResponse.json({ 
        error: 'Missing required fields: id, name, prompt_suffix' 
      }, { status: 400 })
    }
    
    // 插入新风格
    const adminSupabase = await createAdminClient()
    const { data, error } = await adminSupabase
      .from('styles')
      .insert({
        id,
        name,
        prompt_suffix,
        negative_prompt,
        category,
        description,
        tags,
        recommended_strength_min,
        recommended_guidance,
        sort_order: sort_order || 999,
        is_enabled: is_enabled !== undefined ? is_enabled : true,
        is_premium: is_premium || false,
        created_by: user.id
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating style:', error)
      return NextResponse.json({ 
        error: 'Failed to create style', 
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ style: data }, { status: 201 })
  } catch (error: any) {
    console.error('Create style API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}
