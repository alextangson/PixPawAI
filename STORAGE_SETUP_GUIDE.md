# 🗄️ Supabase Storage 配置指南

## ⚡ 快速开始（5分钟）

### Step 1: 创建 Storage Buckets

1. 打开 Supabase Dashboard:
   ```
   https://app.supabase.com → 您的项目 → Storage
   ```

2. 创建第一个 bucket: `user-uploads`
   - 点击 **"New Bucket"**
   - Name: `user-uploads`
   - **Public bucket**: ❌ **关闭**（私有）
   - 点击 **"Create bucket"**

3. 创建第二个 bucket: `generated-results`
   - 点击 **"New Bucket"**
   - Name: `generated-results`
   - **Public bucket**: ✅ **开启**（公开）
   - 点击 **"Create bucket"**

---

### Step 2: 配置 Storage Policies (访问权限)

1. 打开 Supabase SQL Editor:
   ```
   https://app.supabase.com → 您的项目 → SQL Editor
   ```

2. 点击 **"New Query"**

3. 复制并运行以下 SQL:

```sql
-- ============================================
-- Storage Policies 配置
-- ============================================

-- 1. user-uploads bucket policies (私有)
-- 用户只能上传和查看自己的文件
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. generated-results bucket policies (公开)
-- 所有人可以查看，只有所有者可以上传
CREATE POLICY "Anyone can view generated images"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-results');

CREATE POLICY "Users can upload generated results"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated-results' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own generated results"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-results' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

4. 点击 **"Run"**

5. 看到 ✅ "Success" 消息

---

### Step 3: 验证配置

运行以下 SQL 来验证 buckets 已创建：

```sql
-- 查看所有 buckets
SELECT * FROM storage.buckets;

-- 应该看到:
-- id                 | name                | public
-- user-uploads       | user-uploads        | false
-- generated-results  | generated-results   | true
```

---

## ✅ 配置完成检查清单

- [ ] ✅ 创建了 `user-uploads` bucket (Private)
- [ ] ✅ 创建了 `generated-results` bucket (Public)
- [ ] ✅ 运行了 Storage Policies SQL
- [ ] ✅ 验证了 buckets 存在

---

## 🧪 测试 Storage

### 测试上传功能

1. 确保开发服务器在运行:
   ```bash
   npm run dev
   ```

2. 打开浏览器: `http://localhost:3000`

3. 登录您的账号

4. 点击 **"Get Started"** 或 **"Try It Free"**

5. 选择一个风格

6. 上传宠物照片

7. 点击 **"Generate"**

8. 等待生成完成（10-30秒）

### 验证结果

在 Supabase Dashboard → Storage 中，您应该看到：

**user-uploads** bucket:
```
📁 user-uploads/
  └── 📁 <user-id>/
       └── 📄 <timestamp>-<random>.jpg
```

**generated-results** bucket:
```
📁 generated-results/
  └── 📁 <user-id>/
       └── 📄 <generation-id>.png
```

---

## 🔧 故障排查

### 问题 1: "Failed to upload"

**可能原因:**
- Buckets 未创建
- Policies 未配置

**解决方案:**
```sql
-- 检查 buckets
SELECT * FROM storage.buckets WHERE name IN ('user-uploads', 'generated-results');

-- 检查 policies
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

---

### 问题 2: "Access denied"

**可能原因:**
- Policies 配置错误
- 用户未认证

**解决方案:**
- 确保用户已登录
- 重新运行 Policies SQL
- 检查 bucket public 设置

---

### 问题 3: "CORS error"

**可能原因:**
- CORS 配置问题

**解决方案:**

在 Supabase Dashboard → Storage → Settings:

```json
{
  "allowedOrigins": [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://your-production-domain.com"
  ]
}
```

---

## 📊 Storage 配额和成本

### Supabase 免费计划:
- ✅ 1GB Storage
- ✅ 2GB Bandwidth/月
- ✅ 无限 API 请求

### 估算:
- 每张用户上传图片: ~2-5MB
- 每张生成结果: ~1-2MB
- 1GB ≈ 300-500 张图片

---

## 🚀 下一步

配置完成后：

1. ✅ Storage Buckets 已创建
2. ✅ Policies 已配置
3. ✅ 代码已实现

**现在可以测试完整流程:**

1. 登录 → 选择风格 → 上传照片 → 生成 → 查看结果

2. 检查 Supabase Storage 中的文件

3. 验证 credits 正确扣除

---

## 📞 需要帮助？

如果遇到问题：

1. 检查 Supabase Dashboard → Storage
2. 查看浏览器 Console 错误
3. 查看服务器终端日志
4. 运行 SQL 验证查询

---

## ✅ 完成！

配置完成后，您的 PixPaw AI 就可以：
- ✅ 上传用户照片
- ✅ 调用 AI 生成肖像
- ✅ 保存生成结果
- ✅ 显示给用户
- ✅ 扣除 credits

🎉 **准备好测试了！**
