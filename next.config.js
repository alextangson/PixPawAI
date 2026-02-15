/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  // Blog route rewrites - support both /blog and /how-to URLs
  async rewrites() {
    return [
      // Blog list page
      {
        source: '/:lang/blog',
        destination: '/:lang/how-to',
      },
      // Individual blog article pages
      {
        source: '/:lang/blog/:slug',
        destination: '/:lang/how-to/:slug',
      },
    ]
  },
  // Redirects for SEO - www to non-www canonical unification
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.pixpawai.com',
          },
        ],
        destination: 'https://pixpawai.com/:path*',
        statusCode: 308, // permanent redirect
      },
    ]
  },
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
    qualities: [75, 85, 90, 100],
    // 最小化优化器错误
    minimumCacheTTL: 60,
    // 图片优化器配置
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // 抑制 sharp 库的 Fontconfig 警告（不影响功能）
  env: {
    FONTCONFIG_PATH: process.env.FONTCONFIG_PATH || '',
  },
}

module.exports = nextConfig
