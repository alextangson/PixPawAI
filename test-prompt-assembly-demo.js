#!/usr/bin/env node
/**
 * 🎨 Qwen JSON 到提示词的完整组装流程演示
 * 展示每一步如何解析和拼装
 */

console.clear()
console.log('╔' + '═'.repeat(78) + '╗')
console.log('║' + ' '.repeat(15) + 'Qwen JSON → 提示词 完整组装流程' + ' '.repeat(21) + '║')
console.log('╚' + '═'.repeat(78) + '╝')
console.log()

// ============================================================================
// 步骤 1：Qwen 返回的原始 JSON
// ============================================================================
console.log('【步骤 1】Qwen 识别返回的原始 JSON')
console.log('─'.repeat(80))

const qwenJson = {
  "petType": "cat",
  "detectedColors": "white",
  "hasHeterochromia": true,
  "heterochromiaDetails": "left eye yellow, right eye blue",
  "complexPattern": false,
  "patternDetails": "",
  "multiplePets": 1,
  "breed": "unknown",
  "keyFeatures": "fluffy long fur, pointed ears, heterochromia"
}

console.log(JSON.stringify(qwenJson, null, 2))
console.log()

// ============================================================================
// 步骤 2：解析 Qwen JSON，提取特征（parseQwenFeatures）
// ============================================================================
console.log('【步骤 2】解析 JSON，提取特征 (parseQwenFeatures)')
console.log('─'.repeat(80))
console.log('根据 JSON 的每个字段，生成带优先级的特征对象：\n')

const features = []

// 2.1 宠物类型（最高优先级）
if (qwenJson.petType && qwenJson.petType !== 'unknown') {
  const feature = {
    type: 'pet_type',
    value: qwenJson.petType,
    normalized: qwenJson.petType.toLowerCase(), // "cat"
    priority: 15, // 最高优先级
    source: 'qwen'
  }
  features.push(feature)
  console.log('✅ petType → pet_type 特征')
  console.log(`   原始值: "${qwenJson.petType}"`)
  console.log(`   标准化: "${feature.normalized}"`)
  console.log(`   优先级: ${feature.priority} (最高)`)
  console.log()
}

// 2.2 品种
if (qwenJson.breed && qwenJson.breed !== 'unknown') {
  const feature = {
    type: 'breed',
    value: qwenJson.breed,
    normalized: qwenJson.breed.toLowerCase(),
    priority: 12,
    source: 'qwen'
  }
  features.push(feature)
  console.log('✅ breed → breed 特征')
  console.log(`   标准化: "${feature.normalized}"`)
  console.log(`   优先级: ${feature.priority}`)
  console.log()
} else {
  console.log('⊘ breed 是 "unknown"，跳过')
  console.log()
}

// 2.3 颜色（detectedColors）
if (qwenJson.detectedColors) {
  const feature = {
    type: 'color',
    value: qwenJson.detectedColors,
    normalized: qwenJson.detectedColors.toLowerCase(), // "white"
    priority: 10,
    source: 'qwen'
  }
  features.push(feature)
  console.log('✅ detectedColors → color 特征')
  console.log(`   标准化: "${feature.normalized}"`)
  console.log(`   优先级: ${feature.priority}`)
  console.log()
}

// 2.4 异瞳（hasHeterochromia）- 重点！
if (qwenJson.hasHeterochromia) {
  const details = qwenJson.heterochromiaDetails.trim()
  
  // 解析眼睛颜色
  const leftMatch = details.match(/\bleft\b[^,]*?(\w+)/i)
  const rightMatch = details.match(/\bright\b[^,]*?(\w+)/i)
  
  const leftColor = leftMatch ? leftMatch[1].trim() : ''
  const rightColor = rightMatch ? rightMatch[1].trim() : ''
  
  const feature = {
    type: 'color',
    value: `heterochromia (${details})`,
    normalized: `heterochromia: ${leftColor} eye on left side of image, ${rightColor} eye on right side of image`,
    priority: 10 + 3, // 基础优先级 + 3
    source: 'qwen'
  }
  features.push(feature)
  console.log('✨ hasHeterochromia → color 特征（特殊）')
  console.log(`   原始值: "${qwenJson.heterochromiaDetails}"`)
  console.log(`   标准化: "${feature.normalized}"`)
  console.log(`   优先级: ${feature.priority} (提升了3)`)
  console.log()
}

// 2.5 复杂图案（complexPattern）
if (qwenJson.complexPattern && qwenJson.patternDetails) {
  const feature = {
    type: 'fur',
    value: qwenJson.patternDetails,
    normalized: `with ${qwenJson.patternDetails}`,
    priority: 11,
    source: 'qwen'
  }
  features.push(feature)
  console.log('✅ patternDetails → fur 特征')
  console.log(`   标准化: "${feature.normalized}"`)
  console.log()
} else {
  console.log('⊘ complexPattern 是 false，跳过图案')
  console.log()
}

