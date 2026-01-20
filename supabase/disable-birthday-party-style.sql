-- ============================================
-- 禁用 Birthday-Party 风格
-- Date: 2026-01-XX
-- Purpose: 删除 Birthday-Party 风格，保留 Birthday Celebration
-- ============================================

-- 禁用 Birthday-Party 风格（保留数据用于历史记录）
UPDATE styles 
SET 
  is_enabled = false,
  updated_at = now()
WHERE id = 'Birthday-Party';

-- 验证禁用结果
SELECT 
  id,
  name,
  is_enabled,
  '✅ Disabled' as status
FROM styles
WHERE id = 'Birthday-Party';

-- 确认 Birthday Celebration 仍然启用
SELECT 
  id,
  name,
  is_enabled,
  '✅ Active' as status
FROM styles
WHERE id = 'birthday-celebration';
