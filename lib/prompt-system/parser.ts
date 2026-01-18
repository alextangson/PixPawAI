/**
 * 提示词解析器
 * 职责：解析用户输入的提示词，提取关键特征
 */

import { ParsedUserPrompt, ParsedFeature, FeatureType } from './types'
import { logPromptBuild } from '@/lib/logger'

// 特征关键词映射
const FEATURE_KEYWORDS: Record<FeatureType, string[]> = {
  pet_type: [
    // Common pets
    'cat', 'dog', 'bird', 'rabbit', 'hamster', 'guinea pig',
    'kitten', 'puppy', 'feline', 'canine',
    // Reptiles & Amphibians
    'snake', 'lizard', 'gecko', 'iguana', 'turtle', 'tortoise', 'chameleon', 'bearded dragon',
    'frog', 'toad', 'salamander',
    // Small mammals
    'ferret', 'chinchilla', 'hedgehog', 'mouse', 'rat', 'gerbil',
    // Birds
    'parrot', 'cockatiel', 'parakeet', 'budgie', 'canary', 'finch', 'lovebird',
    // Fish & Aquatic
    'fish', 'goldfish', 'betta', 'koi', 'axolotl',
    // Other
    'pet', 'animal'
  ],
  color: [
    'blue', 'golden', 'white', 'black', 'brown', 'orange', 'gray', 'grey',
    'red', 'pink', 'purple', 'green', 'yellow', 'tan', 'cream', 'dark', 'light',
    'eyes', 'fur', 'coat', 'colored'
  ],
  pattern: [
    'spotted', 'striped', 'tabby', 'patched', 'brindle', 'merle',
    'speckled', 'dotted', 'calico', 'tuxedo', 'dalmatian'
  ],
  action: [
    'running', 'sleeping', 'sitting', 'standing', 'jumping', 'playing',
    'looking', 'walking', 'lying', 'smiling', 'barking', 'meowing'
  ],
  scene: [
    'garden', 'beach', 'park', 'forest', 'indoor', 'outdoor',
    'sunset', 'sunrise', 'nature', 'studio', 'home', 'background'
  ],
  style_modifier: [
    'dreamy', 'vibrant', 'soft', 'bold', 'pastel', 'warm', 'cool',
    'magical', 'whimsical', 'elegant', 'playful', 'dramatic'
  ],
  quality: [
    'high quality', '4k', '8k', 'uhd', 'detailed', 'sharp', 'crisp',
    'professional', 'masterpiece', 'best quality'
  ],
  lighting: [
    'soft light', 'natural light', 'golden hour', 'dramatic lighting',
    'studio lighting', 'backlit', 'rim light', 'ambient'
  ],
  composition: [
    'close-up', 'portrait', 'full body', 'medium shot', 'wide shot',
    'face focus', 'centered', 'rule of thirds'
  ],
  mood: [
    'happy', 'sad', 'excited', 'calm', 'majestic', 'cute', 'fierce',
    'gentle', 'playful', 'serious', 'curious'
  ],
  breed: [
    'husky', 'samoyed', 'golden retriever', 'poodle', 'bulldog', 'beagle',
    'dalmatian', 'border collie', 'french bulldog', 'yorkshire terrier',
    'persian', 'siamese', 'maine coon', 'british shorthair', 'tabby', 
    'chihuahua', 'labrador', 'german shepherd', 'corgi', 'shiba inu'
  ],
  other: []
}

// 品种特殊处理（常见的多词品种）
const MULTI_WORD_BREEDS = [
  'golden retriever',
  'german shepherd',
  'siberian husky',
  'maine coon',
  'shiba inu',
  'border collie',
  'yorkshire terrier'
]

/**
 * 检测语言
 */
function detectLanguage(text: string): 'en' | 'zh' | 'mixed' {
  const hasChinese = /[\u4e00-\u9fa5]/.test(text)
  const hasEnglish = /[a-zA-Z]/.test(text)
  
  if (hasChinese && hasEnglish) return 'mixed'
  if (hasChinese) return 'zh'
  return 'en'
}

/**
 * 提取负面提示词
 */
