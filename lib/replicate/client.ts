/**
 * Replicate API 客户端
 * 用于调用 AI 图片生成模型
 */

import Replicate from 'replicate'

// 初始化 Replicate 客户端
export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

/**
 * 风格配置映射
 * 将 UI 风格名称映射到 Replicate 模型和提示词
 */
export const STYLE_CONFIGS: Record<
  string,
  {
    model: string
    promptTemplate: string
    negativePrompt?: string
  }
> = {
  // 水彩风格
  watercolor: {
    model: 'black-forest-labs/flux-schnell',
    promptTemplate:
      'A beautiful watercolor painting of {pet}, soft pastel colors, artistic brush strokes, dreamy and ethereal, high quality',
    negativePrompt: 'photograph, realistic, blurry, low quality',
  },
  // 油画风格
  'oil-painting': {
    model: 'black-forest-labs/flux-schnell',
    promptTemplate:
      'A magnificent oil painting portrait of {pet}, rich textures, vibrant colors, classical art style, museum quality',
    negativePrompt: 'cartoon, anime, low quality, blurry',
  },
  // 动漫风格
  anime: {
    model: 'black-forest-labs/flux-schnell',
    promptTemplate:
      'An adorable anime style illustration of {pet}, big expressive eyes, cute and colorful, Studio Ghibli inspired, high quality',
    negativePrompt: 'realistic, photograph, western cartoon, low quality',
  },
  // 卡通风格
  cartoon: {
    model: 'black-forest-labs/flux-schnell',
    promptTemplate:
      'A playful cartoon illustration of {pet}, bold colors, fun and whimsical, Disney stylized artistic look, professional quality',
    negativePrompt: 'realistic, photograph, anime, low quality',
  },
  // 艺术肖像风格
  '3d-render': {
    model: 'black-forest-labs/flux-schnell',
    promptTemplate:
      'A stunning artistic portrait of {pet}, smooth textures, professional lighting, stylized portrait character, ultra high quality',
    negativePrompt: 'flat, 2d, photograph, low quality',
  },
  // 超现实主义
  surreal: {
    model: 'black-forest-labs/flux-schnell',
    promptTemplate:
      'A surreal artistic portrait of {pet}, dreamlike atmosphere, Salvador Dali inspired, magical and fantastical, high quality',
    negativePrompt: 'realistic, normal, ordinary, low quality',
  },
  // 波普艺术
  'pop-art': {
    model: 'black-forest-labs/flux-schnell',
    promptTemplate:
      'A vibrant pop art portrait of {pet}, Andy Warhol style, bold colors, graphic design, high contrast, iconic',
    negativePrompt: 'realistic, subtle, muted, low quality',
  },
  // 素描风格
  sketch: {
    model: 'black-forest-labs/flux-schnell',
    promptTemplate:
      'A detailed pencil sketch of {pet}, fine line work, artistic shading, classical drawing style, high quality',
    negativePrompt: 'colorful, painted, photograph, low quality',
  },
}

/**
 * 生成宠物肖像
 */
export async function generatePetPortrait(
  imageUrl: string,
  style: string,
  petType: string = 'pet'
): Promise<string> {
  const styleConfig = STYLE_CONFIGS[style] || STYLE_CONFIGS.watercolor

  // 构建提示词
  const prompt = styleConfig.promptTemplate.replace(
    '{pet}',
    `this ${petType}`
  )

  console.log('Starting generation with:', {
    model: styleConfig.model,
    prompt,
    imageUrl,
  })

  try {
    // 使用 Flux Schnell 模型（快速版本）
    const output = await replicate.run(styleConfig.model as `${string}/${string}`, {
      input: {
        prompt: prompt,
        image: imageUrl,
        num_outputs: 1,
        aspect_ratio: '1:1',
        output_format: 'png',
        output_quality: 90,
      },
    })

    console.log('Generation output:', output)

    // Flux 模型返回数组
    if (Array.isArray(output) && output.length > 0) {
      return output[0] as string
    }

    throw new Error('No output from model')
  } catch (error) {
    console.error('Generation failed:', error)
    throw error
  }
}

/**
 * 获取可用的风格列表
 */
export function getAvailableStyles() {
  return Object.keys(STYLE_CONFIGS)
}

/**
 * 获取风格的显示名称
 */
export function getStyleDisplayName(styleKey: string): string {
  const displayNames: Record<string, string> = {
    watercolor: 'Watercolor',
    'oil-painting': 'Oil Painting',
    anime: 'Anime',
    cartoon: 'Cartoon',
    '3d-render': 'Artistic Portrait',
    surreal: 'Surreal',
    'pop-art': 'Pop Art',
    sketch: 'Sketch',
  }
  return displayNames[styleKey] || styleKey
}
