/**
 * Prompt System - 统一导出接口
 * 
 * 使用示例：
 * 
 * ```typescript
 * import { buildPromptFromSources } from '@/lib/prompt-system'
 * 
 * const { prompt, debug } = await buildPromptFromSources({
 *   userPrompt: 'golden retriever, running',
 *   qwenResult: { breed: 'Golden Retriever', ... },
 *   stylePromptSuffix: 'watercolor style, soft colors'
 * })
 * 
 * console.log(prompt.positive) // 最终的正面提示词
 * ```
 */

// 类型定义
export type {
  FeatureType,
  ParsedFeature,
  ParsedUserPrompt,
  QwenFeatures,
  StylePromptConfig,
  MergedPrompt,
  PromptConflict
} from './types'

// 解析器
export {
  parseUserPrompt,
  parseQwenFeatures,
  parseStylePrompt
} from './parser'

// 冲突清理器
export {
  cleanConflicts,
  sortFeatures
} from './conflict-cleaner'

// 提示词构建器
export {
  buildPrompt,
  buildPromptFromSources,
  buildPromptWithDatabaseStyle
} from './prompt-builder'
