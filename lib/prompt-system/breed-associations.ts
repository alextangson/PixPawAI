/**
 * 品种视觉特征关联表
 * 用于在品种冲突解决后，清理与失败品种强关联的视觉特征
 */

/**
 * 品种特有的视觉标记映射
 * 当某个品种在冲突中失败时，这些关联的视觉特征也应该被移除
 */
export const BREED_VISUAL_MARKERS: Record<string, string[]> = {
  // 狗品种
  'Dalmatian': [
    'dalmatian',
    'dalmatian spots',
    'black spots',
    'spotted',
    'white with black spots',
    'black and white spots'
  ],
  
  'Golden Retriever': [
    'golden retriever',
    'golden',
    'golden fur',
    'cream colored'
  ],
  
  'Husky': [
    'husky',
    'blue eyes',
    'wolf-like',
    'arctic'
  ],
  
  'Corgi': [
    'corgi',
    'short legs',
    'stubby legs',
    'low to ground'
  ],
  
  'Poodle': [
    'poodle',
    'curly',
    'curly fur',
    'poodle cut'
  ],
  
  // 猫品种
  'Persian': [
    'persian',
    'flat face',
    'long fur',
    'fluffy'
  ],
  
  'Siamese': [
    'siamese',
    'color points',
    'blue eyes',
    'pointed ears'
  ],
  
  'Calico': [
    'calico',
    'tri-color',
    'tortoiseshell',
    'three colors'
  ],
  
  'Tabby': [
    'tabby',
    'tabby stripes',
    'striped',
    'm marking'
  ],
  
  'British Shorthair': [
    'british shorthair',
    'round face',
    'chubby cheeks'
  ]
}

/**
 * 对立颜色映射
 * 用于检测颜色冲突（如用户要求golden，但Qwen识别为black）
 */
export const OPPOSITE_COLORS: [string, string][] = [
  ['golden', 'black'],
  ['white', 'black'],
  ['light', 'dark'],
  ['cream', 'black'],
  ['yellow', 'black'],
  ['pale', 'dark'],
  ['bright', 'dull']
]

/**
 * 检查特征是否与某个品种强关联
 */
export function isAssociatedWithBreed(
  featureValue: string,
  breedName: string
): boolean {
  const normalizedFeature = featureValue.toLowerCase()
  const normalizedBreed = breedName.toLowerCase()
  
  // 1. 特征值直接包含品种名
  if (normalizedFeature.includes(normalizedBreed)) {
    return true
  }
  
  // 2. 特征值包含品种的视觉标记
  const markers = BREED_VISUAL_MARKERS[breedName] || []
  return markers.some(marker => 
    normalizedFeature.includes(marker.toLowerCase())
  )
}

/**
 * 检查两个颜色是否对立
 */
export function areOppositeColors(color1: string, color2: string): boolean {
  const c1 = color1.toLowerCase()
  const c2 = color2.toLowerCase()
  
  return OPPOSITE_COLORS.some(([opposite1, opposite2]) => {
    return (
      (c1.includes(opposite1) && c2.includes(opposite2)) ||
      (c1.includes(opposite2) && c2.includes(opposite1))
    )
  })
}
