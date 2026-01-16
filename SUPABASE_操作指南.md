# 🗄️ Supabase 数据库操作指南

**更新日期：** 2026年1月16日  
**操作时长：** 5分钟  
**难度：** ⭐⭐☆☆☆ (简单)

---

## 📋 快速总结

**好消息：** 你的数据库很可能已经有了大部分更新（通过之前的迁移文件），**只需要添加 1 个函数** ✅

**必做项目：**
1. ✅ 运行检查脚本（看看缺什么）
2. ⚠️ 添加 `increment_credits` 函数（**CRITICAL - 必须做**）

**可选项目：**
- 如果检查脚本显示缺少列，再添加（很可能不需要）

---

## 🚀 操作步骤（3步搞定）

### 步骤 1：检查数据库状态

1. 打开 **Supabase Dashboard** → 进入你的项目
2. 点击左侧菜单 **"SQL Editor"**
3. 点击 **"New Query"**
4. 复制粘贴这个文件的内容：
   ```
   supabase/CHECK_AND_FIX.sql
   ```
5. 点击 **"Run"** (或按 Ctrl+Enter)

**你会看到：**
```
════════════════════════════════════════════════════
第一步：检查 generations 表结构
════════════════════════════════════════════════════
✅ 所有列都存在！不需要添加列。

════════════════════════════════════════════════════
第二步：检查 increment_credits 函数
════════════════════════════════════════════════════
❌ increment_credits 函数不存在！
   → 这个函数是 CRITICAL，必须创建！
   → 请运行下面的 "修复脚本"

════════════════════════════════════════════════════
第三步：检查 shared-cards 存储桶
════════════════════════════════════════════════════
✅ shared-cards 存储桶已存在！
```

---

### 步骤 2：运行修复脚本（如果需要）

**如果上面显示有 ❌ 或 ⚠️：**

1. 在同一个 SQL Editor 中
2. 找到脚本最下面的注释部分（以 `/*` 开头）
3. 选中整个注释块（从 `/*` 到 `*/`）
4. 删除开头的 `/*` 和结尾的 `*/`（取消注释）
5. 点击 **"Run"**

**或者直接运行这个更简单的脚本：**

```sql
-- 只需要这一个函数（CRITICAL!）
CREATE OR REPLACE FUNCTION public.increment_credits(user_uuid UUID, amount INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits = credits + amount
  WHERE id = user_uuid
  RETURNING credits INTO new_credits;
  
  IF new_credits IS NULL THEN
    RAISE EXCEPTION 'User not found: %', user_uuid;
  END IF;
  
  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**运行后会看到：**
```
✅ 所有修复已应用！
📋 已添加：increment_credits 函数
现在可以部署前端代码了！
```

---

### 步骤 3：验证修复

运行这个测试查询：

```sql
-- 测试函数是否存在（应该返回 1 行）
SELECT proname, proargtypes
FROM pg_proc
WHERE proname = 'increment_credits';
```

**如果返回结果：** ✅ 完成！可以部署代码了！  
**如果没有结果：** ❌ 函数创建失败，重新运行步骤 2

---

## 🎯 你具体需要做什么？

### 情况 A：你之前运行过迁移文件（最可能）

**你的数据库很可能有：**
- ✅ `is_public`, `title`, `alt_text` 等列（通过 `migration-share-to-earn.sql` 添加）
- ✅ `views`, `likes`, `share_card_url` 列（通过 `final-migration-share-system.sql` 添加）
- ✅ `shared-cards` 存储桶

**但是缺少：**
- ❌ `increment_credits` 函数（这是新的！）

**你需要做：**
1. 运行 `CHECK_AND_FIX.sql` 检查
2. 如果确认缺少函数，运行上面的 `CREATE FUNCTION` 脚本
3. 完成！

**耗时：** 2 分钟

---

### 情况 B：全新数据库（不太可能）

如果你的数据库是全新的：

**你需要做：**
1. 运行完整的 `supabase/schema.sql`
2. 运行 `supabase/add-increment-credits-function.sql`
3. 完成！

**耗时：** 5 分钟

---

## ⚡ 最简单的方法（推荐）

**直接在 Supabase SQL Editor 运行这个：**

```sql
-- 一键修复脚本（幂等性，可以重复运行）
-- ============================================

