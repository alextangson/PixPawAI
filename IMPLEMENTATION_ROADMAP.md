# 🚀 PixPaw AI - 实现路线图

**当前状态**: ✅ 认证完成 | ✅ 数据库完成 | ✅ UI 完成  
**下一步**: 实现核心 AI 生成功能

---

## 📋 Phase 1: Supabase Storage 配置（15分钟）

### 1.1 在 Supabase 控制台创建 Storage Buckets

打开: `https://app.supabase.com → 您的项目 → Storage`

创建两个 buckets：

#### Bucket 1: `user-uploads` (私有)
```
Name: user-uploads
Public: false (关闭)
Allowed MIME types: image/*
File size limit: 10MB
```

#### Bucket 2: `generated-results` (公开)
```
Name: generated-results  
Public: true (开启)
Allowed MIME types: image/*
File size limit: 10MB
```

### 1.2 配置 Storage Policies

在 Supabase SQL Editor 运行：

```sql
-- user-uploads: 用户只能上传和访问自己的文件
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- generated-results: 所有人可以查看，只有所有者可以上传
CREATE POLICY "Anyone can view generated images"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-results');

CREATE POLICY "Users can upload generated results"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'generated-results' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 📋 Phase 2: 实现文件上传功能（30分钟）

### 2.1 创建 Supabase Storage 辅助函数

文件: `lib/supabase/storage.ts`

功能：
- 上传用户图片到 `user-uploads`
- 生成唯一文件名
- 返回公开 URL

### 2.2 更新 Upload Modal 组件

文件: `components/upload-modal.tsx`

实现：
- 上传图片到 Supabase Storage
- 显示上传进度
- 错误处理

---

## 📋 Phase 3: 选择并集成 AI API（1-2小时）

### 选项 A: Replicate API (推荐 - 最简单)

**优点:**
- 官方 SDK 支持
- 按使用付费
- 多种模型选择（Flux, SDXL）
- 自动处理队列和 webhook

**设置步骤:**
1. 注册: https://replicate.com
2. 获取 API Token: Settings → API Tokens
3. 添加到 `.env.local`: `REPLICATE_API_TOKEN=r8_xxx`
4. 安装 SDK: `npm install replicate`

**推荐模型:**
- `black-forest-labs/flux-dev` - 高质量，较慢
- `stability-ai/sdxl` - 平衡

### 选项 B: Stability AI

**优点:**
- 专业 API
- Stable Diffusion 官方
- 高质量输出

**缺点:**
- 需要等待列表
- 相对复杂

### 选项 C: OpenAI DALL-E 3

**优点:**
- 简单易用
- 高质量
- 官方支持

**缺点:**
- 成本较高
- 风格限制

**推荐**: 使用 **Replicate** 开始

---

## 📋 Phase 4: 创建 API 路由（1小时）

### 4.1 生成 API 端点

文件: `app/api/generate/route.ts`

功能：
1. ✅ 验证用户认证
2. ✅ 检查用户 credits
3. ✅ 扣除 1 credit
4. ✅ 调用 AI API
5. ✅ 保存到 `generations` 表
6. ✅ 上传结果到 Storage
7. ✅ 返回生成结果

### 4.2 Webhook 端点（异步生成）

文件: `app/api/webhooks/generation/route.ts`

功能：
- 接收 Replicate webhook
- 更新 generation 状态
- 保存生成的图片

---

## 📋 Phase 5: 实现生成状态追踪（30分钟）

### 5.1 轮询/实时更新

选项：
- **简单**: 前端轮询检查状态
- **高级**: Supabase Realtime subscriptions

### 5.2 生成历史页面

文件: `app/[lang]/history/page.tsx`

功能：
- 显示用户的所有生成记录
- 状态指示器（processing/succeeded/failed）
- 下载/分享功能

---

## 📋 Phase 6: Credits 系统集成（30分钟）

### 6.1 Credits 显示

- ✅ 已完成（Navbar 用户菜单）

### 6.2 Credits 不足处理

- 检查 credits > 0
- 显示购买提示
- 重定向到 Pricing 页面

### 6.3 Pricing 页面完善

文件: `app/[lang]/pricing/page.tsx`

集成 Stripe/Lemon Squeezy 用于购买 credits

---

## 📋 Phase 7: 测试完整流程（30分钟）

### 测试清单:

- [ ] 用户注册 → 获得 2 免费 credits
- [ ] 上传宠物照片 → 成功保存到 Storage
- [ ] 选择风格 → 开始生成
- [ ] Credits 扣除 1
- [ ] AI 生成完成 → 显示结果
- [ ] 下载/分享生成的图片
- [ ] Credits 用完 → 显示购买提示

---

## 🎯 优先级排序

### 🔥 立即开始 (今天)
1. ✅ 配置 Supabase Storage (Phase 1)
2. ✅ 实现文件上传 (Phase 2)
3. ✅ 集成 Replicate API (Phase 3)

### 📅 本周完成
4. ✅ 创建 API 路由 (Phase 4)
5. ✅ 生成状态追踪 (Phase 5)

### 📅 下周完成
6. ✅ Credits 系统完善 (Phase 6)
7. ✅ 支付集成 (Stripe)
8. ✅ Gallery 实现

---

## 📚 需要的环境变量

更新 `.env.local`:

```bash
# Supabase (已有)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Replicate AI
REPLICATE_API_TOKEN=r8_xxx...

# Stripe (可选 - 支付)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 🚀 快速开始

### Step 1: 配置 Storage
```bash
# 在 Supabase 控制台创建 buckets 和 policies
```

### Step 2: 注册 Replicate
```bash
# 1. 访问 https://replicate.com
# 2. 获取 API token
# 3. 添加到 .env.local
```

### Step 3: 安装依赖
```bash
npm install replicate
```

### Step 4: 实现代码
```bash
# 我会帮您创建所有必要的文件
```

---

## 📞 需要帮助？

告诉我您想从哪个 Phase 开始，我会帮您逐步实现！

推荐顺序：
1. Phase 1 (Storage 配置) - 5分钟
2. Phase 2 (文件上传) - 我来写代码
3. Phase 3 (AI API) - 我来写代码
