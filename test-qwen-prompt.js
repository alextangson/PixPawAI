#!/usr/bin/env node
/**
 * 测试 Qwen 深度分析和提示词生成
 * 用于查看图片最终会如何组装到提示词中
 */

// 直接从 .env.local 读取（简化版，不需要 dotenv）
const fs = require('fs')
const path = require('path')

let SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY

// 如果环境变量没有，尝试从 .env.local 读取
if (!SILICONFLOW_API_KEY) {
  try {
    const envPath = path.join(__dirname, '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const match = envContent.match(/SILICONFLOW_API_KEY=(.+)/)
    if (match) {
      SILICONFLOW_API_KEY = match[1].trim()
    }
  } catch (error) {
    // 忽略读取错误
  }
}

if (!SILICONFLOW_API_KEY) {
  console.error('❌ 错误: 未找到 SILICONFLOW_API_KEY')
  console.error('请在 .env.local 中配置 SILICONFLOW_API_KEY')
  process.exit(1)
}

// 用户提供的图片URL
const IMAGE_URL = 'https://gukjzngfmkbnkxckwbqk.supabase.co/storage/v1/object/public/guest-uploads/test-lab/test-1768838871839-d9wo8v.jpg'

/**
 * Qwen 深度分析（用于生成图片时）
 */
async function analyzePetFeatures(imageUrl) {
  console.log('🔍 开始 Qwen 深度分析...')
  console.log('📸 图片URL:', imageUrl.substring(0, 80) + '...\n')

  const prompt = `🔍 CRITICAL TASK: Analyze pet characteristics accurately

You are a pet analysis specialist. Your job is to:

0. PET TYPE IDENTIFICATION (MOST IMPORTANT!):
   - Identify the specific pet type: cat, dog, bird, rabbit, snake, lizard, turtle, hamster, guinea pig, ferret, fish, etc.
   - Be specific and accurate
   - This is the MOST CRITICAL field

1. COLOR ANALYSIS (REQUIRED!):
   - Describe the PRIMARY fur/feather/scale colors you see
   - Be specific: "white and gray", "orange tabby", "black with white patches", "golden brown"
   - Include markings: "tuxedo", "calico", "brindle"
   - Output in detectedColors field

2. PATTERN ANALYSIS (REQUIRED!):
   - If complexPattern = true, specify pattern type in patternDetails:
     * "stripes" or "tabby stripes" (for striped cats/animals)
     * "spots" or "dalmatian spots" (for spotted animals)
     * "patches" or "calico patches" (for multi-color patches)
     * "brindle" (for tiger-stripe dogs)
     * "merle" (for marbled patterns)
   - If solid color, leave patternDetails empty

3. HETEROCHROMIA DETECTION (STRICT):
   ⚠️ ONLY mark as TRUE if you can CLEARLY SEE both eyes AND they are VISIBLY DIFFERENT colors
   - Look at LEFT eye color (blue, brown, green, amber, etc.)
   - Look at RIGHT eye color
   - Are they CLEARLY DIFFERENT? Only then = heterochromia
   - Example: "left eye blue, right eye brown"
   - If you can't see both eyes clearly: hasHeterochromia = false
   - If both eyes look the same color: hasHeterochromia = false

4. BREED IDENTIFICATION:
   - Identify the actual breed of the pet in the photo
   - Be accurate - do not assume
   - If unsure, output "unknown"

5. KEY VISUAL FEATURES (IMPORTANT!):
   - Describe VISIBLE features that define this pet's appearance
   - Focus on: fur texture, distinctive markings, body shape, ear shape
   - DO NOT describe actions or expressions (no "open mouth", "playing", etc.)
   - Good examples: "fluffy long fur", "pointed ears", "short legs", "bushy tail"
   - Bad examples: "open mouth", "happy expression", "looking at camera"

Output ONLY this JSON (no markdown, no explanation):
{
  "petType": "cat",
  "detectedColors": "white and gray fur with tabby markings",
  "hasHeterochromia": false,
  "heterochromiaDetails": "",
  "complexPattern": true,
  "patternDetails": "tabby stripes",
  "multiplePets": 1,
  "breed": "American Shorthair",
  "keyFeatures": "striped pattern, short fur, round face"
}

Another example (dog):
{"petType": "dog", "detectedColors": "golden cream colored fur", "hasHeterochromia": false, "heterochromiaDetails": "", "complexPattern": false, "patternDetails": "", "multiplePets": 1, "breed": "Golden Retriever", "keyFeatures": "fluffy long fur, floppy ears"}`

  try {
    const response = await fetch('https://api.siliconflow.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-VL-72B-Instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        max_tokens: 150,
        temperature: 0.2,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Qwen API 错误: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''
    
    console.log('📥 Qwen 原始响应:')
    console.log('─'.repeat(80))
    console.log(content)
    console.log('─'.repeat(80))
    console.log()
    
    // 解析JSON
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
    
    const parsed = JSON.parse(jsonStr)
    
    return parsed
  } catch (error) {
    console.error('❌ 分析失败:', error.message)
    throw error
  }
}

/**
 * 模拟提示词组装（简化版）
 */
function buildPromptPreview(qwenResult, userPrompt = '', styleName = 'Pixar Style') {
  console.log('🎨 提示词组装预览')
  console.log('═'.repeat(80))
  
  // 1. 基础信息
  console.log('\n【第1步】基础信息识别:')
  console.log(`  • 宠物类型: ${qwenResult.petType || 'pet'}`)
  console.log(`  • 品种: ${qwenResult.breed || 'unknown'}`)
  console.log(`  • 颜色: ${qwenResult.detectedColors || '未检测到'}`)
  
  // 2. 特殊特征
  console.log('\n【第2步】特殊特征:')
  if (qwenResult.hasHeterochromia) {
    console.log(`  ✨ 异瞳症: ${qwenResult.heterochromiaDetails}`)
  }
  if (qwenResult.complexPattern) {
    console.log(`  🎨 复杂图案: ${qwenResult.patternDetails}`)
  }
  console.log(`  👁️ 关键特征: ${qwenResult.keyFeatures || '无'}`)
  
  // 3. 组装提示词
  console.log('\n【第3步】最终提示词组装:')
  
  let promptParts = []
  
  // 宠物类型和品种
  if (qwenResult.breed && qwenResult.breed !== 'unknown') {
    promptParts.push(`${qwenResult.breed} ${qwenResult.petType}`)
  } else {
    promptParts.push(qwenResult.petType || 'pet')
  }
  
  // 颜色
  if (qwenResult.detectedColors) {
    promptParts.push(`with ${qwenResult.detectedColors}`)
  }
  
  // 异瞳
  if (qwenResult.hasHeterochromia && qwenResult.heterochromiaDetails) {
    promptParts.push(`heterochromia (${qwenResult.heterochromiaDetails})`)
  }
  
  // 图案
  if (qwenResult.complexPattern && qwenResult.patternDetails) {
    promptParts.push(qwenResult.patternDetails)
  }
  
  // 关键特征
  if (qwenResult.keyFeatures) {
    promptParts.push(qwenResult.keyFeatures)
  }
  
  // 用户自定义
  if (userPrompt) {
    promptParts.push(userPrompt)
  }
  
  // 风格
  promptParts.push(`in ${styleName}`)
  
  const finalPrompt = promptParts.join(', ')
  
  console.log('\n  📝 拼装后的提示词:')
  console.log('  ┌' + '─'.repeat(78))
  console.log(`  │ ${finalPrompt}`)
  console.log('  └' + '─'.repeat(78))
  
  console.log('\n  📊 提示词组成部分:')
  promptParts.forEach((part, index) => {
    console.log(`     ${index + 1}. ${part}`)
  })
  
  console.log('\n═'.repeat(80))
}

/**
 * 主函数
 */
async function main() {
  console.clear()
  console.log('╔' + '═'.repeat(78) + '╗')
  console.log('║' + ' '.repeat(20) + 'Qwen 深度分析 + 提示词测试' + ' '.repeat(21) + '║')
  console.log('╚' + '═'.repeat(78) + '╝')
  console.log()
  
  try {
    // 1. Qwen 深度分析
    const qwenResult = await analyzePetFeatures(IMAGE_URL)
    
    console.log('✅ 分析完成！\n')
    
    // 2. 显示完整结果
    console.log('📊 Qwen 深度分析完整结果:')
    console.log('═'.repeat(80))
    console.log(JSON.stringify(qwenResult, null, 2))
    console.log('═'.repeat(80))
    console.log()
    
    // 3. 显示提示词组装
    buildPromptPreview(qwenResult, 'sitting elegantly', 'Pixar 3D Animation Style')
    
    console.log('\n✨ 测试完成！')
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    process.exit(1)
  }
}

// 运行
main()
