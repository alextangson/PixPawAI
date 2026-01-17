# PixPaw AI Brand Assets

## 当前文件
✅ `logo-orange.svg` - 主 Logo（橙色，2200x1431px）

## 建议添加的文件（可选）

### 基础图标
这些文件可以通过在线工具生成：
- `logo-128.png` - 小尺寸 PNG（导航栏备用）
- `logo-512.png` - 中等尺寸 PNG（PWA）
- `logo-icon.svg` - 只有图标部分（如只保留爪印）

### Favicon（浏览器标签图标）
放在 `/public/favicons/` 文件夹：
- `favicon.ico` - 标准浏览器图标
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180x180)

### 社交分享图
放在 `/public/og/` 文件夹：
- `og-image.png` (1200x630) - 带标语的完整卡片
- `twitter-card.png` (1200x628)

## 生成工具推荐

### PNG 尺寸生成
1. **在线工具**: https://squoosh.app/
   - 上传 SVG
   - 调整尺寸
   - 导出 PNG

2. **命令行** (如果安装了 ImageMagick):
```bash
# 在 brand 文件夹运行
convert logo-orange.svg -resize 128x128 logo-128.png
convert logo-orange.svg -resize 512x512 logo-512.png
```

### Favicon 生成
- https://favicon.io/ - 上传 logo 自动生成所有尺寸
- https://realfavicongenerator.net/ - 专业 favicon 生成器

### OG Image 设计
使用 Figma 或 Canva 创建 1200x630 的设计：
- 背景：品牌色（cream）
- Logo 居中或左对齐
- 标语："Turn Your Pet Into a Pixar Star"
- 可添加示例图片

## 使用说明

当前配置已经可以正常工作：
- ✅ 导航栏显示 Logo
- ✅ 页脚显示 Logo（白色版）
- ✅ Favicon 使用 SVG（现代浏览器支持）
- ✅ 社交分享使用 SVG（临时方案）

上述"建议添加的文件"是可选的优化项，用于：
- 更好的跨浏览器兼容性（老浏览器不支持 SVG favicon）
- 更专业的社交分享预览
- PWA 支持

## 颜色规范
- 主色（橙色）: `#FF8C42` / `#FD8A3E`
- 背景色（奶油白）: `#FFFDF9`
- 深色文字: `#2D2D2D`
