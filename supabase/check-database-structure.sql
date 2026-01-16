-- ============================================
-- 检查现有数据库结构
-- ============================================
-- 在 Supabase SQL Editor 中运行这个查询
-- ============================================

-- 1. 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. 查看 profiles 表的所有列（如果存在）
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. 查看 generations 表的所有列（如果存在）
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'generations'
ORDER BY ordinal_position;

-- 4. 查看所有包含 'generation' 的表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE '%generation%'
ORDER BY table_name;

-- 5. 查看所有包含 'profile' 的表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE '%profile%'
ORDER BY table_name;

-- 6. 查看所有函数
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
