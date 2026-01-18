-- ====================================
-- PixPaw AI - Admin数据分析SQL脚本集合
-- ====================================
-- 
-- 用途：提供常用的数据分析查询，用于Admin Dashboard和手动数据分析
-- 更新时间：2026-01-18
-- 
-- 使用方法：
-- 1. 在Supabase SQL Editor中运行
-- 2. 或在Admin Dashboard中通过API调用
-- 3. 根据需要修改时间范围和筛选条件
--
-- ====================================

-- ========================================
-- 第1部分：被过滤特征分析
-- ========================================

-- 1.1 被过滤特征30天统计（使用预置视图）
-- 用途：快速查看哪些特征最常被过滤
SELECT 
  feature_type,
  filter_reason,
  feature_source,
  count,
  unique_users,
  common_values
FROM filtered_features_stats
ORDER BY count DESC
LIMIT 20;

-- 1.2 最常被过滤的用户输入（Top 20）
-- 用途：发现用户最想做但被系统阻止的事情
SELECT 
  original_user_input,
  filter_reason,
  COUNT(*) as occurrences,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM filtered_features_log WHERE created_at >= NOW() - INTERVAL '30 days')::numeric * 100, 2) as percentage
FROM filtered_features_log
WHERE filter_reason = 'enhancement_mode_filter'
  AND created_at >= NOW() - INTERVAL '30 days'
  AND original_user_input IS NOT NULL
GROUP BY original_user_input, filter_reason
ORDER BY occurrences DESC
LIMIT 20;

-- 1.3 冲突模式分析
-- 用途：了解哪些特征类型最容易冲突
SELECT 
  feature_type,
  conflict_with_type,
  COUNT(*) as conflict_count,
  COUNT(DISTINCT user_id) as affected_users,
  array_agg(DISTINCT feature_value ORDER BY feature_value) FILTER (WHERE feature_value IS NOT NULL) as common_features,
  array_agg(DISTINCT conflict_with_value ORDER BY conflict_with_value) FILTER (WHERE conflict_with_value IS NOT NULL) as conflicts_with
FROM filtered_features_log
WHERE filter_reason = 'conflict_detected'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY feature_type, conflict_with_type
ORDER BY conflict_count DESC;

-- 1.4 按风格分析被过滤特征
-- 用途：某些风格是否更容易触发过滤？
SELECT 
  style_id,
  filter_reason,
  feature_type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM filtered_features_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY style_id, filter_reason, feature_type
ORDER BY style_id, count DESC;

-- 1.5 过滤趋势（按天）
-- 用途：观察过滤频率的时间趋势
SELECT 
  DATE(created_at) as date,
  filter_reason,
  COUNT(*) as daily_count,
  COUNT(DISTINCT user_id) as unique_users
FROM filtered_features_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), filter_reason
ORDER BY date DESC, daily_count DESC;

-- ========================================
-- 第2部分：用户反馈分析
-- ========================================

-- 2.1 "Not Quite" 反馈统计（最近30天）
-- 用途：了解用户不满意的原因分布
SELECT 
  metadata->>'reason' as feedback_reason,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(AVG(CASE WHEN metadata->>'rating' IS NOT NULL THEN (metadata->>'rating')::int ELSE NULL END), 2) as avg_rating
FROM generations
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND metadata->>'feedback_type' = 'not_quite'
GROUP BY metadata->>'reason'
ORDER BY count DESC;

-- 2.2 用户满意度分布
-- 用途：整体用户满意度评估
SELECT 
  CASE 
    WHEN metadata->>'feedback_type' = 'love_it' THEN 'Love it'
    WHEN metadata->>'feedback_type' = 'not_quite' THEN 'Not quite'
    ELSE 'No feedback'
  END as feedback_type,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM generations WHERE created_at >= NOW() - INTERVAL '30 days')::numeric * 100, 2) as percentage
FROM generations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY metadata->>'feedback_type'
ORDER BY count DESC;

