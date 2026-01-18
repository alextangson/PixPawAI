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
   * 
   * 🔍 临时启用：测试阶段需要查看 Prompt Builder 详细日志
   */
  ENABLE_DETAILED_LOGS: true, // 临时启用以进行冲突检测调试
  
  /**
   * 禁用冲突清理（实验性）
   * - false: 保留冲突检测，过滤掉冲突的特征（默认，安全）
   * - true: 禁用冲突检测，所有特征直接传给 FLUX（实验性）
   * 
   * 🧪 用途：
   * 1. A/B 测试：对比有/无冲突检测的生成质量
   * 2. 高级用户模式：给予完全控制权
   * 3. 数据收集：观察 FLUX 在冲突提示词下的表现
   * 
   * ⚠️ 风险：可能导致生成结果不可预测
   * 默认: false（保护模式）
   */
  DISABLE_CONFLICT_CLEANING: process.env.NEXT_PUBLIC_DISABLE_CONFLICT_CLEANING === 'true',
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
    DISABLE_CONFLICT_CLEANING: FEATURE_FLAGS.DISABLE_CONFLICT_CLEANING,
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
