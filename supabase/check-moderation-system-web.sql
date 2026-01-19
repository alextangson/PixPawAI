-- ============================================
-- 检查内容审核系统是否已安装（Web版本）
-- 可以直接在 Supabase Dashboard 运行
-- ============================================

-- 1. 检查审核相关表
SELECT 
  '=== 检查审核相关表 ===' as step;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('moderation_logs', 'user_reports', 'user_bans') 
    THEN '✅ 存在' 
    ELSE '❌ 不存在' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('moderation_logs', 'user_reports', 'user_bans')
ORDER BY table_name;

-- 2. 检查索引
SELECT 
  '=== 检查索引 ===' as step;

SELECT 
  indexname,
  tablename,
  '✅ 存在' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (indexname LIKE '%moderation%' OR indexname LIKE '%report%' OR indexname LIKE '%ban%')
ORDER BY tablename, indexname;

-- 3. 检查函数
SELECT 
  '=== 检查函数 ===' as step;

SELECT 
  routine_name,
  '✅ 存在' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_user_violation_count', 'is_user_banned', 'log_violation');

-- 4. 检查数据量
SELECT 
  '=== 检查数据量 ===' as step;

SELECT 
  'moderation_logs' as table_name,
  COUNT(*) as record_count
FROM moderation_logs
UNION ALL
SELECT 
  'user_reports',
  COUNT(*)
FROM user_reports
UNION ALL
SELECT 
  'user_bans',
  COUNT(*)
FROM user_bans;

-- 5. RLS策略检查
SELECT 
  '=== RLS策略检查 ===' as step;

SELECT 
  tablename,
  policyname,
  '✅ 已启用' as status
FROM pg_policies
WHERE tablename IN ('moderation_logs', 'user_reports', 'user_bans')
ORDER BY tablename, policyname;

-- 6. 总结
SELECT 
  '=== 系统状态总结 ===' as step;

SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('moderation_logs', 'user_reports', 'user_bans')) = 3
    THEN '✅ 所有表都已创建'
    ELSE '❌ 缺少某些表'
  END as table_status,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name IN ('get_user_violation_count', 'is_user_banned', 'log_violation')) = 3
    THEN '✅ 所有函数都已创建'
    ELSE '❌ 缺少某些函数'
  END as function_status,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies 
          WHERE tablename IN ('moderation_logs', 'user_reports', 'user_bans')) > 0
    THEN '✅ RLS策略已配置'
    ELSE '❌ 未配置RLS策略'
  END as rls_status;
