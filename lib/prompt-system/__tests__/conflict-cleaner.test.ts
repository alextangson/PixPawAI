/**
 * Conflict Cleaner 单元测试
 */

import { cleanConflicts, sortFeatures } from '../conflict-cleaner'
import { ParsedFeature } from '../types'

describe('cleanConflicts', () => {
  test('检测并解决颜色冲突', () => {
    const features: ParsedFeature[] = [
      {
        type: 'color',
        value: 'blue eyes',
        normalized: 'blue eyes',
        priority: 10,
        source: 'user'
      },
      {
        type: 'color',
        value: 'brown eyes',
        normalized: 'brown eyes',
        priority: 8,
        source: 'qwen'
      }
    ]
    
    const { cleaned, conflicts } = cleanConflicts(features)
    
    expect(conflicts.length).toBe(1)
    expect(conflicts[0].conflictType).toBe('color')
    expect(cleaned.length).toBe(1)
    expect(cleaned[0].value).toBe('blue eyes') // 用户输入优先级高
  })
  
  test('检测并解决花纹冲突', () => {
    const features: ParsedFeature[] = [
      {
        type: 'pattern',
        value: 'spotted',
        normalized: 'spotted',
        priority: 8,
        source: 'qwen'
      },
      {
        type: 'pattern',
        value: 'striped',
        normalized: 'striped',
        priority: 6,
        source: 'style'
      }
    ]
    
    const { cleaned, conflicts } = cleanConflicts(features)
    
    expect(conflicts.length).toBe(1)
    expect(cleaned.length).toBe(1)
    expect(cleaned[0].value).toBe('spotted') // Qwen 优先级高于 style
  })
  
  test('检测并解决构图冲突', () => {
    const features: ParsedFeature[] = [
      {
        type: 'composition',
        value: 'close-up portrait',
        normalized: 'close-up portrait',
        priority: 7,
        source: 'user'
      },
      {
        type: 'composition',
        value: 'full body shot',
        normalized: 'full body shot',
        priority: 5,
        source: 'style'
      }
    ]
    
    const { cleaned, conflicts } = cleanConflicts(features)
    
    expect(conflicts.length).toBe(1)
    expect(cleaned[0].value).toBe('close-up portrait')
  })
  
  test('合并重复特征', () => {
    const features: ParsedFeature[] = [
      {
        type: 'breed',
        value: 'Golden Retriever',
        normalized: 'Golden Retriever',
        priority: 9,
        source: 'user'
      },
      {
        type: 'breed',
        value: 'Golden Retriever',
        normalized: 'Golden Retriever',
        priority: 8,
        source: 'qwen'
      },
      {
        type: 'color',
        value: 'golden fur',
        normalized: 'golden fur',
        priority: 8,
        source: 'user'
      }
    ]
    
    const { cleaned } = cleanConflicts(features)
    
    // 两个相同的 breed 应该合并为一个
    const breedFeatures = cleaned.filter(f => f.type === 'breed')
    expect(breedFeatures.length).toBe(1)
    expect(breedFeatures[0].priority).toBe(9) // 保留高优先级的
  })
  
  test('保留异瞳特征不冲突', () => {
    const features: ParsedFeature[] = [
      {
        type: 'color',
        value: 'blue eyes',
        normalized: 'blue eyes',
        priority: 8,
        source: 'user'
      },
      {
        type: 'color',
        value: 'heterochromia eyes',
        normalized: 'heterochromia eyes',
        priority: 9,
        source: 'qwen'
      }
    ]
    
    const { cleaned, conflicts } = cleanConflicts(features)
    
    // 异瞳不应该和普通眼睛颜色冲突
    expect(cleaned.length).toBe(2)
  })
  
  test('没有冲突的特征全部保留', () => {
    const features: ParsedFeature[] = [
      {
        type: 'breed',
        value: 'Husky',
        normalized: 'Husky',
        priority: 9,
        source: 'qwen'
      },
      {
        type: 'action',
        value: 'running',
        normalized: 'running',
        priority: 6,
        source: 'user'
      },
      {
        type: 'scene',
        value: 'in a garden',
        normalized: 'in a garden',
        priority: 5,
        source: 'user'
      }
    ]
    
    const { cleaned, conflicts } = cleanConflicts(features)
    
    expect(conflicts.length).toBe(0)
    expect(cleaned.length).toBe(3)
  })
})

describe('sortFeatures', () => {
  test('按优先级降序排序', () => {
    const features: ParsedFeature[] = [
      {
        type: 'scene',
        value: 'garden',
        normalized: 'garden',
        priority: 5,
        source: 'user'
      },
      {
        type: 'breed',
        value: 'Husky',
        normalized: 'Husky',
        priority: 9,
        source: 'qwen'
      },
      {
        type: 'color',
        value: 'blue eyes',
        normalized: 'blue eyes',
        priority: 8,
        source: 'user'
      }
    ]
    
    const sorted = sortFeatures([...features])
    
    expect(sorted[0].priority).toBe(9) // Husky
    expect(sorted[1].priority).toBe(8) // blue eyes
    expect(sorted[2].priority).toBe(5) // garden
  })
  
  test('同优先级按类型排序', () => {
    const features: ParsedFeature[] = [
      {
        type: 'scene',
        value: 'garden',
        normalized: 'garden',
        priority: 7,
        source: 'user'
      },
      {
        type: 'action',
        value: 'running',
        normalized: 'running',
        priority: 7,
        source: 'user'
      },
      {
        type: 'breed',
        value: 'Husky',
        normalized: 'Husky',
        priority: 7,
        source: 'user'
      }
    ]
    
    const sorted = sortFeatures([...features])
    
    // breed > action > scene
    expect(sorted[0].type).toBe('breed')
    expect(sorted[1].type).toBe('action')
    expect(sorted[2].type).toBe('scene')
  })
})
