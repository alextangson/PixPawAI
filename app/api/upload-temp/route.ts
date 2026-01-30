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
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { checkRateLimitSmart } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // 获取用户信息（如果已登录）
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // 🛡️ Rate Limiting: 智能速率限制（登录用户 10次/分钟，匿名 5次/分钟）
    const rateLimit = await checkRateLimitSmart(request, 'upload', user?.id)
    
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000)
      const limitType = rateLimit.authenticated ? 'authenticated user' : 'IP'
      console.warn(`[Rate Limit] Upload blocked for ${limitType}`)
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many uploads. Please wait ${retryAfter} seconds.`,
          retryAfter,
          limit: rateLimit.limit,
          authenticated: rateLimit.authenticated,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }
    
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
    const filePath = `test-lab/${fileName}`
    
    console.log('Upload details:', { originalName: file.name, cleanName: fileName, size: file.size, type: file.type })
    
    const { data, error } = await supabase.storage
      .from('generated-results')  // 使用现有的 bucket
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json({ 
        error: 'Upload failed', 
        details: error.message,
        bucket: 'generated-results',
        path: filePath
      }, { status: 500 })
    }
    
    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from('generated-results')
      .getPublicUrl(data.path)
    
    return NextResponse.json(
      { 
        imageUrl: urlData.publicUrl,
        path: data.path
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    )
  } catch (error: any) {
    console.error('Upload temp API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
