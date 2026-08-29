/**
 * Conflict Cleaner 单元测试
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanConflicts, sortFeatures } from '../conflict-cleaner'
import { ParsedFeature } from '../types'

test('cleanConflicts: 检测并解决颜色冲突', () => {
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

  assert.equal(conflicts.length, 1)
  assert.equal(conflicts[0].conflictType, 'color')
  assert.equal(cleaned.length, 1)
  assert.equal(cleaned[0].value, 'blue eyes') // 用户输入优先级高
})

test('cleanConflicts: 检测并解决花纹冲突', () => {
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

  assert.equal(conflicts.length, 1)
  assert.equal(cleaned.length, 1)
  assert.equal(cleaned[0].value, 'spotted') // Qwen 优先级高于 style
})

test('cleanConflicts: 检测并解决构图冲突', () => {
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

  assert.equal(conflicts.length, 1)
  assert.equal(cleaned[0].value, 'close-up portrait')
})

test('cleanConflicts: 合并重复特征', () => {
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
  assert.equal(breedFeatures.length, 1)
  assert.equal(breedFeatures[0].priority, 9) // 保留高优先级的
})

test('cleanConflicts: 保留异瞳特征不冲突', () => {
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
  assert.equal(cleaned.length, 2)
})

test('cleanConflicts: 没有冲突的特征全部保留', () => {
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

  assert.equal(conflicts.length, 0)
  assert.equal(cleaned.length, 3)
})

test('sortFeatures: 按优先级降序排序', () => {
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

  assert.equal(sorted[0].priority, 9) // Husky
  assert.equal(sorted[1].priority, 8) // blue eyes
  assert.equal(sorted[2].priority, 5) // garden
})

test('sortFeatures: 同优先级按类型排序', () => {
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
  assert.equal(sorted[0].type, 'breed')
  assert.equal(sorted[1].type, 'action')
  assert.equal(sorted[2].type, 'scene')
})
