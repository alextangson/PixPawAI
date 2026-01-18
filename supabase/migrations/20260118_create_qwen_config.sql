-- Create qwen_config table for AI model configuration

CREATE TABLE IF NOT EXISTS qwen_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temperature NUMERIC(3, 2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1),
  max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens > 0),
  top_p NUMERIC(3, 2) DEFAULT 0.9 CHECK (top_p >= 0 AND top_p <= 1),
  system_prompt TEXT NOT NULL DEFAULT 'You are a pet image analysis expert. Analyze the pet in the image and provide detailed, accurate information.',
  features JSONB DEFAULT '{
    "heterochromia_detection": true,
    "breed_recognition": true,
    "pattern_analysis": true,
    "multiple_pets": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE qwen_config ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access (for generation API)
CREATE POLICY "Public can read qwen config" ON qwen_config
FOR SELECT USING (true);

-- Policy: Only admins can update
CREATE POLICY "Admins can manage qwen config" ON qwen_config
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Insert default configuration
INSERT INTO qwen_config (
  temperature,
  max_tokens,
  top_p,
  system_prompt,
  features
) VALUES (
  0.7,
  1000,
  0.9,
  'You are a pet image analysis expert. Your task is to analyze pet images and provide detailed, accurate information about the pet''s appearance, breed, colors, patterns, and notable features.',
  '{
    "heterochromia_detection": true,
    "breed_recognition": true,
    "pattern_analysis": true,
    "multiple_pets": false
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_qwen_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_qwen_config_updated_at
BEFORE UPDATE ON qwen_config
FOR EACH ROW
EXECUTE FUNCTION update_qwen_config_updated_at();
