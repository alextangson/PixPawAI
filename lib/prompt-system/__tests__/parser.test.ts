/**
 * Prompt Parser 单元测试
 * 用于验证提示词解析的准确性
 */

import { parseUserPrompt, parseQwenFeatures, parseStylePrompt } from '../parser'

describe('parseUserPrompt', () => {
  test('解析简单英文提示词', () => {
    const result = parseUserPrompt('golden fur, blue eyes, running in garden')
    
    expect(result.features).toHaveLength(3)
    expect(result.detectedLanguage).toBe('en')
    expect(result.features[0].type).toBe('color')
    expect(result.features[1].type).toBe('color')
    expect(result.features[2].type).toBe('action')
  })
  
  test('解析品种提示词', () => {
    const result = parseUserPrompt('golden retriever, happy mood')
    
    const breedFeature = result.features.find(f => f.type === 'breed')
    expect(breedFeature).toBeDefined()
    expect(breedFeature?.normalized).toBe('Golden Retriever')
  })
  
  test('提取负面提示词', () => {
    const result = parseUserPrompt('cute cat, negative: blurry, low quality')
    
    expect(result.hasNegativePrompt).toBe(true)
    expect(result.negativePrompt).toBe('blurry, low quality')
    expect(result.features.some(f => f.value.includes('cute'))).toBe(true)
  })
  
  test('检测中文提示词', () => {
    const result = parseUserPrompt('金色毛发，蓝色眼睛')
    
    expect(result.detectedLanguage).toBe('zh')
    expect(result.features.length).toBeGreaterThan(0)
  })
  
  test('空输入处理', () => {
    const result = parseUserPrompt('')
    
    expect(result.features).toHaveLength(0)
    expect(result.hasNegativePrompt).toBe(false)
  })
  
  test('用户输入特征优先级高', () => {
    const result = parseUserPrompt('golden retriever, blue eyes')
    
    expect(result.features.every(f => f.source === 'user')).toBe(true)
    expect(result.features.every(f => f.priority >= 8)).toBe(true)
  })
})

describe('parseQwenFeatures', () => {
  test('解析基础 Qwen 结果', () => {
    const qwenResult = {
      breed: 'Husky',
      primaryColor: 'gray',
      hasHeterochromia: false,
      pattern: 'solid',
      mood: 'happy',
      petCount: 1
    }
    
    const features = parseQwenFeatures(qwenResult)
    
    expect(features.length).toBeGreaterThan(0)
    expect(features.some(f => f.type === 'breed')).toBe(true)
    expect(features.some(f => f.type === 'color')).toBe(true)
  })
  
  test('识别异瞳特征', () => {
    const qwenResult = {
      breed: 'Husky',
      primaryColor: 'gray',
      hasHeterochromia: true,
      mood: 'calm'
    }
    
    const features = parseQwenFeatures(qwenResult)
    
    const heteroFeature = features.find(f => f.value.includes('heterochromia'))
    expect(heteroFeature).toBeDefined()
    expect(heteroFeature?.priority).toBeGreaterThan(8) // 异瞳优先级更高
  })
  
  test('识别多只宠物', () => {
    const qwenResult = {
      breed: 'Mixed',
      petCount: 3
    }
    
    const features = parseQwenFeatures(qwenResult)
    
    const multiPetFeature = features.find(f => f.value.includes('3 pets'))
    expect(multiPetFeature).toBeDefined()
    expect(multiPetFeature?.type).toBe('composition')
  })
  
  test('忽略 unknown 值', () => {
    const qwenResult = {
      breed: 'unknown',
      primaryColor: 'unknown',
      mood: 'unknown'
    }
    
    const features = parseQwenFeatures(qwenResult)
    
    expect(features.length).toBe(0)
  })
})

describe('parseStylePrompt', () => {
  test('解析风格基础提示词', () => {
    const features = parseStylePrompt('watercolor style, soft colors, dreamy atmosphere', 'base')
    
    expect(features.length).toBeGreaterThan(0)
    expect(features.every(f => f.source === 'style')).toBe(true)
  })
  
  test('suffix 优先级高于 base', () => {
    const baseFeatures = parseStylePrompt('soft lighting', 'base')
    const suffixFeatures = parseStylePrompt('dramatic lighting', 'suffix')
    
    expect(suffixFeatures[0].priority).toBeGreaterThan(baseFeatures[0].priority)
  })
  
  test('空提示词处理', () => {
    const features = parseStylePrompt('')
    
    expect(features).toHaveLength(0)
  })
})
