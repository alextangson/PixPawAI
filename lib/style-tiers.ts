/**
 * Style Tier Configuration for Dynamic Strength Adjustment
 * 
 * ⚠️ IMPORTANT: FLUX-dev prompt_strength 语义（经测试验证）
 * - 低值 (0.15-0.30): 几乎完全保留原图，无艺术化
 * - 高值 (0.80-0.95): 在保留原图特征基础上应用风格（推荐范围）
 * 
 * Tier 1 (写实增强): 0.92 + guidance 2.0 - 高保真 + 轻度艺术化 ✅ 已测试
 * Tier 2 (轻艺术): 0.85-0.88 + guidance 2.5 - 待测试
 * Tier 3 (强艺术): 0.75-0.80 + guidance 3.0 - 待测试
 * Tier 4 (极致艺术): 0.65-0.70 + guidance 3.5 - 待测试
 */

export type StyleTier = 1 | 2 | 3 | 4

export interface StyleTierConfig {
  tier: StyleTier
  strength: number
  guidance: number
  description: string
  expectedSimilarity: string
  numVariants: {
    free: number
    starter: number
    pro: number
    master: number
  }
}

/**
 * Style Tier Mapping
 * 每个风格ID对应其 Tier 配置
 * 
 * Quality-Tested Styles (Updated 2026-01-18)
 * Total: 5 styles (4 Tier 1 + 1 Tier 2)
 */
export const STYLE_TIER_MAP: Record<string, StyleTierConfig> = {
  // ============================================
  // Tier 1: 写实增强 (Realistic Enhancement)
  // 相似度目标: 85-90%
  // ✅ 已测试：(strength=0.92, guidance=2.0) 效果最佳
  // ============================================
  'Christmas-Vibe': {
    tier: 1,
    strength: 0.92,
    guidance: 2.0,
    description: '写实摄影 + 简单配饰（圣诞帽）',
    expectedSimilarity: '85-90%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  },
  
  'Smart-Casual': {
    tier: 1,
    strength: 0.92,
    guidance: 2.0,
    description: '写实摄影 + 服装配饰',
    expectedSimilarity: '85-90%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  },
  
  'Birthday-Party': {
    tier: 1,
    strength: 0.92,
    guidance: 2.0,
    description: '写实场景 + 生日派对元素',
    expectedSimilarity: '85-90%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  },
  
  'Music-Lover': {
    tier: 1,
    strength: 0.92,
    guidance: 2.0,
    description: '写实工作室肖像 + 耳机',
    expectedSimilarity: '85-90%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  },

  // ============================================
  // Tier 2: 轻艺术 (Light Artistic)
  // 相似度目标: 75-80%
  // ⚠️ 待测试：建议从 0.85-0.88 开始测试
  // ============================================
  'Retro-Pop-Art': {
    tier: 2,
    strength: 0.85,  // 更新为合理初始值（待测试优化）
    guidance: 2.5,
    description: '扁平插画 + 几何撞色',
    expectedSimilarity: '75-80%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  }
}

/**
 * Get style tier configuration by style ID
 */
export function getStyleTierConfig(styleId: string): StyleTierConfig | undefined {
  return STYLE_TIER_MAP[styleId]
}

/**
 * Get default tier config for unknown styles
 */
export function getDefaultTierConfig(): StyleTierConfig {
  return {
    tier: 2,
    strength: 0.35,
    guidance: 2.5,
    description: '默认平衡配置',
    expectedSimilarity: '70-80%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  }
}

/**
 * Adjust strength based on pet complexity
 */
export function adjustStrengthForComplexity(
  baseStrength: number,
  petComplexity: {
    hasHeterochromia: boolean
    complexPattern: boolean
    multiplePets: number
  }
): number {
  let adjusted = baseStrength

  // 异瞳：轻微降低 5% (之前是 10%，太多了)
  if (petComplexity.hasHeterochromia) {
    adjusted *= 0.95
  }

  // 复杂花纹：降低 5%
  if (petComplexity.complexPattern) {
    adjusted *= 0.95
  }

  // 多宠物：大幅降低（每多一只宠物降低 10%）
  if (petComplexity.multiplePets > 1) {
    const reductionFactor = 0.90 ** (petComplexity.multiplePets - 1)
    adjusted *= reductionFactor
  }

  // 确保 strength 不低于 0.25
  return Math.max(0.25, adjusted)
}

/**
 * Get style tier summary for analytics
 */
export function getStyleTierSummary() {
  const tiers = {
    tier1: [] as string[],
    tier2: [] as string[],
    tier3: [] as string[],
    tier4: [] as string[]
  }

  Object.entries(STYLE_TIER_MAP).forEach(([styleId, config]) => {
    tiers[`tier${config.tier}` as keyof typeof tiers].push(styleId)
  })

  return {
    tier1: { count: tiers.tier1.length, styles: tiers.tier1, description: '写实增强' },
    tier2: { count: tiers.tier2.length, styles: tiers.tier2, description: '轻艺术' },
    tier3: { count: tiers.tier3.length, styles: tiers.tier3, description: '强艺术' },
    tier4: { count: tiers.tier4.length, styles: tiers.tier4, description: '极致艺术' },
    total: Object.keys(STYLE_TIER_MAP).length
  }
}
