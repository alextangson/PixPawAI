/**
 * 优化 styles 表结构
 * 1. 添加 tier 字段用于动态配置生成参数
 * 2. 删除 base_prompt 字段（功能重复，简化管理）
 * 3. emoji 改为完全可选（优先使用图片预览）
 * 
 * Tier 定义:
 * - Tier 1: 写实增强 (strength 0.25-0.30, 相似度 85-90%)
 * - Tier 2: 轻艺术 (strength 0.35-0.42, 相似度 70-80%) [默认]
 * - Tier 3: 强艺术 (strength 0.50-0.60, 相似度 60-70%)
 * - Tier 4: 极致艺术 (strength 0.65-0.75, 相似度 50-60%)
 */

-- ============================================
-- 1. 添加新字段
-- ============================================

-- 添加 tier 字段
ALTER TABLE styles 
ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 2 CHECK (tier >= 1 AND tier <= 4);

-- 添加 expected_similarity 字段
ALTER TABLE styles 
ADD COLUMN IF NOT EXISTS expected_similarity TEXT DEFAULT '70-80%';

-- 添加注释
COMMENT ON COLUMN styles.tier IS 'Tier 等级 (1=写实增强, 2=轻艺术, 3=强艺术, 4=极致艺术)';
COMMENT ON COLUMN styles.expected_similarity IS '预期相似度范围（如 "85-90%"）';
COMMENT ON COLUMN styles.emoji IS '可选emoji图标，优先显示 preview_image_url';
COMMENT ON COLUMN styles.prompt_suffix IS '风格提示词（包含风格特征和质量要求）';

-- ============================================
-- 2. 删除不需要的字段
-- ============================================

-- 删除 base_prompt 列（功能由 prompt_suffix 和系统自动质量词替代）
ALTER TABLE styles 
DROP COLUMN IF EXISTS base_prompt;

-- ============================================
-- 3. 更新现有风格的 tier 配置
-- ============================================

-- Tier 1: 写实增强风格（高相似度优先）
UPDATE styles SET 
  tier = 1, 
  expected_similarity = '85-90%',
  recommended_strength_min = 0.26, 
  recommended_strength_max = 0.30,
  recommended_guidance = 2.0
WHERE id IN ('Christmas-Vibe', 'Birthday-Party');

UPDATE styles SET 
  tier = 1, 
  expected_similarity = '85-90%',
  recommended_strength_min = 0.28, 
  recommended_strength_max = 0.32,
  recommended_guidance = 2.0
WHERE id IN ('Smart-Casual', 'Music-Lover');

-- Tier 2: 轻艺术风格（平衡相似度和风格）
UPDATE styles SET 
  tier = 2, 
  expected_similarity = '75-80%',
  recommended_strength_min = 0.33, 
  recommended_strength_max = 0.37,
  recommended_guidance = 2.5
WHERE id = 'Retro-Pop-Art';

-- ============================================
-- 4. 验证更新结果
-- ============================================

SELECT 
  id,
  name,
  tier,
  expected_similarity,
  recommended_strength_min,
  recommended_strength_max,
  recommended_guidance,
  preview_image_url,
  is_enabled,
  sort_order
FROM styles 
WHERE is_enabled = true
ORDER BY tier, sort_order;

-- ============================================
-- 5. 统计信息
-- ============================================

SELECT 
  tier,
  COUNT(*) as style_count,
  AVG(recommended_strength_min) as avg_strength,
  STRING_AGG(name, ', ') as styles
FROM styles
WHERE is_enabled = true
GROUP BY tier
ORDER BY tier;
