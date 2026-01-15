/**
 * Supabase Storage 辅助函数
 * 用于上传和管理用户图片和生成结果
 */

import { createClient } from '@/lib/supabase/client'

/**
 * 上传用户原图到 user-uploads bucket
 */
export async function uploadUserImage(
  file: File,
  userId: string
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const supabase = createClient()

    // 生成唯一文件名
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // 上传到 user-uploads bucket (私有)
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return { error: error.message }
    }

    // 获取私有 URL（需要签名）
    const { data: signedUrlData } = await supabase.storage
      .from('user-uploads')
      .createSignedUrl(data.path, 3600) // 1小时有效期

    if (!signedUrlData) {
      return { error: 'Failed to generate signed URL' }
    }

    return {
      url: signedUrlData.signedUrl,
      path: data.path,
    }
  } catch (error) {
    console.error('Upload failed:', error)
    return { error: 'Upload failed' }
  }
}

/**
 * 上传生成的结果图到 generated-results bucket
 */
export async function uploadGeneratedImage(
  imageUrl: string,
  userId: string,
  generationId: string
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const supabase = createClient()

    let blob: Blob

    // 处理 data URL (base64) 或普通 URL
    if (imageUrl.startsWith('data:')) {
      // 从 base64 data URL 转换为 Blob
      const response = await fetch(imageUrl)
      blob = await response.blob()
    } else {
      // 从远程 URL 下载图片
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      blob = await response.blob()
    }

    // 生成文件名
    const fileName = `${userId}/${generationId}.png`

    // 上传到 generated-results bucket (公开)
    const { data, error } = await supabase.storage
      .from('generated-results')
      .upload(fileName, blob, {
        contentType: 'image/png',
        cacheControl: '31536000', // 1年缓存
        upsert: false,
      })

    if (error) {
      console.error('Upload generated image error:', error)
      return { error: error.message }
    }

    // 获取公开 URL
    const { data: publicUrlData } = supabase.storage
      .from('generated-results')
      .getPublicUrl(data.path)

    return {
      url: publicUrlData.publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error('Upload generated image failed:', error)
    return { error: 'Failed to upload generated image' }
  }
}

/**
 * 删除文件
 */
export async function deleteFile(
  bucket: 'user-uploads' | 'generated-results',
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete file failed:', error)
    return { success: false, error: 'Failed to delete file' }
  }
}

/**
 * 获取文件的公开 URL
 */
export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
