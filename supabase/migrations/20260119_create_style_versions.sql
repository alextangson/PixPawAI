-- Create style_versions table for version history management
-- This allows rolling back to previous style configurations

CREATE TABLE IF NOT EXISTS style_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  style_id TEXT NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  
  -- Style parameter snapshot
  prompt_suffix TEXT NOT NULL,
  negative_prompt TEXT,
  recommended_strength_min DECIMAL(3,2),
  recommended_strength_max DECIMAL(3,2),
  recommended_guidance DECIMAL(3,1),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT, -- Optional: track who made the change
  notes TEXT, -- Optional: version notes/changelog
  
  -- Ensure unique version numbers per style
  UNIQUE(style_id, version_number)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_style_versions_style_id ON style_versions(style_id);
CREATE INDEX IF NOT EXISTS idx_style_versions_created_at ON style_versions(created_at DESC);

-- Add comments
COMMENT ON TABLE style_versions IS 'Stores historical versions of style configurations for rollback capability';
COMMENT ON COLUMN style_versions.version_number IS 'Incremental version number, starting from 1';
COMMENT ON COLUMN style_versions.notes IS 'Optional changelog or notes about what changed in this version';
COMMENT ON COLUMN style_versions.created_by IS 'User ID who created this version (optional)';

-- Enable RLS
ALTER TABLE style_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can view and manage versions
CREATE POLICY "Admins can view all versions"
  ON style_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert versions"
  ON style_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Note: We don't allow DELETE or UPDATE on versions - they're immutable history
