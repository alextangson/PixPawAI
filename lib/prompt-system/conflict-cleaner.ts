/**
 * 冲突清理器
 * 职责：检测并解决提示词特征之间的冲突
 */

import { ParsedFeature, PromptConflict } from './types'
import { logPromptBuild } from '@/lib/logger'

// 冲突规则定义
interface ConflictRule {
  types: string[]  // 参与冲突的特征类型
  detector: (f1: ParsedFeature, f2: ParsedFeature) => boolean
  resolver: (f1: ParsedFeature, f2: ParsedFeature) => ParsedFeature
}

/**
 * 检测颜色冲突
 * 例如: "blue eyes" vs "brown eyes"
 */
function detectColorConflict(f1: ParsedFeature, f2: ParsedFeature): boolean {
  if (f1.type !== 'color' || f2.type !== 'color') return false
  
  const colorWords = ['eyes', 'fur', 'coat']
  
  for (const word of colorWords) {
    if (f1.normalized.includes(word) && f2.normalized.includes(word)) {
      // 同一部位的不同颜色（排除异瞳情况）
      if (!f1.normalized.includes('heterochromia') && !f2.normalized.includes('heterochromia')) {
        return true
      }
    }
  }
  
  return false
}

/**
 * 检测花纹冲突
 * 例如: "spotted" vs "striped"
 */
function detectPatternConflict(f1: ParsedFeature, f2: ParsedFeature): boolean {
  if (f1.type !== 'pattern' || f2.type !== 'pattern') return false
  
  // 不同的花纹类型互斥
  const patterns = ['spotted', 'striped', 'solid', 'tabby', 'calico']
  
  const f1HasPattern = patterns.some(p => f1.normalized.includes(p))
  const f2HasPattern = patterns.some(p => f2.normalized.includes(p))
  
  return f1HasPattern && f2HasPattern && f1.normalized !== f2.normalized
}

/**
 * 检测构图冲突
 * 例如: "close-up" vs "full body"
 */
function detectCompositionConflict(f1: ParsedFeature, f2: ParsedFeature): boolean {
  if (f1.type !== 'composition' || f2.type !== 'composition') return false
  
  const shotTypes = ['close-up', 'close up', 'portrait', 'full body', 'wide shot', 'medium shot']
  
  const f1ShotType = shotTypes.find(s => f1.normalized.includes(s))
  const f2ShotType = shotTypes.find(s => f2.normalized.includes(s))
  
  // 有不同的镜头类型
  return !!f1ShotType && !!f2ShotType && f1ShotType !== f2ShotType
}

/**
 * 检测风格修饰冲突
 * 例如: "dreamy soft" vs "bold dramatic"
 */
function detectStyleModifierConflict(f1: ParsedFeature, f2: ParsedFeature): boolean {
  if (f1.type !== 'style_modifier' || f2.type !== 'style_modifier') return false
  
  // 对立的风格修饰词
  const opposites: [string, string][] = [
    ['soft', 'bold'],
    ['soft', 'dramatic'],
    ['dreamy', 'sharp'],
    ['pastel', 'vibrant'],
    ['warm', 'cool'],
    ['light', 'dark']
  ]
  
  for (const [word1, word2] of opposites) {
    if (
      (f1.normalized.includes(word1) && f2.normalized.includes(word2)) ||
      (f1.normalized.includes(word2) && f2.normalized.includes(word1))
    ) {
      return true
    }
  }
  
  return false
}

/**
 * 冲突规则列表
 */
const CONFLICT_RULES: ConflictRule[] = [
  {
    types: ['color'],
    detector: detectColorConflict,
    resolver: (f1, f2) => f1.priority >= f2.priority ? f1 : f2
  },
  {
    types: ['pattern'],
    detector: detectPatternConflict,
    resolver: (f1, f2) => f1.priority >= f2.priority ? f1 : f2
  },
  {
    types: ['composition'],
    detector: detectCompositionConflict,
    resolver: (f1, f2) => f1.priority >= f2.priority ? f1 : f2
  },
  {
    types: ['style_modifier'],
    detector: detectStyleModifierConflict,
    resolver: (f1, f2) => {
      // 风格修饰词可以尝试合并，但如果对立则保留高优先级
      if (f1.priority >= f2.priority) return f1
      return f2
    }
  }
]

/**
 * 检测两个特征是否冲突
 */
