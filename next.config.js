/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage - 主要图片源
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      // Replicate CDN - AI生成图片
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      // Unsplash - 示例图片
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // 通配符后备（保持兼容性）
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    // 配置允许的图片质量值
    qualities: [75, 90, 100],
  },
}

module.exports = nextConfig