// 2.6 关键特征（keyFeatures）
if (qwenJson.keyFeatures) {
  const feature = {
    type: 'other',
    value: qwenJson.keyFeatures,
    normalized: qwenJson.keyFeatures.toLowerCase(),
    priority: 8,
    source: 'qwen'
  }
  features.push(feature)
  console.log('✅ keyFeatures → other 特征')
  console.log(`   标准化: "${feature.normalized}"`)
  console.log(`   优先级: ${feature.priority}`)
  console.log()
}

console.log(`📊 总共提取了 ${features.length} 个特征\n`)

// ============================================================================
// 步骤 3：特征排序（按类型和优先级）
// ============================================================================
console.log('【步骤 3】特征排序（按类型顺序）')
console.log('─'.repeat(80))

const typeOrder = {
  'pet_type': 0,      // 最重要
  'breed': 1,
  'eyes': 2,
  'fur': 3,
  'color': 4,         // 颜色（包括异瞳）
  'body': 5,
  'pose': 7,
  'other': 12
}

const sortedFeatures = [...features].sort((a, b) => {
  const orderA = typeOrder[a.type] ?? 12
  const orderB = typeOrder[b.type] ?? 12
  if (orderA !== orderB) {
    return orderA - orderB
  }
  return b.priority - a.priority // 同类型内按优先级降序
})

console.log('排序后的特征顺序：\n')
sortedFeatures.forEach((f, i) => {
  console.log(`${i + 1}. [${f.type.padEnd(10)}] ${f.normalized}`)
  console.log(`   优先级: ${f.priority}, 来源: ${f.source}`)
})
console.log()

// ============================================================================
// 步骤 4：组装成最终提示词
// ============================================================================
console.log('【步骤 4】组装最终提示词 (buildPrompt)')
console.log('─'.repeat(80))

const promptParts = sortedFeatures.map(f => f.normalized)

// 假设用户输入了额外的提示词
const userInput = 'sitting elegantly'
if (userInput) {
  promptParts.push(userInput)
  console.log(`✨ 添加用户输入: "${userInput}"\n`)
}

// 假设风格提示词
const stylePrompt = 'in Pixar 3D animation style, studio lighting, professional render'
if (stylePrompt) {
  promptParts.push(stylePrompt)
  console.log(`🎨 添加风格提示词: "${stylePrompt}"\n`)
}

// 添加默认质量词
promptParts.push('high quality', 'detailed', 'masterpiece')
console.log('📈 添加默认质量词: "high quality, detailed, masterpiece"\n')

const finalPrompt = promptParts.join(', ')

console.log('═'.repeat(80))
console.log('✨ 最终生成的提示词 (Positive Prompt):')
console.log('═'.repeat(80))
console.log()
console.log(finalPrompt)
console.log()
console.log('═'.repeat(80))

// ============================================================================
// 步骤 5：负面提示词
// ============================================================================
console.log()
console.log('【步骤 5】负面提示词 (Negative Prompt)')
console.log('─'.repeat(80))

const negativePrompt = [
  'blurry',
  'low quality',
  'distorted',
  'deformed',
  'disfigured',
  'bad anatomy',
  'ugly',
  'duplicate',
  'mutation'
].join(', ')

console.log(negativePrompt)
console.log()

// ============================================================================
// 完整示例对比
// ============================================================================
console.log('═'.repeat(80))
console.log('📊 完整流程总结')
console.log('═'.repeat(80))
console.log()

console.log('🔹 输入 (Qwen JSON):')
console.log('   • petType: "cat"')
console.log('   • detectedColors: "white"')
console.log('   • hasHeterochromia: true')
console.log('   • heterochromiaDetails: "left eye yellow, right eye blue"')
console.log('   • breed: "unknown"')
console.log('   • keyFeatures: "fluffy long fur, pointed ears, heterochromia"')
console.log()

console.log('🔹 解析成特征:')
sortedFeatures.forEach((f, i) => {
  console.log(`   ${i + 1}. ${f.normalized}`)
})
console.log()

console.log('🔹 最终输出 (提示词):')
console.log(`   ${finalPrompt}`)
console.log()

console.log('═'.repeat(80))
console.log('✨ 完成！')
console.log()

// ============================================================================
// 关键点说明
// ============================================================================
console.log('💡 关键点说明:')
console.log('─'.repeat(80))
console.log()
console.log('1. petType 永远在最前面（优先级 15）')
console.log('   → 确保 AI 首先知道这是什么动物')
console.log()
console.log('2. 异瞳会被特别处理（优先级 +3）')
console.log('   → "heterochromia: yellow eye on left side, blue eye on right side"')
console.log('   → 明确指定图像坐标系，避免镜像问题')
console.log()
console.log('3. 特征按类型分组排序')
console.log('   → pet_type → breed → color → fur → pose → style')
console.log()
console.log('4. 最后添加质量词和风格词')
console.log('   → 保证生成质量')
console.log()
console.log('5. breed 为 "unknown" 时会被跳过')
console.log('   → 只保留有价值的信息')
console.log()
