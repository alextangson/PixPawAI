/**
 * Prompt Parser 单元测试
 * 用于验证提示词解析的准确性
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { parseUserPrompt, parseQwenFeatures, parseStylePrompt } from '../parser'

test('parseUserPrompt: 解析简单英文提示词', () => {
  const result = parseUserPrompt('golden fur, blue eyes, running in garden')

  assert.equal(result.features.length, 3)
  assert.equal(result.detectedLanguage, 'en')
  assert.equal(result.features[0].type, 'color')
  assert.equal(result.features[1].type, 'color')
  assert.equal(result.features[2].type, 'action')
})

test('parseUserPrompt: 解析品种提示词', () => {
  const result = parseUserPrompt('golden retriever, happy mood')

  const breedFeature = result.features.find(f => f.type === 'breed')
  assert.ok(breedFeature)
  assert.equal(breedFeature.normalized, 'Golden Retriever')
})

test('parseUserPrompt: 提取负面提示词', () => {
  const result = parseUserPrompt('cute cat, negative: blurry, low quality')

  assert.equal(result.hasNegativePrompt, true)
  assert.equal(result.negativePrompt, 'blurry, low quality')
  assert.equal(result.features.some(f => f.value.includes('cute')), true)
})

test('parseUserPrompt: 检测中文提示词', () => {
  const result = parseUserPrompt('金色毛发，蓝色眼睛')

  assert.equal(result.detectedLanguage, 'zh')
  assert.ok(result.features.length > 0)
})

test('parseUserPrompt: 空输入处理', () => {
  const result = parseUserPrompt('')

  assert.equal(result.features.length, 0)
  assert.equal(result.hasNegativePrompt, false)
})

test('parseUserPrompt: 用户输入特征优先级高', () => {
  const result = parseUserPrompt('golden retriever, blue eyes')

  assert.equal(result.features.every(f => f.source === 'user'), true)
  assert.equal(result.features.every(f => f.priority >= 8), true)
})

test('parseQwenFeatures: 解析基础 Qwen 结果', () => {
  const qwenResult = {
    breed: 'Husky',
    primaryColor: 'gray',
    hasHeterochromia: false,
    pattern: 'solid',
    mood: 'happy',
    petCount: 1
  }

  const features = parseQwenFeatures(qwenResult)

  assert.ok(features.length > 0)
  assert.equal(features.some(f => f.type === 'breed'), true)
  assert.equal(features.some(f => f.type === 'color'), true)
})

test('parseQwenFeatures: 识别异瞳特征', () => {
  const qwenResult = {
    breed: 'Husky',
    primaryColor: 'gray',
    hasHeterochromia: true,
    mood: 'calm'
  }

  const features = parseQwenFeatures(qwenResult)

  const heteroFeature = features.find(f => f.value.includes('heterochromia'))
  assert.ok(heteroFeature)
  assert.ok(heteroFeature.priority > 8) // 异瞳优先级更高
})

test('parseQwenFeatures: 识别多只宠物', () => {
  const qwenResult = {
    breed: 'Mixed',
    petCount: 3
  }

  const features = parseQwenFeatures(qwenResult)

  const multiPetFeature = features.find(f => f.value.includes('3 pets'))
  assert.ok(multiPetFeature)
  assert.equal(multiPetFeature.type, 'composition')
})

test('parseQwenFeatures: 忽略 unknown 值', () => {
  const qwenResult = {
    breed: 'unknown',
    primaryColor: 'unknown',
    mood: 'unknown'
  }

  const features = parseQwenFeatures(qwenResult)

  assert.equal(features.length, 0)
})

test('parseStylePrompt: 解析风格基础提示词', () => {
  const features = parseStylePrompt('watercolor style, soft colors, dreamy atmosphere', 'base')

  assert.ok(features.length > 0)
  assert.equal(features.every(f => f.source === 'style'), true)
})

test('parseStylePrompt: suffix 优先级高于 base', () => {
  const baseFeatures = parseStylePrompt('soft lighting', 'base')
  const suffixFeatures = parseStylePrompt('dramatic lighting', 'suffix')

  assert.ok(suffixFeatures[0].priority > baseFeatures[0].priority)
})

test('parseStylePrompt: 空提示词处理', () => {
  const features = parseStylePrompt('')

  assert.equal(features.length, 0)
})