-- 1. 添加缺失的列（如果已存在会跳过）
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS alt_text TEXT;

ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS is_rewarded BOOLEAN DEFAULT false;

ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS style_category TEXT;

ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS share_card_url TEXT;

-- 2. 创建 increment_credits 函数（CRITICAL!）
CREATE OR REPLACE FUNCTION public.increment_credits(user_uuid UUID, amount INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits = credits + amount
  WHERE id = user_uuid
  RETURNING credits INTO new_credits;
  
  IF new_credits IS NULL THEN
    RAISE EXCEPTION 'User not found: %', user_uuid;
  END IF;
  
  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 创建 shared-cards 存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared-cards', 'shared-cards', true)
ON CONFLICT (id) DO NOTHING;

-- 4. 添加存储桶策略
DO $$
BEGIN
  -- Public view policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public can view share cards'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view share cards"
    ON storage.objects FOR SELECT
    USING (bucket_id = ''shared-cards'')';
  END IF;
  
  -- User upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can upload share cards'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can upload share cards"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = ''shared-cards'')';
  END IF;
END $$;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ 数据库更新完成！✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE '你现在可以：';
  RAISE NOTICE '1. 部署前端代码（git push）';
  RAISE NOTICE '2. 测试信用点系统（生成图片 → 分享 → 检查是否 +1）';
  RAISE NOTICE '3. 测试分享功能（分享 → 下载社交卡片）';
  RAISE NOTICE '';
  RAISE NOTICE '如有问题，请查看 DEPLOYMENT_CHECKLIST.md';
END $$;
```

**复制上面的整个脚本 → 粘贴到 Supabase SQL Editor → 点击 Run**

---

## ✅ 完成后的验证

运行这个查询确认一切正常：

```sql
-- 验证查询
SELECT 
  '✅ increment_credits 函数' AS check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_credits') 
    THEN '存在' 
    ELSE '❌ 不存在' 
  END AS status
UNION ALL
SELECT 
  '✅ is_public 列' AS check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generations' AND column_name = 'is_public') 
    THEN '存在' 
    ELSE '❌ 不存在' 
  END AS status
UNION ALL
SELECT 
  '✅ shared-cards 存储桶' AS check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'shared-cards') 
    THEN '存在' 
    ELSE '❌ 不存在' 
  END AS status;
