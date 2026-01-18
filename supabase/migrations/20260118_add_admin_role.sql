-- 添加 admin 角色功能到 profiles 表
-- 执行时间: 2026-01-18
-- 
-- 功能说明:
-- 1. 添加 role 字段到 profiles 表
-- 2. 设置默认值为 'user'
-- 3. 只允许 'user' 或 'admin' 两种角色
-- 4. 创建索引提升查询性能

-- Step 1: 添加 role 字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN role TEXT DEFAULT 'user' 
    CHECK (role IN ('user', 'admin'));
    
    RAISE NOTICE 'Added role column to profiles table';
  ELSE
    RAISE NOTICE 'role column already exists in profiles table';
  END IF;
END $$;

-- Step 2: 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Step 3: 设置特定用户为管理员
-- ⚠️ 请替换为你的实际邮箱地址
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'admin@pixpawai.com',          -- 替换为你的主邮箱
  'your-email@example.com'       -- 替换为你的备用邮箱
  -- 可以添加更多管理员邮箱
)
AND role != 'admin';  -- 避免重复更新

-- Step 4: 显示当前管理员列表（用于验证）
DO $$ 
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
  RAISE NOTICE 'Current admin count: %', admin_count;
END $$;

-- Step 5: 添加注释
COMMENT ON COLUMN profiles.role IS '用户角色: user=普通用户, admin=管理员';

-- 验证SQL（可选，复制到 Supabase SQL Editor 运行）:
-- SELECT email, role, created_at FROM profiles WHERE role = 'admin';
