/**
 * 临时图片上传API
 * 用于 Test Lab 上传测试图片
 * 
 * 功能：
 * - 上传图片到 Supabase Storage (guest-uploads bucket)
 * - 返回临时URL用于 Qwen 分析和测试
 * - 图片会自动过期清理（24小时后通过 cleanup-guest-uploads Edge Function）
 * 
 * 存储路径: guest-uploads/test-lab/test-{timestamp}-{random}.{ext}
 * 保留时间: 24 小时（等 cleanup 启用后）
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 检查环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase credentials')
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Missing Supabase credentials'
      }, { status: 500 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }
    
    // 验证文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }
    
    // 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // 上传到 Supabase Storage
    const supabase = createAdminClient()
    
    // 清理文件名：移除特殊字符和中文
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_') // 替换非法字符为下划线
    const fileExt = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const randomId = Math.random().toString(36).substring(7)
    const fileName = `test-${Date.now()}-${randomId}.${fileExt}`
    const filePath = `test-lab/${fileName}`  // test-lab 子目录用于区分测试文件
    
    console.log('📤 Upload details:', { 
      originalName: file.name, 
      cleanName: fileName, 
      size: file.size, 
      type: file.type,
      bucket: 'guest-uploads',
      path: filePath
    })
    
    const { data, error } = await supabase.storage
      .from('guest-uploads')  // ✅ 使用临时文件专用 bucket
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false  // 避免覆盖同名文件
      })
    
    if (error) {
      console.error('❌ Supabase upload error:', error)
      return NextResponse.json({ 
        error: 'Upload failed', 
        details: error.message,
        bucket: 'guest-uploads',
        path: filePath
      }, { status: 500 })
    }
    
    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from('guest-uploads')  // ✅ 从正确的 bucket 获取 URL
      .getPublicUrl(data.path)
    
    console.log('✅ Image uploaded to temp storage:', urlData.publicUrl)
    
    return NextResponse.json({ 
      imageUrl: urlData.publicUrl,
      path: data.path,
      bucket: 'guest-uploads',
      willExpire: '24 hours (when cleanup is enabled)'
    })
  } catch (error: any) {
    console.error('Upload temp API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