-- 2.3 改进建议 Top 10
-- 用途：用户提供的改进建议
SELECT 
  metadata->>'improvement_suggestion' as suggestion,
  COUNT(*) as count,
  array_agg(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as user_ids
FROM generations
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND metadata->>'improvement_suggestion' IS NOT NULL
  AND metadata->>'improvement_suggestion' != ''
GROUP BY metadata->>'improvement_suggestion'
ORDER BY count DESC
LIMIT 10;

-- 2.4 按风格的用户满意度
-- 用途：哪个风格的满意度最高/最低？
SELECT 
  style,
  COUNT(*) as total_generations,
  COUNT(*) FILTER (WHERE metadata->>'feedback_type' = 'love_it') as love_it_count,
  COUNT(*) FILTER (WHERE metadata->>'feedback_type' = 'not_quite') as not_quite_count,
  ROUND(COUNT(*) FILTER (WHERE metadata->>'feedback_type' = 'love_it')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE metadata->>'feedback_type' IS NOT NULL)::numeric, 0) * 100, 2) as satisfaction_rate
FROM generations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY style
ORDER BY satisfaction_rate DESC NULLS LAST;

-- ========================================
-- 第3部分：生成统计
-- ========================================

-- 3.1 生成成功率（最近24小时）
-- 用途：监控系统稳定性
SELECT 
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE status = 'succeeded') as succeeded,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'processing') as processing,
  ROUND(COUNT(*) FILTER (WHERE status = 'succeeded')::numeric / COUNT(*)::numeric * 100, 2) as success_rate,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) FILTER (WHERE status = 'succeeded'), 2) as avg_generation_time_seconds
FROM generations
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 3.2 风格使用排行榜（最近30天）
-- 用途：了解最受欢迎的风格
SELECT 
  style,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM generations WHERE created_at >= NOW() - INTERVAL '30 days')::numeric * 100, 2) as usage_percentage,
  ROUND(AVG(CASE WHEN metadata->>'feedback_type' = 'love_it' THEN 1 ELSE 0 END) * 100, 2) as satisfaction_rate
FROM generations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY style
ORDER BY usage_count DESC;

-- 3.3 每日生成趋势（最近30天）
-- 用途：生成图表
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_generations,
  COUNT(*) FILTER (WHERE status = 'succeeded') as succeeded,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(DISTINCT user_id) as unique_users
FROM generations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 3.4 用户生成分布
-- 用途：识别高频用户和一次性用户
SELECT 
  generation_bucket,
  COUNT(*) as user_count
FROM (
  SELECT 
    user_id,
    CASE 
      WHEN COUNT(*) = 1 THEN '1 generation'
      WHEN COUNT(*) BETWEEN 2 AND 5 THEN '2-5 generations'
      WHEN COUNT(*) BETWEEN 6 AND 10 THEN '6-10 generations'
      WHEN COUNT(*) BETWEEN 11 AND 20 THEN '11-20 generations'
      ELSE '20+ generations'
    END as generation_bucket
  FROM generations
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
) user_gen_counts
GROUP BY generation_bucket
ORDER BY 
  CASE generation_bucket
    WHEN '1 generation' THEN 1
    WHEN '2-5 generations' THEN 2
    WHEN '6-10 generations' THEN 3
    WHEN '11-20 generations' THEN 4
    ELSE 5
  END;

-- 3.5 错误分析
-- 用途：识别常见的失败原因
SELECT 
  error_message,
  COUNT(*) as occurrence_count,
  COUNT(DISTINCT user_id) as affected_users,
  MAX(created_at) as last_occurrence
FROM generations
WHERE status = 'failed'
  AND created_at >= NOW() - INTERVAL '30 days'
  AND error_message IS NOT NULL
GROUP BY error_message
ORDER BY occurrence_count DESC
LIMIT 10;

-- ========================================
-- 第4部分：Credits分析
-- ========================================

-- 4.1 Credits消耗趋势（最近30天）
-- 用途：监控系统Credits使用情况
SELECT 
  DATE(created_at) as date,
  COUNT(*) as daily_generations,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_credits_consumed
FROM generations
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND status = 'succeeded'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 4.2 用户Credits余额分布
-- 用途：了解用户Credits状态
SELECT 
  CASE 
    WHEN credits = 0 THEN '0 (需要充值)'
    WHEN credits BETWEEN 1 AND 5 THEN '1-5 (即将用完)'
    WHEN credits BETWEEN 6 AND 10 THEN '6-10 (低库存)'
    WHEN credits BETWEEN 11 AND 50 THEN '11-50 (正常)'
    ELSE '50+ (高余额)'
  END as credit_range,
  COUNT(*) as user_count,
  ROUND(AVG(credits), 2) as avg_credits
