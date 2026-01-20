/**
 * Multi-Model Router
 * Routes generation requests to different AI model providers based on style configuration
 * Supports: Replicate (FLUX/SDXL), Doubao, Midjourney, and future models
 */

import Replicate from 'replicate'
import { logger } from './logger'

/**
 * Model configuration from database
 */
export interface ModelConfig {
  provider: string      // 'replicate', 'doubao', 'midjourney'
  modelId: string       // Model identifier on the provider platform
  loraUrl?: string      // Optional LoRA URL (for FLUX/SDXL)
  params?: any          // Provider-specific parameters
}

/**
 * Generation request parameters
 */
export interface GenerationRequest {
  prompt: string
  negativePrompt?: string
  imageUrl?: string
  strength?: number
  guidance?: number
  aspectRatio?: string
  goFast?: boolean
  outputQuality?: number
  megapixels?: string
}

/**
 * Generation result
 */
export interface GenerationResult {
  outputUrl: string
  provider: string
  modelId: string
  metadata?: any
}

/**
 * Main router function - routes to appropriate model provider
 */
export async function generateWithModelRouter(
  modelConfig: ModelConfig,
  request: GenerationRequest,
  userId: string,
  generationId: string
): Promise<GenerationResult> {
  logger.info('ModelRouter', `Routing to ${modelConfig.provider}/${modelConfig.modelId}`)
  
  switch (modelConfig.provider.toLowerCase()) {
    case 'replicate':
      return await generateWithReplicate(modelConfig, request, userId, generationId)
    
    case 'doubao':
      return await generateWithDoubao(modelConfig, request)
    
    case 'midjourney':
      throw new Error('Midjourney integration not yet implemented')
    
    default:
      throw new Error(`Unsupported model provider: ${modelConfig.provider}`)
  }
}

/**
 * Replicate provider (FLUX, SDXL, etc.)
 */
async function generateWithReplicate(
  modelConfig: ModelConfig,
  request: GenerationRequest,
  userId: string,
  generationId: string
): Promise<GenerationResult> {
  const apiKey = process.env.REPLICATE_API_TOKEN
  if (!apiKey) {
    throw new Error('REPLICATE_API_TOKEN not configured')
  }
  
  const replicate = new Replicate({ auth: apiKey })
  
  // Build input based on model type
  const input: any = {
    prompt: request.prompt,
    num_outputs: 1,
    output_format: "png",
    output_quality: request.outputQuality || 80,
    disable_safety_checker: true,
  }
  
  // Add image-to-image parameters if image provided
  if (request.imageUrl) {
    input.image = request.imageUrl
    input.prompt_strength = request.strength || 0.35
  }
  
  // Model-specific parameters
  if (modelConfig.modelId.includes('flux')) {
    // FLUX-specific parameters
    input.num_inference_steps = 50
    input.guidance = request.guidance || 2.5
    input.go_fast = request.goFast !== undefined ? request.goFast : true
    input.megapixels = request.megapixels || "1"
    
    // Add LoRA support for flux-dev-lora
    if (modelConfig.modelId.includes('lora') && modelConfig.loraUrl) {
      input.hf_lora = modelConfig.loraUrl
      input.lora_scale = modelConfig.params?.lora_scale || 0.8
      
      logger.info('ReplicateRouter', `Using LoRA: ${modelConfig.loraUrl}`)
    }
  } else if (modelConfig.modelId.includes('sdxl')) {
    // SDXL-specific parameters
    input.num_inference_steps = 30
    input.guidance_scale = request.guidance || 7.5
    input.negative_prompt = request.negativePrompt || ""
    
    // Add LoRA support for SDXL
    if (modelConfig.loraUrl) {
      input.lora_weights = modelConfig.loraUrl
      input.lora_scale = modelConfig.params?.lora_scale || 0.9
      
      logger.info('ReplicateRouter', `Using LoRA: ${modelConfig.loraUrl}`)
    }
  }
  
  // Merge any additional custom parameters from database
  if (modelConfig.params) {
    Object.assign(input, modelConfig.params)
  }
  
  logger.info('ReplicateRouter', `Calling ${modelConfig.modelId} (image=${!!request.imageUrl}, strength=${input.prompt_strength}, guidance=${input.guidance || input.guidance_scale}, lora=${!!modelConfig.loraUrl})`)
  
  // Call Replicate API
  const output = await replicate.run(
    modelConfig.modelId as any,
    { input }
  ) as any
  
  const outputUrl = Array.isArray(output) ? output[0] : output
  
  if (!outputUrl) {
    throw new Error('No output URL from Replicate')
  }
  
  return {
    outputUrl,
    provider: 'replicate',
    modelId: modelConfig.modelId,
    metadata: {
      strength: input.prompt_strength,
      guidance: input.guidance || input.guidance_scale,
      usedLora: !!modelConfig.loraUrl
    }
  }
}

/**
 * Doubao (ByteDance) provider
 * TODO: Implement when API access is available
 */
async function generateWithDoubao(
  modelConfig: ModelConfig,
  request: GenerationRequest
): Promise<GenerationResult> {
  throw new Error('Doubao integration not yet implemented - awaiting API access')
  
  // Future implementation:
  // const apiKey = process.env.DOUBAO_API_KEY
  // const response = await fetch('https://api.doubao.com/v1/images', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${apiKey}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     model: modelConfig.modelId,
  //     prompt: request.prompt,
  //     image: request.imageUrl,
  //     ...modelConfig.params
  //   })
  // })
  // 
  // const data = await response.json()
  // return {
  //   outputUrl: data.output_url,
  //   provider: 'doubao',
  //   modelId: modelConfig.modelId
  // }
}

/**
 * Helper: Get default model config if style doesn't specify one
 */
export function getDefaultModelConfig(): ModelConfig {
  return {
    provider: 'replicate',
    modelId: 'black-forest-labs/flux-dev',
    params: {}
  }
}
