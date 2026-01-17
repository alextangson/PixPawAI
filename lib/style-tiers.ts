/**
 * Style Tier Configuration for Dynamic Strength Adjustment
 * 
 * Tier 1 (写实增强): 0.25-0.30 - 高相似度优先
 * Tier 2 (轻艺术): 0.35-0.42 - 平衡相似度和风格
 * Tier 3 (强艺术): 0.50-0.60 - 风格优先，通过多图提升命中率
 * Tier 4 (极致艺术): 0.65-0.75 - 极致风格化
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
 */
export const STYLE_TIER_MAP: Record<string, StyleTierConfig> = {
  // ============================================
  // Tier 1: 写实增强 (Realistic Enhancement)
  // 相似度目标: 85-90%
  // ============================================
  'Christmas-Vibe': {
    tier: 1,
    strength: 0.28,
    guidance: 2.0,
    description: '写实摄影 + 简单配饰（圣诞帽）',
    expectedSimilarity: '85-90%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  },
  
  'Smart-Casual': {
    tier: 1,
    strength: 0.30,
    guidance: 2.0,
    description: '写实摄影 + 服装配饰',
    expectedSimilarity: '85-90%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  },
  
  'Birthday-Party': {
    tier: 1,
    strength: 0.28,
    guidance: 2.0,
    description: '写实场景 + 生日派对元素',
    expectedSimilarity: '85-90%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  },
  
  'Music-Lover': {
    tier: 1,
    strength: 0.30,
    guidance: 2.0,
    description: '写实工作室肖像 + 耳机',
    expectedSimilarity: '85-90%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  },

  // ============================================
  // Tier 2: 轻艺术 (Light Artistic)
  // 相似度目标: 75-80%
  // ============================================
  'Victorian-Royal': {
    tier: 2,
    strength: 0.32,  // 降低以保留毛色
    guidance: 2.3,
    description: '复杂服装 + 道具 + 油画质感',
    expectedSimilarity: '75-80%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  },
  
  'Vintage-Traveler': {
    tier: 2,
    strength: 0.40,
    guidance: 2.5,
    description: '复杂场景 + 蒸汽朋克 + 油画',
    expectedSimilarity: '75-80%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  },

  // ============================================
  // Tier 3: 强艺术 (Strong Artistic)
  // 相似度目标: 65-75%
  // ============================================
  'Johannes Vermeer': {
    tier: 3,
    strength: 0.52,  // 提高回去，异瞳降低后 0.52 × 0.95 = 0.494
    guidance: 2.8,
    description: '经典油画风格 + 戏剧性光影',
    expectedSimilarity: '65-75%',
    numVariants: { free: 1, starter: 1, pro: 4, master: 6 }
  },
  
  'Flower-Crown': {
    tier: 3,
    strength: 0.54,  // 提高，异瞳降低后 0.54 × 0.95 = 0.513
    guidance: 3.0,
    description: '艺术油画 + 细腻笔触',
    expectedSimilarity: '65-75%',
    numVariants: { free: 1, starter: 1, pro: 4, master: 6 }
  },
  
  'Embroidery-Art': {
    tier: 3,
    strength: 0.55,
    guidance: 3.0,
    description: '刺绣材质 + 纹理完全改变',
    expectedSimilarity: '65-75%',
    numVariants: { free: 1, starter: 1, pro: 4, master: 6 }
  },

  // ============================================
  // Tier 4: 极致艺术 (Extreme Artistic)
  // 相似度目标: 55-65%
  // ============================================
  'Fine-Sketch': {
    tier: 4,
    strength: 0.68,
    guidance: 3.5,
    description: '精细素描 + 完全手绘效果',
    expectedSimilarity: '55-65%',
    numVariants: { free: 1, starter: 1, pro: 5, master: 7 }
  },

  // ============================================
  // MVP Test Styles (Added 2026-01-17)
  // 每个 Tier 一个代表性风格用于快速测试
  // ============================================
  
  // Tier 1: Spring Vibes - 春天主题（樱花飘落）
  'Spring-Vibes': {
    tier: 1,
    strength: 0.28,
    guidance: 2.0,
    description: '写实摄影 + 樱花元素',
    expectedSimilarity: '85-90%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  },
  
  // Tier 2: Retro Pop Art - 扁平插画
  'Retro-Pop-Art': {
    tier: 2,
    strength: 0.35,
    guidance: 2.5,
    description: '扁平插画 + 几何撞色',
    expectedSimilarity: '75-80%',
    numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
  },
  
  // Tier 3: Watercolor Dream - 水彩艺术
  'Watercolor-Dream': {
    tier: 3,
    strength: 0.50,
    guidance: 3.0,
    description: '水彩艺术 + 透明笔触',
    expectedSimilarity: '65-75%',
    numVariants: { free: 1, starter: 1, pro: 4, master: 6 }
  },
  
  // Tier 4: Pixel Mosaic - 像素艺术
  'Pixel-Mosaic': {
    tier: 4,
    strength: 0.68,
    guidance: 3.5,
    description: '像素艺术 + 8-bit 风格',
    expectedSimilarity: '55-65%',
    numVariants: { free: 1, starter: 1, pro: 5, master: 7 }
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