FROM profiles
GROUP BY 
  CASE 
    WHEN credits = 0 THEN '0 (需要充值)'
    WHEN credits BETWEEN 1 AND 5 THEN '1-5 (即将用完)'
    WHEN credits BETWEEN 6 AND 10 THEN '6-10 (低库存)'
    WHEN credits BETWEEN 11 AND 50 THEN '11-50 (正常)'
    ELSE '50+ (高余额)'
  END
ORDER BY 
  CASE credit_range
    WHEN '0 (需要充值)' THEN 1
    WHEN '1-5 (即将用完)' THEN 2
    WHEN '6-10 (低库存)' THEN 3
    WHEN '11-50 (正常)' THEN 4
    ELSE 5
  END;

-- 4.3 Top消费用户（最近30天）
-- 用途：识别高价值用户
SELECT 
  p.id as user_id,
  p.email,
  COUNT(g.id) as total_generations,
  p.credits as current_credits,
  COUNT(g.id) as total_consumed
FROM profiles p
LEFT JOIN generations g ON p.id = g.user_id AND g.created_at >= NOW() - INTERVAL '30 days' AND g.status = 'succeeded'
GROUP BY p.id, p.email, p.credits
ORDER BY total_consumed DESC
LIMIT 20;

-- 4.4 免费 vs 付费用户比例
-- 用途：了解用户付费转化
-- 注意：需要根据实际的付费标识字段调整
SELECT 
  CASE 
    WHEN credits > 10 OR metadata->>'has_purchased' = 'true' THEN '付费用户'
    ELSE '免费用户'
  END as user_type,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM profiles)::numeric * 100, 2) as percentage
FROM profiles
GROUP BY 
  CASE 
    WHEN credits > 10 OR metadata->>'has_purchased' = 'true' THEN '付费用户'
    ELSE '免费用户'
  END;

-- ========================================
-- 第5部分：Waitlist分析
-- ========================================

-- 5.1 Waitlist总览
-- 用途：快速查看waitlist状态
-- 注意：需要根据实际的waitlist表结构调整
-- 如果使用profiles表，可以使用以下查询：
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7_days,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30_days,
  COUNT(*) FILTER (WHERE credits = 3) as new_users_with_initial_credits,
  COUNT(*) FILTER (WHERE credits = 0) as users_need_recharge
FROM profiles;

-- 5.2 用户注册趋势（最近30天）
-- 用途：观察用户增长曲线
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as cumulative_users
FROM profiles
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 5.3 用户来源分析
-- 用途：了解用户获取渠道
-- 注意：需要在profiles表中添加source字段或使用metadata
SELECT 
  COALESCE(metadata->>'source', 'direct') as source,
  COUNT(*) as user_count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM profiles WHERE created_at >= NOW() - INTERVAL '30 days')::numeric * 100, 2) as percentage
FROM profiles
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY metadata->>'source'
ORDER BY user_count DESC;

-- 5.4 用户激活率
-- 用途：有多少注册用户实际使用了系统？
SELECT 
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT g.user_id) as activated_users,
  ROUND(COUNT(DISTINCT g.user_id)::numeric / COUNT(DISTINCT p.id)::numeric * 100, 2) as activation_rate
FROM profiles p
LEFT JOIN generations g ON p.id = g.user_id
WHERE p.created_at >= NOW() - INTERVAL '30 days';

-- 5.5 用户留存分析（简化版）
-- 用途：用户是否持续使用系统？
WITH user_cohorts AS (
  SELECT 
    user_id,
    DATE(MIN(created_at)) as first_generation_date,
    COUNT(*) as total_generations,
    MAX(DATE(created_at)) as last_generation_date
  FROM generations
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
)
SELECT 
  CASE 
    WHEN last_generation_date = CURRENT_DATE THEN 'Active today'
    WHEN last_generation_date >= CURRENT_DATE - INTERVAL '3 days' THEN 'Active this week'
    WHEN last_generation_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'Active last week'
    WHEN last_generation_date >= CURRENT_DATE - INTERVAL '14 days' THEN 'Active 2 weeks ago'
    ELSE 'Inactive 14+ days'
  END as activity_status,
  COUNT(*) as user_count