function extractNegativePrompt(text: string): { positive: string; negative?: string } {
  const negativeMarkers = ['negative:', 'negative prompt:', '负面提示词:', '不要:']
  
  for (const marker of negativeMarkers) {
    const index = text.toLowerCase().indexOf(marker.toLowerCase())
    if (index !== -1) {
      const positive = text.substring(0, index).trim()
      const negative = text.substring(index + marker.length).trim()
      return { positive, negative }
    }
  }
  
  return { positive: text.trim() }
}

/**
 * 标准化特征值
 */
function normalizeFeatureValue(value: string, type: FeatureType): string {
  let normalized = value.toLowerCase().trim()
  
  // 移除多余空格
  normalized = normalized.replace(/\s+/g, ' ')
  
  // 品种特殊处理：保持原始大小写的首字母
  if (type === 'breed') {
    normalized = value.trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }
  
  return normalized
}

/**
 * 检测特征类型
 */
function detectFeatureType(phrase: string): FeatureType {
  const lowerPhrase = phrase.toLowerCase()
  
  // 优先匹配多词品种
  for (const breed of MULTI_WORD_BREEDS) {
    if (lowerPhrase.includes(breed)) {
      return 'breed'
    }
  }
  
  // 遍历关键词映射
  for (const [type, keywords] of Object.entries(FEATURE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerPhrase.includes(keyword)) {
        return type as FeatureType
      }
    }
  }
  
  return 'other'
}

/**
 * 计算特征优先级
 * 用户输入的特征默认高优先级
 */
function calculatePriority(type: FeatureType, source: 'user' | 'qwen' | 'style' | 'system'): number {
  const basePriority: Record<FeatureType, number> = {
    pet_type: 15,     // 🚨 最高优先级！宠物类型必须在最前面
    breed: 9,
    color: 8,
    pattern: 8,
    composition: 7,
    action: 6,
    mood: 6,
    lighting: 5,
    scene: 5,
    style_modifier: 4,
    quality: 3,
    other: 2
  }
  
  const sourceModifier = {
    user: 2,    // 用户输入 +2
    qwen: 1,    // AI 识别 +1
    style: 0,   // 风格模板 +0
    system: -1  // 系统默认 -1
  }
  
  return basePriority[type] + sourceModifier[source]
}

/**
 * 解析用户提示词
 */
