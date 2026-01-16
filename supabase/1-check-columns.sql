-- ============================================
-- 第一步：检查 generations 表现有的列
-- 在 Supabase SQL Editor 中运行
-- ============================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'generations'
ORDER BY ordinal_position;
