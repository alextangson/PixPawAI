-- ============================================
-- 清理 Supabase 中老的不完整数据和未分享图片
-- 创建时间: 2026-01-18
-- 用途: 删除失败、不完整、未分享到 gallery 的生成记录
-- ============================================

-- ============================================
-- 第一步：检查即将删除的数据（先不删除）
-- ============================================

-- 1. 统计各类需要清理的数据
SELECT '数据统计' as category;

SELECT 
  '失败的生成 (status = failed)' as type,
  COUNT(*) as count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM generations
WHERE status = 'failed';

SELECT 
  '长时间卡住的生成 (processing > 24小时)' as type,
  COUNT(*) as count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM generations
WHERE status = 'processing' 
  AND created_at < NOW() - INTERVAL '24 hours';

SELECT 
  '成功但没有输出URL的记录' as type,
  COUNT(*) as count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM generations
WHERE status = 'succeeded' 
  AND output_url IS NULL;

SELECT 
  '未分享到gallery的图片 (is_public = false)' as type,
  COUNT(*) as count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM generations
WHERE is_public = false;

SELECT 
  '没有quality_check数据的老记录' as type,
  COUNT(*) as count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM generations
WHERE quality_check IS NULL 
  AND created_at < NOW() - INTERVAL '7 days';

-- 2. 查看具体的记录样本（前10条）
SELECT '===== 失败记录样本 =====' as separator;
SELECT 
  id,
  user_id,
  status,
  style,
  created_at,
  error_message,
  output_url IS NOT NULL as has_output
FROM generations
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;

SELECT '===== 卡住的processing记录样本 =====' as separator;
SELECT 
  id,
  user_id,
  status,
  style,
  created_at,
  output_url IS NOT NULL as has_output
FROM generations
WHERE status = 'processing' 
  AND created_at < NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;


-- ============================================
-- 第二步：安全删除策略（分批执行）
-- ============================================

-- ⚠️ 警告：执行下面的DELETE语句前，请先确认上面的统计数据！
-- 建议：先执行检查，确认无误后再执行删除

-- ============================================
-- 删除方案 A：保守清理（推荐）
-- 只删除明确失败和长期卡住的记录，保留所有成功的图（不管是否分享）
-- ============================================

-- 开始事务（可以回滚）
BEGIN;

-- A1. 删除失败的生成记录
DELETE FROM generations
WHERE status = 'failed';
-- 预计删除数量：见上方统计

-- A2. 删除超过24小时仍在processing的记录（很可能已经失败）
DELETE FROM generations
WHERE status = 'processing' 
  AND created_at < NOW() - INTERVAL '24 hours';
-- 预计删除数量：见上方统计

-- A3. 删除成功但没有output_url的异常记录
DELETE FROM generations
WHERE status = 'succeeded' 
  AND output_url IS NULL;
-- 预计删除数量：见上方统计

-- 查看删除后的统计
SELECT 
  status,
  is_public,
  COUNT(*) as count
FROM generations
GROUP BY status, is_public
ORDER BY status, is_public;

-- 如果满意，执行 COMMIT; 如果要撤销，执行 ROLLBACK;
-- COMMIT;
ROLLBACK;  -- 默认回滚，确认无误后改为 COMMIT


-- ============================================
-- 删除方案 B：激进清理（慎用！）
-- 删除所有未分享到gallery的图片（包括成功的私有图）
-- ============================================

-- ⚠️⚠️⚠️ 警告：这会删除用户保存但未分享的图片！！！
-- 只有在确认用户不需要私有图片时才执行！

-- 取消下面注释以执行激进清理：
/*
BEGIN;

-- B1. 删除所有未分享的图片（is_public = false）
DELETE FROM generations
WHERE is_public = false;

-- B2. 保留最近7天的未分享记录（给用户缓冲时间）
-- 只删除7天前未分享的图
DELETE FROM generations
WHERE is_public = false
  AND created_at < NOW() - INTERVAL '7 days';

-- 查看删除后的统计
SELECT 
  status,
  is_public,
  COUNT(*) as count
FROM generations
GROUP BY status, is_public;

-- 确认后提交
-- COMMIT;
ROLLBACK;
*/


-- ============================================
-- 删除方案 C：精细清理（推荐用于生产环境）
-- 组合策略：删除失败+老旧未分享
-- ============================================

BEGIN;

-- C1. 删除所有失败的记录
DELETE FROM generations
WHERE status = 'failed';

-- C2. 删除长期卡住的processing记录
DELETE FROM generations
WHERE status = 'processing' 
  AND created_at < NOW() - INTERVAL '24 hours';

-- C3. 删除30天前创建且未分享的私有图片
-- (给用户足够时间分享，超过30天未分享说明用户不需要)
DELETE FROM generations
WHERE is_public = false
  AND created_at < NOW() - INTERVAL '30 days';

-- C4. 删除没有quality_check且超过14天的老记录
-- (这些是迁移前的老数据，可能不完整)
DELETE FROM generations
WHERE quality_check IS NULL 
  AND created_at < NOW() - INTERVAL '14 days';

-- 查看删除后的统计
SELECT 
  status,
  is_public,
  quality_check IS NOT NULL as has_quality_check,
  COUNT(*) as count
FROM generations
GROUP BY status, is_public, quality_check IS NOT NULL
ORDER BY status, is_public;

-- 确认后提交
-- COMMIT;
ROLLBACK;  -- 默认回滚，确认无误后改为 COMMIT


-- ============================================
-- 第三步：清理后的验证
-- ============================================

-- 执行COMMIT后，运行以下查询验证清理结果：

-- 1. 查看剩余数据统计
SELECT 
  status,
  is_public,
  COUNT(*) as count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM generations
GROUP BY status, is_public
ORDER BY status, is_public;

-- 2. 确认没有异常记录
SELECT 
  '异常记录检查' as check_type,
  COUNT(*) as count
FROM generations
WHERE (
  -- 成功但没有output_url
  (status = 'succeeded' AND output_url IS NULL)
  OR
  -- 长期卡住的processing
  (status = 'processing' AND created_at < NOW() - INTERVAL '24 hours')
);

-- 3. 查看各用户的记录数量
SELECT 
  user_id,
  COUNT(*) as total_generations,
  COUNT(*) FILTER (WHERE is_public = true) as public_generations,
  COUNT(*) FILTER (WHERE is_public = false) as private_generations
FROM generations
GROUP BY user_id
ORDER BY total_generations DESC
LIMIT 20;


-- ============================================
-- 使用说明
-- ============================================
/*
1. 先执行「第一步：检查」部分，查看数据统计
2. 根据统计结果选择合适的删除方案：
   - 方案 A（保守）：只删除明确失败的记录，保留所有成功的图
   - 方案 B（激进）：删除所有未分享的图片（慎用！）
   - 方案 C（推荐）：组合策略，删除失败+老旧未分享
3. 在Supabase SQL Editor中执行选定的方案
4. 如果满意结果，将 ROLLBACK 改为 COMMIT
5. 执行「第三步：验证」部分，确认清理结果

⚠️ 重要提醒：
- 在生产环境执行前，建议先在测试环境验证
- 删除操作不可逆，请务必确认数据统计后再执行
- 使用 BEGIN/ROLLBACK/COMMIT 可以安全测试
- 建议在低峰时段执行，避免影响用户体验
*/
