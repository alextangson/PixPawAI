-- Create generation_feedback table for user satisfaction data
CREATE TABLE IF NOT EXISTS generation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reasons TEXT[] NOT NULL, -- ['wrong_style', 'pet_likeness', 'quality', 'colors']
  action_taken TEXT NOT NULL, -- 'try_different_style', 'adjust_strength', etc.
  style TEXT,
  strength NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for analytics queries
CREATE INDEX idx_feedback_generation ON generation_feedback(generation_id);
CREATE INDEX idx_feedback_action ON generation_feedback(action_taken);
CREATE INDEX idx_feedback_created ON generation_feedback(created_at);

-- Enable RLS
ALTER TABLE generation_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own feedback"
  ON generation_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can read all feedback"
  ON generation_feedback FOR SELECT
  USING (auth.role() = 'service_role');