```

**期望结果：**
```
check_item                   | status
───────────────────────────────────────
✅ increment_credits 函数    | 存在
✅ is_public 列              | 存在
✅ shared-cards 存储桶       | 存在
```

---

## 🚨 常见问题

### Q1: 我不确定之前是否运行过迁移文件？

**答：** 没关系！直接运行上面的"一键修复脚本"。所有操作都是**幂等的**（可以重复运行），不会出错。

```sql
-- 这些命令可以安全地重复运行：
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...  ← 如果存在就跳过
CREATE OR REPLACE FUNCTION ...                ← 会覆盖旧的
ON CONFLICT (id) DO NOTHING                   ← 如果存在就跳过
```

---

### Q2: 运行脚本时出现错误怎么办？

**常见错误 1：**
```
ERROR: relation "public.generations" does not exist
```
**解决：** 你的数据库还没有基础表，需要先运行 `supabase/schema.sql`

**常见错误 2：**
```
ERROR: permission denied for schema public
```
**解决：** 你的账号权限不足，请使用 Owner 或 Admin 账号登录

**常见错误 3：**
```
ERROR: function "increment_credits" already exists
```
**解决：** 这不是错误！函数已经存在了，可以忽略或使用 `CREATE OR REPLACE`

---

### Q3: 我需要备份数据库吗？

**答：** 不需要！这些修改都是**安全的**：
- ✅ 只添加列（不删除）
- ✅ 只创建函数（不修改现有数据）
- ✅ 只添加存储桶（不影响现有的）

但如果你想保险起见，可以在 Supabase Dashboard 点击 **"Database" → "Backups"** 手动创建一个快照。

---

### Q4: 运行后需要重启什么吗？

**答：** 不需要！Supabase 会立即生效：
- ✅ 新函数立即可用
- ✅ 新列立即可用
- ✅ 存储桶立即可用

直接部署前端代码即可！

---

## 🎯 推荐操作流程（最简单）

### Step 1: 检查（30秒）
```sql
-- 复制粘贴到 Supabase SQL Editor，点击 Run
SELECT proname FROM pg_proc WHERE proname = 'increment_credits';
```

**如果返回空：** 需要创建函数（继续步骤 2）  
**如果返回 1 行：** 已经有了，跳到步骤 3 ✅

---

### Step 2: 修复（2分钟）

**直接复制这个完整脚本到 SQL Editor：**

```sql
-- 创建 increment_credits 函数
CREATE OR REPLACE FUNCTION public.increment_credits(user_uuid UUID, amount INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits = credits + amount
  WHERE id = user_uuid
  RETURNING credits INTO new_credits;
  
  IF new_credits IS NULL THEN
    RAISE EXCEPTION 'User not found: %', user_uuid;
  END IF;
  
  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 确认消息
DO $$
BEGIN
  RAISE NOTICE '✅ increment_credits 函数已创建！';
  RAISE NOTICE '现在可以部署前端代码了！';
END $$;
```

点击 **"Run"** → 看到 ✅ 成功消息 → 完成！

---

### Step 3: 部署前端代码（1分钟）

在你的电脑终端运行：

```bash
cd /Users/jiaxintang/Desktop/PixPawAI

# 提交代码
git add .
git commit -m "fix: Phase 1 & 2 - Schema fixes + UX improvements"

# 推送到生产环境
git push origin main
```

Vercel 会自动部署（约2分钟）。

---

## 🧪 测试修复是否成功

### 测试 1：测试 increment_credits 函数

```sql
-- 获取一个测试用户的 ID（用你的真实用户 ID）
SELECT id, credits FROM public.profiles LIMIT 1;

-- 假设 ID 是 '123e4567-e89b-12d3-a456-426614174000'
-- 测试增加 0 个信用点（不改变余额，只测试函数是否工作）
SELECT increment_credits('123e4567-e89b-12d3-a456-426614174000'::uuid, 0);

-- 应该返回当前的信用点数（比如 2）
-- 如果返回了数字 → ✅ 成功！
-- 如果报错 "User not found" → 用正确的 user_id
```

---

### 测试 2：测试前端功能

1. 打开你的网站
2. 生成一张图片
3. 点击 **"Share to Gallery"**
4. 查看信用点是否 +1
5. 打开 Dashboard → 点击 **"Shared"** 下拉菜单
6. 点击 **"View Analytics"** → 应该看到统计弹窗

**如果全部工作 → ✅ 大功告成！**

---

## 📝 总结：你需要做什么

### 最少操作（推荐）✅

```
1. 打开 Supabase SQL Editor
2. 复制粘贴 increment_credits 函数脚本
3. 点击 Run
4. 看到 ✅ 成功消息
5. 完成！部署前端代码！
```

**耗时：** 2 分钟  
**难度：** ⭐☆☆☆☆ (非常简单)

---

### 完整操作（保险起见）✅

```
1. 运行 CHECK_AND_FIX.sql 检查数据库
2. 根据检查结果，取消注释修复脚本
3. 点击 Run 应用修复
4. 运行验证查询确认成功
5. 完成！部署前端代码！
```

**耗时：** 5 分钟  
**难度：** ⭐⭐☆☆☆ (简单)

---

## 🎉 完成后你会得到

- ✅ 信用点系统正常工作（失败退款 + 分享奖励）
- ✅ 分享功能完全可用
- ✅ 社交卡片生成正常
- ✅ 数据库和代码完全匹配

---

## 🆘 需要帮助？

如果遇到任何问题：

1. 检查 Supabase Dashboard → **Logs** 标签（看错误日志）
2. 查看 `DEPLOYMENT_CHECKLIST.md`（英文详细指南）
3. 运行 `CHECK_AND_FIX.sql` 看具体缺什么
4. 确保用的是 **Owner** 或 **Admin** 账号（Service Role 权限）

---

**状态：** 准备就绪 ✅  
**风险：** 极低（所有操作都是安全的）  
**建议：** 现在就做，2分钟搞定！

---

*简体中文操作指南*  
*生成时间：2026年1月16日*  
*适用于：Supabase 云端数据库*
