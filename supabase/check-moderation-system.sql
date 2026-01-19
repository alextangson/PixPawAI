-- ============================================
-- 检查内容审核系统是否已安装
-- ============================================

\echo '=== 检查审核相关表 ==='
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('moderation_logs', 'user_reports', 'user_bans') 
    THEN '✅ 存在' 
    ELSE '❌ 不存在' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('moderation_logs', 'user_reports', 'user_bans');

\echo ''
\echo '=== 检查索引 ==='
SELECT 
  indexname,
  tablename,
  '✅ 存在' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE '%moderation%' OR indexname LIKE '%report%' OR indexname LIKE '%ban%'
ORDER BY tablename, indexname;

\echo ''
\echo '=== 检查函数 ==='
SELECT 
  routine_name,
  '✅ 存在' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_user_violation_count', 'is_user_banned', 'log_violation');

\echo ''
\echo '=== 检查数据量 ==='
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

\echo ''
\echo '=== RLS策略检查 ==='
SELECT 
  schemaname,
  tablename,
  policyname,
  '✅ 已启用' as status
FROM pg_policies
WHERE tablename IN ('moderation_logs', 'user_reports', 'user_bans')
ORDER BY tablename, policyname;
