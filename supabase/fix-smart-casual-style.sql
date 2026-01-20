-- ============================================
-- 修复 Smart Casual 风格的配置
-- 移除任何硬编码的异瞳或哈士奇提示词
-- ============================================

-- 1. 检查当前配置
SELECT 
  id,
  name,
  prompt_suffix,
  'Before fix' as status
FROM styles
WHERE id = 'Smart-Casual';

-- 2. 修复 prompt_suffix（移除任何异瞳或哈士奇相关词汇）
UPDATE styles 
SET 
  prompt_suffix = ', wearing a cozy textured turtleneck sweater and a herringbone newsboy flat cap, professional pet photography, solid warm background, sharp focus on eyes, clean and stylish modern aesthetic.',
  updated_at = now()
WHERE id = 'Smart-Casual'
  AND (
    prompt_suffix ILIKE '%heterochromia%' 
    OR prompt_suffix ILIKE '%异瞳%'
    OR prompt_suffix ILIKE '%husky%'
    OR prompt_suffix ILIKE '%哈士奇%'
    OR prompt_suffix ILIKE '%blue eye%' AND prompt_suffix ILIKE '%brown eye%'
  );

-- 3. 如果 description 字段包含问题词汇，修复它
UPDATE styles 
SET 
  description = 'Trendy look with a sweater and newsboy cap',
  updated_at = now()
WHERE id = 'Smart-Casual'
  AND description IS NOT NULL
  AND (
    description ILIKE '%heterochromia%' 
    OR description ILIKE '%husky%'
    OR description ILIKE '%异瞳%'
    OR description ILIKE '%哈士奇%'
  );

-- 4. 验证修复结果
SELECT 
  id,
  name,
  prompt_suffix,
  description,
  '✅ Fixed' as status,
  updated_at
FROM styles
WHERE id = 'Smart-Casual';

-- 5. 显示修复摘要
SELECT 
  '修复完成' as summary,
  CASE 
    WHEN prompt_suffix ILIKE '%heterochromia%' OR prompt_suffix ILIKE '%husky%' THEN '❌ 仍有问题，请手动检查'
    ELSE '✅ prompt_suffix 正常'
  END as prompt_check,
  CASE 
    WHEN description IS NOT NULL AND (description ILIKE '%heterochromia%' OR description ILIKE '%husky%') THEN '❌ description 仍有问题'
    ELSE '✅ description 正常'
  END as description_check
FROM styles
WHERE id = 'Smart-Casual';
