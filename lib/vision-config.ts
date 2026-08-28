// Qwen2.5-VL-72B-Instruct was retired by SiliconFlow on 2026-04-29.
// Keep all three analysis paths on one configurable, currently supported model.
export const SILICONFLOW_VISION_MODEL =
  process.env.SILICONFLOW_VISION_MODEL?.trim() || 'Qwen/Qwen3-VL-8B-Instruct'
