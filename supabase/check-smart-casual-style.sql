-- ============================================
-- 检查 Smart Casual 风格的配置
-- 查找是否有硬编码的异瞳或哈士奇提示词
-- ============================================

-- 1. 检查 Smart Casual 风格的完整配置
SELECT 
  id,
  name,
  prompt_suffix,
  negative_prompt,
  description,
  category,
  is_enabled,
  updated_at
FROM styles
WHERE id = 'Smart-Casual';

-- 2. 检查 prompt_suffix 中是否包含异瞳或哈士奇相关词汇
SELECT 
  id,
  name,
  CASE 
    WHEN prompt_suffix ILIKE '%heterochromia%' THEN '❌ 包含 heterochromia'
    WHEN prompt_suffix ILIKE '%异瞳%' THEN '❌ 包含 异瞳'
    WHEN prompt_suffix ILIKE '%husky%' THEN '❌ 包含 husky'
    WHEN prompt_suffix ILIKE '%哈士奇%' THEN '❌ 包含 哈士奇'
    WHEN prompt_suffix ILIKE '%blue eye%' AND prompt_suffix ILIKE '%brown eye%' THEN '❌ 包含异瞳描述'
    ELSE '✅ 无异常'
  END as check_result,
  prompt_suffix
FROM styles
WHERE id = 'Smart-Casual';

-- 3. 检查所有风格中是否有硬编码的异瞳或哈士奇
SELECT 
  id,
  name,
  CASE 
    WHEN prompt_suffix ILIKE '%heterochromia%' THEN '包含 heterochromia'
    WHEN prompt_suffix ILIKE '%异瞳%' THEN '包含 异瞳'
    WHEN prompt_suffix ILIKE '%husky%' THEN '包含 husky'
    WHEN prompt_suffix ILIKE '%哈士奇%' THEN '包含 哈士奇'
    WHEN prompt_suffix ILIKE '%blue eye%' AND prompt_suffix ILIKE '%brown eye%' THEN '包含异瞳描述'
    ELSE NULL
  END as issue,
  LEFT(prompt_suffix, 100) as prompt_preview
FROM styles
WHERE 
  prompt_suffix ILIKE '%heterochromia%' 
  OR prompt_suffix ILIKE '%异瞳%'
  OR prompt_suffix ILIKE '%husky%'
  OR prompt_suffix ILIKE '%哈士奇%'
  OR (prompt_suffix ILIKE '%blue eye%' AND prompt_suffix ILIKE '%brown eye%');

-- 4. 检查其他可能包含问题的字段
SELECT 
  id,
  name,
  description,
  CASE 
    WHEN description ILIKE '%heterochromia%' THEN '❌ description 包含 heterochromia'
    WHEN description ILIKE '%husky%' THEN '❌ description 包含 husky'
    ELSE '✅ description 正常'
  END as check_result
FROM styles
WHERE id = 'Smart-Casual' AND description IS NOT NULL;