function detectConflict(f1: ParsedFeature, f2: ParsedFeature): PromptConflict | null {
  for (const rule of CONFLICT_RULES) {
    if (rule.detector(f1, f2)) {
      const winner = rule.resolver(f1, f2)
      
      return {
        feature1: f1,
        feature2: f2,
        conflictType: f1.type as any,
        resolution: f1.priority === f2.priority 
          ? 'merge' 
          : f1.source === 'user' || f2.source === 'user'
            ? 'keep_user'
            : 'keep_higher_priority',
        winner
      }
    }
  }
  
  return null
}

/**
 * 检测重复特征
 * 完全相同或高度相似的特征应该合并
 */
function areDuplicates(f1: ParsedFeature, f2: ParsedFeature): boolean {
  // 类型不同，不是重复
  if (f1.type !== f2.type) return false
  
  // 标准化后的值完全相同
  if (f1.normalized === f2.normalized) return true
  
  // 相似度检测（简单版：包含关系）
  const v1 = f1.normalized.toLowerCase()
  const v2 = f2.normalized.toLowerCase()
  
  if (v1.length > v2.length) {
    return v1.includes(v2) && (v1.length - v2.length) < 5
  } else {
    return v2.includes(v1) && (v2.length - v1.length) < 5
  }
}

/**
 * 合并重复特征
 * 保留优先级高的，或者合并信息
 */
function mergeDuplicates(features: ParsedFeature[]): ParsedFeature[] {
  const merged: ParsedFeature[] = []
  const processed = new Set<number>()
  
  for (let i = 0; i < features.length; i++) {
    if (processed.has(i)) continue
    
    const current = features[i]
    let bestFeature = current
    processed.add(i)
    
    // 查找所有重复项
    for (let j = i + 1; j < features.length; j++) {
      if (processed.has(j)) continue
      
      if (areDuplicates(current, features[j])) {
        // 保留优先级更高的
        if (features[j].priority > bestFeature.priority) {
          bestFeature = features[j]
        } else if (features[j].priority === bestFeature.priority && features[j].value.length > bestFeature.value.length) {
          // 同优先级，保留描述更详细的
          bestFeature = features[j]
        }
        processed.add(j)
      }
    }
    
    merged.push(bestFeature)
  }
  
  logPromptBuild('Merged duplicates', {
    before: features.length,
    after: merged.length,
    removed: features.length - merged.length
  })
  
  return merged
}

/**
 * 清理冲突特征
 * @param features 所有特征列表
 * @returns 清理后的特征列表和冲突记录
 */
export function cleanConflicts(features: ParsedFeature[]): {
  cleaned: ParsedFeature[]
  conflicts: PromptConflict[]
} {
  logPromptBuild('Starting conflict cleaning', { totalFeatures: features.length })
  
  // Step 1: 合并重复特征
  const deduped = mergeDuplicates(features)
  
  // Step 2: 检测并解决冲突
  const conflicts: PromptConflict[] = []
  const toRemove = new Set<number>()
  
  for (let i = 0; i < deduped.length; i++) {
    for (let j = i + 1; j < deduped.length; j++) {
      const conflict = detectConflict(deduped[i], deduped[j])
      
      if (conflict) {
        conflicts.push(conflict)
        
        // 标记要移除的特征（失败者）
        if (conflict.winner === deduped[i]) {
          toRemove.add(j)
        } else {
          toRemove.add(i)
        }
        
        logPromptBuild('Conflict detected', {
          type: conflict.conflictType,
          feature1: deduped[i].value,
          feature2: deduped[j].value,
          winner: conflict.winner.value,
          resolution: conflict.resolution
        })
      }
    }
  }
  
  // Step 3: 移除失败者
  const cleaned = deduped.filter((_, index) => !toRemove.has(index))
  
  logPromptBuild('Conflict cleaning complete', {
    originalCount: features.length,
    afterDedup: deduped.length,
    afterCleaning: cleaned.length,
    conflictsResolved: conflicts.length
  })
  
  return { cleaned, conflicts }
}

/**
 * 按优先级和类型排序特征
 * 用于最终构建提示词时的顺序
 */
export function sortFeatures(features: ParsedFeature[]): ParsedFeature[] {
  return features.sort((a, b) => {
    // 首先按优先级降序
    if (a.priority !== b.priority) {
      return b.priority - a.priority
    }
    
    // 同优先级，按类型排序（重要的在前）
    const typeOrder = [
      'breed', 'color', 'pattern', 'composition',
      'action', 'mood', 'lighting', 'scene',
      'style_modifier', 'quality', 'other'
    ]
    
    const aIndex = typeOrder.indexOf(a.type)
    const bIndex = typeOrder.indexOf(b.type)
    
    return aIndex - bIndex
  })
}
