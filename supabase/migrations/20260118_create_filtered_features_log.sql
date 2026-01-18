-- 创建被过滤特征日志表
-- 用于收集数据，分析冲突检测是否合理

CREATE TABLE IF NOT EXISTS public.filtered_features_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 用户信息
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id UUID, -- 关联到 generations 表（如果有）
  
  -- 被过滤的特征
  feature_type TEXT NOT NULL, -- breed, color, pattern, etc.
  feature_value TEXT NOT NULL, -- 原始值
  feature_normalized TEXT NOT NULL, -- 标准化后的值
  feature_priority INTEGER NOT NULL, -- 优先级
  feature_source TEXT NOT NULL, -- user, qwen, style
  
  -- 过滤原因
  filter_reason TEXT NOT NULL, -- 'enhancement_mode_filter', 'conflict_detected', 'breed_association'
  conflict_with_type TEXT, -- 如果是冲突，与什么类型冲突
  conflict_with_value TEXT, -- 冲突的特征值
  
  -- 上下文信息
  original_user_input TEXT, -- 用户原始输入
  style_id TEXT, -- 使用的风格
  pet_type TEXT, -- 宠物类型
  
  -- 元数据
  metadata JSONB -- 额外信息（如完整的特征对象）
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_filtered_features_user_id ON public.filtered_features_log(user_id);
CREATE INDEX IF NOT EXISTS idx_filtered_features_created_at ON public.filtered_features_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_filtered_features_type ON public.filtered_features_log(feature_type);
CREATE INDEX IF NOT EXISTS idx_filtered_features_reason ON public.filtered_features_log(filter_reason);
CREATE INDEX IF NOT EXISTS idx_filtered_features_source ON public.filtered_features_log(feature_source);

-- 添加注释
COMMENT ON TABLE public.filtered_features_log IS '被过滤特征日志表 - 用于数据分析和优化冲突检测规则';
COMMENT ON COLUMN public.filtered_features_log.filter_reason IS '过滤原因：enhancement_mode_filter（增强模式过滤）, conflict_detected（冲突检测）, breed_association（品种关联清理）';
COMMENT ON COLUMN public.filtered_features_log.metadata IS '额外元数据，包含完整的特征对象和冲突详情';

-- RLS 策略（只允许服务端写入）
ALTER TABLE public.filtered_features_log ENABLE ROW LEVEL SECURITY;

-- 允许 service_role 写入
CREATE POLICY "Service role can insert filtered features log"
  ON public.filtered_features_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 允许 admin 查看
CREATE POLICY "Admin can view filtered features log"
  ON public.filtered_features_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 创建数据分析视图
CREATE OR REPLACE VIEW public.filtered_features_stats AS
SELECT
  feature_type,
  filter_reason,
  feature_source,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  array_agg(DISTINCT feature_value ORDER BY feature_value) FILTER (WHERE feature_value IS NOT NULL) as common_values
FROM public.filtered_features_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY feature_type, filter_reason, feature_source
ORDER BY count DESC;

COMMENT ON VIEW public.filtered_features_stats IS '被过滤特征统计视图 - 显示最近30天的过滤统计数据';
