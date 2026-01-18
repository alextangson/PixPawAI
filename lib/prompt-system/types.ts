/**
 * 提示词系统类型定义
 */

// 提示词特征类型
export type FeatureType = 
  | 'pet_type'        // 🚨 宠物类型（cat, dog, bird）- 最重要！
  | 'breed'           // 品种（husky, golden retriever）
  | 'color'           // 颜色（blue eyes, golden fur）
  | 'pattern'         // 花纹（spotted, striped）
  | 'action'          // 动作（running, sleeping）
  | 'scene'           // 场景（in a garden, on a beach）
  | 'style_modifier'  // 风格修饰（dreamy, vibrant）
  | 'quality'         // 质量词（high quality, 4K）
  | 'lighting'        // 光照（soft lighting, golden hour）
  | 'composition'     // 构图（close-up, full body）
  | 'mood'            // 情绪（happy, majestic）
  | 'other'           // 其他

// 解析后的特征
export interface ParsedFeature {
  type: FeatureType
  value: string        // 原始值
  normalized: string   // 标准化后的值
  priority: number     // 优先级（1-10）
  source: 'user' | 'qwen' | 'style' | 'system'
}

// 用户提示词解析结果
export interface ParsedUserPrompt {
  original: string
  features: ParsedFeature[]
  detectedLanguage: 'en' | 'zh' | 'mixed'
  hasNegativePrompt: boolean
  negativePrompt?: string
}

// Qwen 分析结果标准化
export interface QwenFeatures {
  breed?: string
  colors?: string[]
  patterns?: string[]
  specialFeatures?: string[]  // 异瞳、多宠物等
  mood?: string
  ageGroup?: string
  bodyType?: string
  recommendedStyles?: string[]
}

// 风格提示词配置
export interface StylePromptConfig {
  styleId: string
  styleName: string
  basePrompt: string           // 基础提示词
  promptSuffix: string         // 后缀（高优先级）
  requiredFeatures?: string[]  // 必需特征
  excludedFeatures?: string[]  // 排除特征
  strengthRange?: [number, number]  // 推荐的 strength 范围
}

// 最终合并后的提示词
export interface MergedPrompt {
  positive: string
  negative: string
  metadata: {
    userFeaturesCount: number
    qwenFeaturesCount: number
    styleFeaturesCount: number
    conflictsResolved: number
    totalPriority: number
  }
}

// 冲突检测结果
export interface PromptConflict {
  feature1: ParsedFeature
  feature2: ParsedFeature
  conflictType: 'color' | 'pattern' | 'style' | 'composition'
  resolution: 'keep_higher_priority' | 'merge' | 'keep_user'
  winner: ParsedFeature
}
