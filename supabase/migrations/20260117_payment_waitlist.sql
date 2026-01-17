-- 创建支付等待列表表
CREATE TABLE IF NOT EXISTS payment_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'pro', 'master')),
  price TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  
  -- 状态追踪
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- 防止重复提交（同一邮箱+套餐组合）
  UNIQUE(email, tier)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_payment_waitlist_email ON payment_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_payment_waitlist_tier ON payment_waitlist(tier);
CREATE INDEX IF NOT EXISTS idx_payment_waitlist_created_at ON payment_waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_waitlist_notified ON payment_waitlist(notified) WHERE notified = false;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_payment_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_waitlist_updated_at
  BEFORE UPDATE ON payment_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_waitlist_updated_at();

-- RLS策略：允许匿名插入（用于收集邮箱），但不允许读取
ALTER TABLE payment_waitlist ENABLE ROW LEVEL SECURITY;

-- 允许任何人插入（匿名用户也可以）
CREATE POLICY "Anyone can submit to waitlist"
  ON payment_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 只有服务角色可以查看和更新
CREATE POLICY "Service role can do everything"
  ON payment_waitlist
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 用户可以查看自己提交的记录
CREATE POLICY "Users can view their own submissions"
  ON payment_waitlist
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 添加注释
COMMENT ON TABLE payment_waitlist IS '支付功能上线前的等待列表 - 收集感兴趣用户的邮箱';
COMMENT ON COLUMN payment_waitlist.email IS '用户邮箱';
COMMENT ON COLUMN payment_waitlist.tier IS '用户选择的套餐：starter, pro, master';
COMMENT ON COLUMN payment_waitlist.price IS '用户看到的价格（用于分析）';
COMMENT ON COLUMN payment_waitlist.notified IS '是否已通知用户支付功能上线';
COMMENT ON COLUMN payment_waitlist.converted IS '用户是否已完成购买（上线后追踪转化率）';
