-- ============================================
-- API Error Logs Table
-- Purpose: Track API errors for debugging and monitoring
-- Created: 2026-01-21
-- ============================================

CREATE TABLE IF NOT EXISTS api_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- API Information
  api_endpoint TEXT NOT NULL, -- e.g., '/api/check-quality', '/api/generate'
  error_type TEXT NOT NULL, -- 'qwen_api_error', 'replicate_api_error', 'validation_error', etc.
  error_message TEXT NOT NULL,
  http_status INTEGER, -- HTTP status code if applicable
  
  -- Request Context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_url TEXT, -- Truncated for privacy
  request_body JSONB, -- Request data (sanitized)
  
  -- Error Details
  error_details JSONB DEFAULT '{}'::jsonb, -- Full error object, stack trace, etc.
  response_body TEXT, -- API response if available (truncated)
  
  -- Metadata
  user_agent TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb -- Additional context
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_api_error_logs_endpoint ON api_error_logs(api_endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_error_logs_error_type ON api_error_logs(error_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_error_logs_user_id ON api_error_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_error_logs_created_at ON api_error_logs(created_at DESC);

-- Add comments
COMMENT ON TABLE api_error_logs IS 'Tracks API errors for debugging and monitoring';
COMMENT ON COLUMN api_error_logs.api_endpoint IS 'API endpoint where error occurred';
COMMENT ON COLUMN api_error_logs.error_type IS 'Type of error: qwen_api_error, replicate_api_error, validation_error, etc.';
COMMENT ON COLUMN api_error_logs.error_message IS 'Human-readable error message';
COMMENT ON COLUMN api_error_logs.error_details IS 'Full error object with stack trace and additional details';
COMMENT ON COLUMN api_error_logs.request_body IS 'Request body data (sanitized, no sensitive info)';

-- Enable RLS (Row Level Security)
ALTER TABLE api_error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view error logs
CREATE POLICY "Admins can view error logs" ON api_error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Service role can insert (for API routes)
CREATE POLICY "Service can insert error logs" ON api_error_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Authenticated users can insert their own errors (for client-side errors)
CREATE POLICY "Users can insert their own error logs" ON api_error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
