/**
 * 风格预览图上传 API
 * 
 * POST /api/admin/upload-style-image
 * - 上传风格预览图到 Supabase Storage
 * - 存储路径: generated-results/styles/{styleId}.{ext}
 * - 返回公开URL
 * - 仅限管理员
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. 验证管理员权限
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    
    // 2. 解析表单数据
    const formData = await request.formData()
    const file = formData.get('file') as File
    const styleId = formData.get('styleId') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    if (!styleId) {
      return NextResponse.json({ error: 'Style ID required' }, { status: 400 })
    }
    
    // 3. 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Only images allowed.' }, { status: 400 })
    }
    
    // 4. 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }
    
    // 5. 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // 6. 清理文件扩展名
    const fileExt = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const fileName = `styles/${styleId}.${fileExt}`
    
    console.log('📤 Uploading style image:', { styleId, fileName, size: file.size, type: file.type })
    
    // 7. 上传到 Supabase Storage (使用 admin client 绕过 RLS)
    const adminSupabase = await createAdminClient()
    
    // 删除旧文件（如果存在）
    const { data: existingFiles } = await adminSupabase.storage
      .from('generated-results')
      .list('styles', {
        search: styleId
      })
    
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `styles/${f.name}`)
      await adminSupabase.storage
        .from('generated-results')
        .remove(filesToDelete)
      console.log('🗑️ Deleted old files:', filesToDelete)
    }
    
    // 上传新文件
    const { data, error } = await adminSupabase.storage
      .from('generated-results')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '31536000', // 1年缓存
        upsert: true // 允许覆盖
      })
    
    if (error) {
      console.error('❌ Supabase upload error:', error)
      return NextResponse.json({ 
        error: 'Upload failed', 
        details: error.message 
      }, { status: 500 })
    }
    
    // 8. 获取公开URL
    const { data: urlData } = adminSupabase.storage
      .from('generated-results')
      .getPublicUrl(data.path)
    
    console.log('✅ Upload successful:', urlData.publicUrl)
    
    return NextResponse.json({ 
      imageUrl: urlData.publicUrl,
      path: data.path,
      styleId
    })
  } catch (error: any) {
    console.error('Upload style image API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