export function parseUserPrompt(userInput: string): ParsedUserPrompt {
  logPromptBuild('Parsing user prompt', { input: userInput })
  
  if (!userInput || userInput.trim() === '') {
    return {
      original: '',
      features: [],
      detectedLanguage: 'en',
      hasNegativePrompt: false
    }
  }
  
  // 提取负面提示词
  const { positive, negative } = extractNegativePrompt(userInput)
  
  // 检测语言
  const language = detectLanguage(positive)
  
  // 🔍 Step 1: 先提取品种（优先级最高）
  const features: ParsedFeature[] = []
  let remainingText = positive
  
  // 检查多词品种（如 "Golden Retriever", "Siberian Husky"）
  for (const breed of MULTI_WORD_BREEDS) {
    const regex = new RegExp(`\\b${breed}\\b`, 'gi')
    if (regex.test(remainingText)) {
      features.push({
        type: 'breed',
        value: breed,
        normalized: normalizeFeatureValue(breed, 'breed'),
        priority: calculatePriority('breed', 'user'),
        source: 'user'
      })
      // 从剩余文本中移除品种词
      remainingText = remainingText.replace(regex, '').trim()
      break // 只提取第一个找到的品种
    }
  }
  
  // 检查单词品种（如 "Samoyed", "Corgi", "Husky"）
  if (features.length === 0) { // 如果没找到多词品种
    const breedKeywords = FEATURE_KEYWORDS.breed
    for (const breed of breedKeywords) {
      const regex = new RegExp(`\\b${breed}\\b`, 'gi')
      if (regex.test(remainingText)) {
        features.push({
          type: 'breed',
          value: breed,
          normalized: normalizeFeatureValue(breed, 'breed'),
          priority: calculatePriority('breed', 'user'),
          source: 'user'
        })
        // 从剩余文本中移除品种词
        remainingText = remainingText.replace(regex, '').trim()
        break
      }
    }
  }
  
  // 🔍 Step 2: 解析剩余文本（颜色、风格等）
  // 清理剩余文本中的多余空格和连词
  remainingText = remainingText.replace(/\s+/g, ' ').replace(/\b(with|and|,)\b/gi, ',').trim()
  
  // 分割为短语
  const phrases = remainingText
    .split(/[,，.。;；]/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
  
  // 解析每个短语
  for (const phrase of phrases) {
    if (phrase.length === 0) continue
    
    const type = detectFeatureType(phrase)
    const normalized = normalizeFeatureValue(phrase, type)
    const priority = calculatePriority(type, 'user')
    
    features.push({
      type,
      value: phrase,
      normalized,
      priority,
      source: 'user'
    })
  }
  
  logPromptBuild('Parsed user features', { 
    count: features.length, 
    features: features.map(f => ({ type: f.type, value: f.value, priority: f.priority }))
  })
  
  return {
    original: userInput,
    features,
    detectedLanguage: language,
    hasNegativePrompt: !!negative,
    negativePrompt: negative
  }
}

/**
 * 从 Qwen 结果提取特征
 */
export function parseQwenFeatures(qwenResult: any): ParsedFeature[] {
  const features: ParsedFeature[] = []
  
  logPromptBuild('Parsing Qwen features', { qwenResult })
  
  // 🚨 最重要：宠物类型（必须在最前面）
  if (qwenResult.petType && qwenResult.petType !== 'unknown') {
    features.push({
      type: 'pet_type',
      value: qwenResult.petType,
      normalized: qwenResult.petType.toLowerCase(), // cat, dog, bird, etc.
      priority: 15, // 最高优先级！
      source: 'qwen'
    })
  }
  
  // 品种
  if (qwenResult.breed && qwenResult.breed !== 'unknown') {
    features.push({
      type: 'breed',
      value: qwenResult.breed,
      normalized: normalizeFeatureValue(qwenResult.breed, 'breed'),
      priority: calculatePriority('breed', 'qwen'),
      source: 'qwen'
    })
  }
  
  // 颜色
  if (qwenResult.primaryColor && qwenResult.primaryColor !== 'unknown') {
    features.push({
      type: 'color',
      value: `${qwenResult.primaryColor} colored`,
      normalized: normalizeFeatureValue(`${qwenResult.primaryColor} colored`, 'color'),
      priority: calculatePriority('color', 'qwen'),
      source: 'qwen'
    })
  }
  
  // 异瞳（最高优先级特征）
  if (qwenResult.hasHeterochromia) {
    // 如果有具体的眼睛颜色描述，使用详细信息
    if (qwenResult.heterochromiaDetails && qwenResult.heterochromiaDetails.trim() !== '') {
      // 🔄 镜像翻转：Qwen 的左右需要翻转才能匹配 AI 模型的视角
      // Qwen: "left eye blue, right eye brown"
      // AI需要: "right eye blue, left eye brown"
      const mirroredDetails = qwenResult.heterochromiaDetails
        .replace(/\bleft\b/gi, 'TEMP_LEFT')   // 临时标记 left
        .replace(/\bright\b/gi, 'left')        // right → left
        .replace(/TEMP_LEFT/gi, 'right')       // TEMP_LEFT → right
      
      features.push({
        type: 'color',
        value: `heterochromia (${mirroredDetails})`,
        normalized: `heterochromia, ${mirroredDetails}`,
        priority: calculatePriority('color', 'qwen') + 3, // 异瞳是最独特的特征，最高优先级
        source: 'qwen'
      })
    } else {
      // 如果没有具体描述，使用通用描述
      features.push({
        type: 'color',
        value: 'heterochromia eyes',
        normalized: 'heterochromia eyes',
        priority: calculatePriority('color', 'qwen') + 2,
        source: 'qwen'
      })
    }
  }
  
  // 🆕 detectedColors (多个颜色)
  if (qwenResult.detectedColors && typeof qwenResult.detectedColors === 'string') {
    features.push({
      type: 'color',
      value: qwenResult.detectedColors,
      normalized: normalizeFeatureValue(qwenResult.detectedColors, 'color'),
      priority: calculatePriority('color', 'qwen'),
      source: 'qwen'
    })
  }
  
  // 🆕 patternDetails (具体花纹描述，如"stripes", "spots")
  if (qwenResult.patternDetails && qwenResult.patternDetails.trim() !== '') {
    features.push({
      type: 'pattern',
      value: qwenResult.patternDetails,
      normalized: normalizeFeatureValue(qwenResult.patternDetails, 'pattern'),
      priority: calculatePriority('pattern', 'qwen') + 1, // 具体花纹优先级高于通用pattern
      source: 'qwen'
    })
  }
  
  // 花纹（保留通用pattern支持）
  if (qwenResult.pattern && qwenResult.pattern !== 'solid' && qwenResult.pattern !== qwenResult.patternDetails) {
    features.push({
      type: 'pattern',
      value: qwenResult.pattern,
      normalized: normalizeFeatureValue(qwenResult.pattern, 'pattern'),
      priority: calculatePriority('pattern', 'qwen'),
      source: 'qwen'
    })
  }
  
  // 🆕 keyFeatures (关键特征，如"striped pattern, large eyes")
  if (qwenResult.keyFeatures && qwenResult.keyFeatures.trim() !== '') {
    // 将keyFeatures分割为多个特征
    const keyPhrases = qwenResult.keyFeatures
      .split(/[,，]/)
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0)
      .filter((p: string) => {
        // 过滤掉重复的特征：如果已经单独处理了异瞳，跳过 keyFeatures 中的 "heterochromia"
        if (qwenResult.hasHeterochromia && p.toLowerCase().includes('heterochromia')) {
          return false
        }
        return true
      })
    
    keyPhrases.forEach((phrase: string) => {
      const type = detectFeatureType(phrase)
      features.push({
        type,
        value: phrase,
        normalized: normalizeFeatureValue(phrase, type),
        priority: calculatePriority(type, 'qwen'),
        source: 'qwen'
      })
    })
  }
  
  // 情绪
  if (qwenResult.mood && qwenResult.mood !== 'unknown') {
    features.push({
      type: 'mood',
      value: qwenResult.mood,
      normalized: normalizeFeatureValue(qwenResult.mood, 'mood'),
      priority: calculatePriority('mood', 'qwen'),
      source: 'qwen'
    })
  }
  
  // 多只宠物
  if (qwenResult.petCount && qwenResult.petCount > 1) {
    features.push({
      type: 'composition',
      value: `${qwenResult.petCount} pets`,
      normalized: `${qwenResult.petCount} pets`,
      priority: calculatePriority('composition', 'qwen') + 1,
      source: 'qwen'
    })
  }
  
  // multiplePets 兼容性支持
  if (!qwenResult.petCount && qwenResult.multiplePets && qwenResult.multiplePets > 1) {
    features.push({
      type: 'composition',
      value: `${qwenResult.multiplePets} pets`,
      normalized: `${qwenResult.multiplePets} pets`,
      priority: calculatePriority('composition', 'qwen') + 1,
      source: 'qwen'
    })
  }
  
  logPromptBuild('Parsed Qwen features', {
    count: features.length,
    features: features.map(f => ({ type: f.type, value: f.value, priority: f.priority }))
  })
  
  return features
}

/**
 * 解析风格提示词
 */
export function parseStylePrompt(stylePrompt: string, source: 'base' | 'suffix' = 'base'): ParsedFeature[] {
  const features: ParsedFeature[] = []
  
  if (!stylePrompt || stylePrompt.trim() === '') {
    return features
  }
  
  // 分割短语
  const phrases = stylePrompt
    .split(/[,，]/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
  
  for (const phrase of phrases) {
    const type = detectFeatureType(phrase)
    const normalized = normalizeFeatureValue(phrase, type)
    
    // suffix 的优先级比 base 高
    const basePriority = calculatePriority(type, 'style')
    const priority = source === 'suffix' ? basePriority + 1 : basePriority
    
    features.push({
      type,
      value: phrase,
      normalized,
      priority,
      source: 'style'
    })
  }
  
  logPromptBuild(`Parsed style ${source} features`, {
    count: features.length,
    features: features.map(f => ({ type: f.type, value: f.value }))
  })
  
  return features
}
