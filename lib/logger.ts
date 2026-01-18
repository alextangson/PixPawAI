/**
 * 日志系统 - 用于调试和问题追踪
 * 
 * 特点：
 * - 开发环境自动开启，生产环境默认关闭
 * - 可通过 FEATURE_FLAGS 控制
 * - 不影响性能（生产环境静默）
 */

import { FEATURE_FLAGS } from './feature-flags'

/**
 * 日志工具类
 */
export const logger = {
  /**
   * 提示词构建流程日志
   * 记录构建的每一步
   */
  promptBuild: (step: string, data: any) => {
    if (!FEATURE_FLAGS.ENABLE_DETAILED_LOGS) return
    
    console.log(`[Prompt Builder] ${step}:`, 
      typeof data === 'object' ? JSON.stringify(data, null, 2) : data
    )
  },
  
  /**
   * Qwen AI 分析日志
   * 记录识别结果
   */
  qwenAnalysis: (data: any) => {
    if (!FEATURE_FLAGS.ENABLE_DETAILED_LOGS) return
    
    console.log(`[Qwen Analysis]:`, data)
  },
  
  /**
   * 冲突检测日志
   * 记录哪些内容被清理
   */
  conflictDetection: (original: string, cleaned: string, removed: string[]) => {
    if (!FEATURE_FLAGS.ENABLE_DETAILED_LOGS) return
    
    console.log(`[Conflict Cleaner]`, {
      original: original.substring(0, 100) + (original.length > 100 ? '...' : ''),
      cleaned: cleaned.substring(0, 100) + (cleaned.length > 100 ? '...' : ''),
      removed: removed.length > 0 ? removed : 'none'
    })
  },
  
  /**
   * 功能开关状态日志
   * 记录哪些功能开关被启用
   */
  featureFlag: (flag: string, value: boolean) => {
    console.log(`[Feature Flag] ${flag}: ${value ? '✅ ON' : '⚪ OFF'}`)
  },
  
  /**
   * 错误日志（始终输出）
   */
  error: (context: string, error: any) => {
    console.error(`[Error] ${context}:`, error)
  },
  
  /**
   * 警告日志（始终输出）
   */
  warn: (context: string, message: string) => {
    console.warn(`[Warning] ${context}: ${message}`)
  },
  
  /**
   * 信息日志（始终输出）
   */
  info: (context: string, message: string) => {
    console.log(`[Info] ${context}: ${message}`)
  },
  
  /**
   * 性能日志
   * 记录关键操作的耗时
   */
  performance: (operation: string, startTime: number) => {
    if (!FEATURE_FLAGS.ENABLE_DETAILED_LOGS) return
    
    const duration = Date.now() - startTime
    console.log(`[Performance] ${operation}: ${duration}ms`)
  },
}

/**
 * 性能计时器辅助函数
 */
export function createTimer(operation: string) {
  const startTime = Date.now()
  
  return {
    end: () => logger.performance(operation, startTime)
  }
}

/**
 * 快捷导出函数（用于 prompt-system）
 */
export const logPromptBuild = logger.promptBuild
export const logError = logger.error

/**
 * 示例用法：
 * 
 * // 提示词构建
 * logger.promptBuild('Parsing user prompt', { text: userPrompt })
 * 
 * // Qwen分析
 * logger.qwenAnalysis(qwenResult)
 * 
 * // 冲突检测
 * logger.conflictDetection(original, cleaned, ['white fur', 'Husky'])
 * 
 * // 功能开关
 * logger.featureFlag('USE_NEW_PROMPT_SYSTEM', true)
 * 
 * // 错误
 * logger.error('Replicate API', error)
 * 
 * // 性能
 * const timer = createTimer('Generate image')
 * // ... 执行操作
 * timer.end()
 */
