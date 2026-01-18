/**
 * 临时图片上传API
 * 用于 Test Lab 上传测试图片
 * 
 * 功能：
 * - 上传图片到 Supabase Storage (temp bucket)
 * - 返回临时URL用于 Qwen 分析
 * - 图片会自动过期清理（通过 Supabase Storage 策略）
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
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
    const fileName = `test-${Date.now()}-${file.name}`
    const filePath = `test-lab/${fileName}`
    
    const { data, error } = await supabase.storage
      .from('generated-results')  // 使用现有的 bucket
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
    
    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from('generated-results')
      .getPublicUrl(data.path)
    
    return NextResponse.json({ 
      imageUrl: urlData.publicUrl,
      path: data.path
    })
  } catch (error: any) {
    console.error('Upload temp API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
