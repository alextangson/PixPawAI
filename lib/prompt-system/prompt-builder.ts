/**
 * 提示词构建器
 * 职责：整合所有解析和清理后的特征，构建最终的提示词
 */

import { ParsedFeature, MergedPrompt } from './types'
import { logPromptBuild } from '@/lib/logger'

/**
 * 构建最终提示词
 * @param features 清理后的特征列表（已排序）
 * @param options 可选配置
 */
export function buildPrompt(
  features: ParsedFeature[],
  options?: {
    includeQuality?: boolean  // 是否自动添加质量词
    negativePrompt?: string   // 额外的负面提示词
  }
): MergedPrompt {
  logPromptBuild('Building final prompt', { featureCount: features.length, options })
  
  // 统计特征来源
  const userFeatures = features.filter(f => f.source === 'user')
  const qwenFeatures = features.filter(f => f.source === 'qwen')
  const styleFeatures = features.filter(f => f.source === 'style')
  
  // 构建正面提示词
  const positivePromptParts = features.map(f => f.normalized)
  
  // 可选：添加默认质量词（如果没有质量特征）
  if (options?.includeQuality !== false) {
    const hasQuality = features.some(f => f.type === 'quality')
    if (!hasQuality) {
      positivePromptParts.push('high quality', 'detailed')
    }
  }
  
  const positivePrompt = positivePromptParts.join(', ')
  
  // 构建负面提示词
  const negativePromptParts: string[] = [
    'blurry',
    'low quality',
    'distorted',
    'deformed',
    'disfigured',
    'bad anatomy',
    'ugly',
    'duplicate',
    'mutation'
  ]
  
  if (options?.negativePrompt) {
    negativePromptParts.unshift(options.negativePrompt)
  }
  
  const negativePrompt = negativePromptParts.join(', ')
  
  // 计算元数据
  const totalPriority = features.reduce((sum, f) => sum + f.priority, 0)
  
  const result: MergedPrompt = {
    positive: positivePrompt,
    negative: negativePrompt,
    metadata: {
      userFeaturesCount: userFeatures.length,
      qwenFeaturesCount: qwenFeatures.length,
      styleFeaturesCount: styleFeatures.length,
      conflictsResolved: 0, // 这个由 Conflict Cleaner 提供
      totalPriority
    }
  }
  
  logPromptBuild('Prompt built successfully', {
    positiveLength: positivePrompt.length,
    negativeLength: negativePrompt.length,
    metadata: result.metadata
  })
  
  return result
}

/**
 * 完整的提示词构建流程（一站式）
 * 
 * @param userPrompt 用户输入的提示词
 * @param qwenResult Qwen分析结果
 * @param styleConfig 风格配置
 * @param options 额外选项
 * @returns 最终的提示词和所有中间结果
 */
export async function buildPromptFromSources(sources: {
  userPrompt?: string
  qwenResult?: any
  styleId?: string
  stylePromptSuffix?: string
  negativePrompt?: string
}): Promise<{
  prompt: MergedPrompt
  debug: {
    parsedFeatures: ParsedFeature[]
    cleanedFeatures: ParsedFeature[]
    conflictCount: number
  }
}> {
  const { parseUserPrompt, parseQwenFeatures, parseStylePrompt } = await import('./parser')
  const { cleanConflicts, sortFeatures } = await import('./conflict-cleaner')
  
  logPromptBuild('Starting full prompt build flow', { sources })
  
  // Step 1: 解析所有来源
  const allFeatures: ParsedFeature[] = []
  
  if (sources.userPrompt) {
    const parsed = parseUserPrompt(sources.userPrompt)
    allFeatures.push(...parsed.features)
  }
  
  if (sources.qwenResult) {
    const qwenFeatures = parseQwenFeatures(sources.qwenResult)
    allFeatures.push(...qwenFeatures)
  }
  
  if (sources.stylePromptSuffix) {
    const styleFeatures = parseStylePrompt(sources.stylePromptSuffix, 'suffix')
    allFeatures.push(...styleFeatures)
  }
  
  logPromptBuild('Parsed all sources', { totalFeatures: allFeatures.length })
  
  // Step 2: 清理冲突
  const { cleaned, conflicts } = cleanConflicts(allFeatures)
  
  // Step 3: 排序
  const sorted = sortFeatures(cleaned)
  
  // Step 4: 构建最终提示词
  const prompt = buildPrompt(sorted, {
    negativePrompt: sources.negativePrompt
  })
  
  // 更新冲突计数
  prompt.metadata.conflictsResolved = conflicts.length
  
  return {
    prompt,
    debug: {
      parsedFeatures: allFeatures,
      cleanedFeatures: sorted,
      conflictCount: conflicts.length
    }
  }
}

/**
 * 从数据库风格构建提示词
 * 用于与数据库集成
 */
export async function buildPromptWithDatabaseStyle(
  userPrompt: string,
  qwenResult: any,
  styleId: string
): Promise<MergedPrompt> {
  logPromptBuild('Building prompt with database style', { styleId })
  
  try {
    // 从数据库获取风格
    const response = await fetch(`/api/admin/styles/${styleId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch style from database')
    }
    
    const { style } = await response.json()
    
    // 使用风格的 prompt_suffix
    const { prompt } = await buildPromptFromSources({
      userPrompt,
      qwenResult,
      stylePromptSuffix: style.prompt_suffix,
      negativePrompt: style.negative_prompt
    })
    
    return prompt
  } catch (error) {
    logPromptBuild('Error building prompt with database style', { error })
    
    // 降级：不使用风格
    const { prompt } = await buildPromptFromSources({
      userPrompt,
      qwenResult
    })
    
    return prompt
  }
}
