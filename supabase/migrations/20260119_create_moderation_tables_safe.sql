-- ============================================
-- Content Moderation System (Safe Version)
-- ============================================
-- 使用 IF NOT EXISTS 避免重复创建错误
-- Created: 2026-01-19

\echo '开始安装/更新内容审核系统...'

-- ============================================
-- 1. Moderation Logs Table
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'moderation_logs') THEN
    CREATE TABLE moderation_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      violation_type text NOT NULL CHECK (violation_type IN ('nsfw_image', 'sensitive_prompt', 'user_report', 'gore', 'hate', 'violence')),
      image_url text,
      prompt text,
      unsafe_reason text,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamp with time zone DEFAULT now()
    );
    RAISE NOTICE '✅ 创建表: moderation_logs';
  ELSE
    RAISE NOTICE '⏭️  表已存在: moderation_logs';
  END IF;
END $$;

-- 创建索引（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_moderation_user_created') THEN
    CREATE INDEX idx_moderation_user_created ON moderation_logs(user_id, created_at DESC);
    RAISE NOTICE '✅ 创建索引: idx_moderation_user_created';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_moderation_type') THEN
    CREATE INDEX idx_moderation_type ON moderation_logs(violation_type, created_at DESC);
    RAISE NOTICE '✅ 创建索引: idx_moderation_type';
  END IF;
END $$;

-- ============================================
-- 2. User Reports Table
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_reports') THEN
    CREATE TABLE user_reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      generation_id uuid REFERENCES generations(id) ON DELETE CASCADE,
      reason text NOT NULL,
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'action_taken', 'dismissed')),
      admin_notes text,
      reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      reviewed_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now()
    );
    RAISE NOTICE '✅ 创建表: user_reports';
  ELSE
    RAISE NOTICE '⏭️  表已存在: user_reports';
  END IF;
END $$;

-- 创建索引
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_reports_status') THEN
    CREATE INDEX idx_reports_status ON user_reports(status, created_at DESC);
    RAISE NOTICE '✅ 创建索引: idx_reports_status';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_reports_generation') THEN
    CREATE INDEX idx_reports_generation ON user_reports(generation_id);
    RAISE NOTICE '✅ 创建索引: idx_reports_generation';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_reports_reporter') THEN
    CREATE INDEX idx_reports_reporter ON user_reports(reporter_id, created_at DESC);
    RAISE NOTICE '✅ 创建索引: idx_reports_reporter';
  END IF;
END $$;

-- ============================================
-- 3. User Bans Table
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_bans') THEN
    CREATE TABLE user_bans (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
      ban_type text NOT NULL CHECK (ban_type IN ('warning', 'cooldown', 'permanent')),
      reason text NOT NULL,
      expires_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now(),
      created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
    );
    RAISE NOTICE '✅ 创建表: user_bans';
  ELSE
    RAISE NOTICE '⏭️  表已存在: user_bans';
  END IF;
END $$;

-- 创建索引
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_bans_user_active') THEN
    CREATE INDEX idx_bans_user_active ON user_bans(user_id, expires_at);
    RAISE NOTICE '✅ 创建索引: idx_bans_user_active';
  END IF;
END $$;

-- ============================================
-- 4. Helper Functions
-- ============================================

CREATE OR REPLACE FUNCTION get_user_violation_count(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  violation_count integer;
BEGIN
  SELECT COUNT(*)
  INTO violation_count
  FROM moderation_logs
  WHERE user_id = user_uuid
    AND created_at >= now() - interval '30 days';
  
  RETURN COALESCE(violation_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION is_user_banned(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_banned boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM user_bans
    WHERE user_id = user_uuid
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO is_banned;
  
  RETURN COALESCE(is_banned, false);
END;
$$;

CREATE OR REPLACE FUNCTION log_violation(
  p_user_id uuid,
  p_violation_type text,
  p_image_url text DEFAULT NULL,
  p_prompt text DEFAULT NULL,
  p_unsafe_reason text DEFAULT 'none',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO moderation_logs (
    user_id,
    violation_type,
    image_url,
    prompt,
    unsafe_reason,
    metadata
  ) VALUES (
    p_user_id,
    p_violation_type,
    p_image_url,
    p_prompt,
    p_unsafe_reason,
    p_metadata
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

RAISE NOTICE '✅ 创建/更新函数完成';

-- ============================================
-- 5. Row Level Security (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略（避免重复）
DROP POLICY IF EXISTS "Admins can view all moderation logs" ON moderation_logs;
DROP POLICY IF EXISTS "Service role can insert moderation logs" ON moderation_logs;
DROP POLICY IF EXISTS "Users can view their own reports" ON user_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON user_reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON user_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON user_reports;
DROP POLICY IF EXISTS "Users can view their own ban status" ON user_bans;
DROP POLICY IF EXISTS "Admins can view all bans" ON user_bans;
DROP POLICY IF EXISTS "Admins can manage bans" ON user_bans;

-- 重新创建策略
CREATE POLICY "Admins can view all moderation logs"
  ON moderation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert moderation logs"
  ON moderation_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own reports"
  ON user_reports
  FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports"
  ON user_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create reports"
  ON user_reports
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND reporter_id = auth.uid());

CREATE POLICY "Admins can update reports"
  ON user_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own ban status"
  ON user_bans
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all bans"
  ON user_bans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage bans"
  ON user_bans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

RAISE NOTICE '✅ RLS 策略配置完成';

-- ============================================
-- 6. Grant Permissions
-- ============================================

GRANT ALL ON moderation_logs TO service_role;
GRANT ALL ON user_reports TO service_role;
GRANT ALL ON user_bans TO service_role;
GRANT SELECT, INSERT ON user_reports TO authenticated;
GRANT SELECT ON user_bans TO authenticated;

RAISE NOTICE '✅ 权限授予完成';

-- ============================================
-- 完成
-- ============================================

\echo ''
\echo '=========================================='
\echo '✅ 内容审核系统安装/更新完成！'
\echo '=========================================='
\echo ''
\echo '验证安装：'
\echo '  SELECT * FROM moderation_logs LIMIT 1;'
\echo '  SELECT * FROM user_reports LIMIT 1;'
\echo '  SELECT * FROM user_bans LIMIT 1;'
\echo ''