FROM user_cohorts
GROUP BY 
  CASE 
    WHEN last_generation_date = CURRENT_DATE THEN 'Active today'
    WHEN last_generation_date >= CURRENT_DATE - INTERVAL '3 days' THEN 'Active this week'
    WHEN last_generation_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'Active last week'
    WHEN last_generation_date >= CURRENT_DATE - INTERVAL '14 days' THEN 'Active 2 weeks ago'
    ELSE 'Inactive 14+ days'
  END
ORDER BY 
  CASE activity_status
    WHEN 'Active today' THEN 1
    WHEN 'Active this week' THEN 2
    WHEN 'Active last week' THEN 3
    WHEN 'Active 2 weeks ago' THEN 4
    ELSE 5
  END;

-- ========================================
-- 第6部分：综合Dashboard查询
-- ========================================

-- 6.1 Dashboard关键指标（一次查询获取所有核心数据）
-- 用途：Admin Dashboard首页显示
WITH stats AS (
  SELECT
    -- 总生成数
    (SELECT COUNT(*) FROM generations) as total_generations,
    (SELECT COUNT(*) FROM generations WHERE created_at >= CURRENT_DATE) as today_generations,
    (SELECT COUNT(*) FROM generations WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_generations,
    
    -- 成功率（24小时）
    (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'succeeded')::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 2) 
     FROM generations 
     WHERE created_at >= NOW() - INTERVAL '24 hours') as success_rate_24h,
    
    -- 活跃用户（7天）
    (SELECT COUNT(DISTINCT user_id) FROM generations WHERE created_at >= NOW() - INTERVAL '7 days') as active_users_7d,
    
    -- 总用户数
    (SELECT COUNT(*) FROM profiles) as total_users,
    
    -- Credits相关
    (SELECT SUM(credits) FROM profiles) as total_credits_in_system,
    (SELECT COUNT(*) FROM profiles WHERE credits = 0) as users_need_recharge,
    
    -- 用户反馈
    (SELECT COUNT(*) FROM generations WHERE metadata->>'feedback_type' = 'love_it' AND created_at >= NOW() - INTERVAL '7 days') as love_it_count_7d,
    (SELECT COUNT(*) FROM generations WHERE metadata->>'feedback_type' = 'not_quite' AND created_at >= NOW() - INTERVAL '7 days') as not_quite_count_7d,
    
    -- 被过滤特征
    (SELECT COUNT(*) FROM filtered_features_log WHERE created_at >= NOW() - INTERVAL '7 days') as filtered_features_7d
)
SELECT * FROM stats;

-- ========================================
-- 第7部分：性能监控查询
-- ========================================

-- 7.1 慢查询分析（Qwen响应时间）
-- 用途：识别性能瓶颈
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))), 2) as avg_duration_seconds,
  ROUND(MIN(EXTRACT(EPOCH FROM (updated_at - created_at))), 2) as min_duration,
  ROUND(MAX(EXTRACT(EPOCH FROM (updated_at - created_at))), 2) as max_duration,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (updated_at - created_at))) as p95_duration
FROM generations
WHERE status = 'succeeded'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 7.2 存储使用分析
-- 用途：监控存储空间
SELECT 
  COUNT(*) as total_images,
  COUNT(DISTINCT user_id) as users_with_images,
  ROUND(AVG(LENGTH(output_url::text)), 2) as avg_url_length,
  COUNT(*) FILTER (WHERE output_storage_path IS NOT NULL) as images_with_storage_path
FROM generations
WHERE status = 'succeeded';

-- ========================================
-- 使用说明
-- ========================================
-- 
-- 1. 时间范围调整：
--    将 "NOW() - INTERVAL '30 days'" 改为所需的时间范围
--    例如：'7 days', '90 days', '1 year'
--
-- 2. 结果限制：
--    添加或修改 LIMIT 子句来控制返回的行数
--
-- 3. 导出结果：
--    在Supabase SQL Editor中，点击"Download CSV"导出结果
--
-- 4. 定时执行：
--    可以使用Supabase的Cron Jobs功能定时运行这些查询
--
-- 5. API集成：
--    这些查询可以通过API路由封装，供Admin Dashboard调用
--
-- ========================================
