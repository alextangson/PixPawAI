-- ============================================
-- Content Moderation System (Web Safe Version)
-- ============================================
-- 可以直接在 Supabase Dashboard SQL Editor 运行
-- 使用 IF NOT EXISTS 避免重复创建错误
-- Created: 2026-01-19

-- ============================================
-- 1. Moderation Logs Table
-- ============================================

CREATE TABLE IF NOT EXISTS moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_type text NOT NULL CHECK (violation_type IN ('nsfw_image', 'sensitive_prompt', 'user_report', 'gore', 'hate', 'violence')),
  image_url text,
  prompt text,
  unsafe_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE moderation_logs IS 'Tracks all content policy violations for audit and progressive penalties';
COMMENT ON COLUMN moderation_logs.violation_type IS 'Type of violation: nsfw_image, sensitive_prompt, user_report, gore, hate, violence';
COMMENT ON COLUMN moderation_logs.unsafe_reason IS 'Specific reason from AI detection: nudity, gore, hate, violence';
COMMENT ON COLUMN moderation_logs.metadata IS 'Additional context like IP address, user agent, generation_id';

-- 创建索引
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_moderation_user_created') THEN
    CREATE INDEX idx_moderation_user_created ON moderation_logs(user_id, created_at DESC);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_moderation_type') THEN
    CREATE INDEX idx_moderation_type ON moderation_logs(violation_type, created_at DESC);
  END IF;
END $$;

-- ============================================
-- 2. User Reports Table
-- ============================================

CREATE TABLE IF NOT EXISTS user_reports (
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

COMMENT ON TABLE user_reports IS 'User-submitted reports of inappropriate content in public gallery';
COMMENT ON COLUMN user_reports.status IS 'Report status: pending, reviewing, action_taken, dismissed';
COMMENT ON COLUMN user_reports.admin_notes IS 'Internal notes from moderator review';

-- 创建索引
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reports_status') THEN
    CREATE INDEX idx_reports_status ON user_reports(status, created_at DESC);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reports_generation') THEN
    CREATE INDEX idx_reports_generation ON user_reports(generation_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reports_reporter') THEN
    CREATE INDEX idx_reports_reporter ON user_reports(reporter_id, created_at DESC);
  END IF;
END $$;

-- ============================================
-- 3. User Bans Table
-- ============================================

CREATE TABLE IF NOT EXISTS user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  ban_type text NOT NULL CHECK (ban_type IN ('warning', 'cooldown', 'permanent')),
  reason text NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE user_bans IS 'Tracks user bans and cooldowns for content policy violations';
COMMENT ON COLUMN user_bans.ban_type IS 'warning (first offense), cooldown (24h), permanent (6+ violations)';
COMMENT ON COLUMN user_bans.expires_at IS 'When ban expires (NULL = permanent)';

-- 创建索引
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bans_user_active') THEN
    CREATE INDEX idx_bans_user_active ON user_bans(user_id, expires_at);
  END IF;
END $$;

-- ============================================
-- 4. Helper Functions
-- ============================================

-- Function: Get user violation count in last 30 days
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

COMMENT ON FUNCTION get_user_violation_count IS 'Returns number of violations by user in last 30 days';

-- Function: Check if user is currently banned
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

COMMENT ON FUNCTION is_user_banned IS 'Returns true if user has an active ban or cooldown';

-- Function: Log a violation
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

COMMENT ON FUNCTION log_violation IS 'Logs a content policy violation to moderation_logs';

-- ============================================
-- 5. Row Level Security (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Admins can view all moderation logs" ON moderation_logs;
DROP POLICY IF EXISTS "Service role can insert moderation logs" ON moderation_logs;
DROP POLICY IF EXISTS "Users can view their own reports" ON user_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON user_reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON user_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON user_reports;
DROP POLICY IF EXISTS "Users can view their own ban status" ON user_bans;
DROP POLICY IF EXISTS "Admins can view all bans" ON user_bans;
DROP POLICY IF EXISTS "Admins can manage bans" ON user_bans;

-- 创建策略
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

-- ============================================
-- 6. Grant Permissions
-- ============================================

GRANT ALL ON moderation_logs TO service_role;
GRANT ALL ON user_reports TO service_role;
GRANT ALL ON user_bans TO service_role;
GRANT SELECT, INSERT ON user_reports TO authenticated;
GRANT SELECT ON user_bans TO authenticated;

-- ============================================
-- 完成 - 验证安装
-- ============================================

SELECT '✅ 内容审核系统安装完成！' as status;

-- 验证表
SELECT 
  'Tables Created' as check_type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('moderation_logs', 'user_reports', 'user_bans');

-- 验证函数
SELECT 
  'Functions Created' as check_type,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_user_violation_count', 'is_user_banned', 'log_violation');

-- 验证RLS
SELECT 
  'RLS Policies Created' as check_type,
  COUNT(*) as count
FROM pg_policies
WHERE tablename IN ('moderation_logs', 'user_reports', 'user_bans');
