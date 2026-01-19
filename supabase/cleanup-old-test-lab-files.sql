/**
 * 清理旧的 Test Lab 测试文件
 * 
 * 背景：
 * - 之前 Test Lab 上传的文件错误地保存在 generated-results/test-lab/
 * - 现在已修改为保存到 guest-uploads/test-lab/
 * 
 * 作用：
 * - 删除 generated-results bucket 中所有 test-lab/* 路径的文件
 * - 释放存储空间
 * 
 * 运行方式：
 * - 在 Supabase Dashboard → SQL Editor 中执行
 * - 或使用 Supabase CLI: supabase db execute -f cleanup-old-test-lab-files.sql
 * 
 * 安全性：
 * - ✅ 只删除 test-lab/ 目录，不会影响用户真实生成的图片
 * - ✅ 可重复执行，不会报错
 */

-- 查看有多少测试文件需要清理（先预览）
SELECT 
  COUNT(*) AS total_test_files,
  SUM(metadata->>'size')::bigint / 1024 / 1024 AS total_size_mb
FROM storage.objects
WHERE bucket_id = 'generated-results' 
  AND name LIKE 'test-lab/%';

-- 如果上面的查询结果显示有文件，执行下面的删除命令

/**
 * 删除所有 test-lab 测试文件
 * 
 * ⚠️ 注意：这是不可逆操作！
 * ⚠️ 确认上面的预览查询结果后再执行
 */
DELETE FROM storage.objects
WHERE bucket_id = 'generated-results' 
  AND name LIKE 'test-lab/%';

-- 验证清理结果（应该返回 0）
SELECT COUNT(*) AS remaining_test_files
FROM storage.objects
WHERE bucket_id = 'generated-results' 
  AND name LIKE 'test-lab/%';

/**
 * 输出示例：
 * 
 * 清理前：
 *   total_test_files | total_size_mb
 *   -----------------|---------------
 *                 15 |             8
 * 
 * 清理后：
 *   remaining_test_files
 *   --------------------
 *                     0
 */
