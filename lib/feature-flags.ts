/**
 * 功能开关配置
 * 用于控制新功能的启用/禁用，支持灰度发布和紧急回滚
 * 
 * 使用方法：
 * 1. 在 .env.local 中设置环境变量
 * 2. 或在 Vercel Dashboard 中设置环境变量
 * 3. 修改后重新部署即可生效
 */

export const FEATURE_FLAGS = {
  /**
   * 新提示词系统开关
   * - false: 使用旧的提示词构建逻辑（当前线上版本）
   * - true: 使用新的智能三层优先级系统
   * 
   * 🚀 直接启用新系统（无真实用户，无需灰度测试）
   */
  USE_NEW_PROMPT_SYSTEM: true,
  
  /**
   * 风格库数据库开关
   * - false: 使用硬编码的风格列表（lib/styles.ts）
   * - true: 从 Supabase styles 表读取风格
   * 
   * 默认: false（兼容旧系统）
   */
  USE_DATABASE_STYLES: process.env.NEXT_PUBLIC_USE_DATABASE_STYLES === 'true',
  
  /**
   * 管理后台开关
   * - 可以打开，只有 admin 角色才能访问，不影响普通用户
   * 
   * 默认: true（管理后台不影响用户）
   */
  ENABLE_ADMIN_PANEL: true,
  
  /**
   * 详细日志开关
   * - 开发环境默认开启，方便调试
   * - 生产环境默认关闭，避免性能影响
   */
  ENABLE_DETAILED_LOGS: process.env.NODE_ENV === 'development',
}

/**
 * 检查某个功能是否启用
 */
export function isFeatureEnabled(featureName: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[featureName]
}

/**
 * 获取所有功能开关状态（用于调试）
 */
export function getAllFeatureFlags() {
  return {
    USE_NEW_PROMPT_SYSTEM: FEATURE_FLAGS.USE_NEW_PROMPT_SYSTEM,
    USE_DATABASE_STYLES: FEATURE_FLAGS.USE_DATABASE_STYLES,
    ENABLE_ADMIN_PANEL: FEATURE_FLAGS.ENABLE_ADMIN_PANEL,
    ENABLE_DETAILED_LOGS: FEATURE_FLAGS.ENABLE_DETAILED_LOGS,
  }
}

/**
 * 环境变量设置示例（.env.local）:
 * 
 * # 新提示词系统（默认关闭）
 * NEXT_PUBLIC_USE_NEW_PROMPT_SYSTEM=false
 * 
 * # 风格库数据库（默认关闭）
 * NEXT_PUBLIC_USE_DATABASE_STYLES=false
 * 
 * # 生产环境开启详细日志（调试用）
 * NODE_ENV=production  # 系统自动设置
 */
