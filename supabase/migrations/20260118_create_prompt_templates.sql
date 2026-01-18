-- Create prompt_templates table for managing prompt templates

CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('base', 'style_suffix', 'negative')),
  template TEXT NOT NULL,
  description TEXT,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names like ["petType", "breed"]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access (for generation API)
CREATE POLICY "Public can read active prompt templates" ON prompt_templates
FOR SELECT USING (is_active = true);

-- Policy: Only admins can insert/update/delete
CREATE POLICY "Admins can manage prompt templates" ON prompt_templates
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active ON prompt_templates(is_active);

-- Insert default prompt templates
INSERT INTO prompt_templates (name, category, template, description, variables) VALUES
('Default Base Prompt', 'base', 'A {petType}, {breed}, with {detectedColors}', 'Basic pet description template', '["petType", "breed", "detectedColors"]'::jsonb),
('High Quality Suffix', 'style_suffix', 'masterpiece, best quality, highly detailed, professional photography', 'Quality enhancing suffix', '[]'::jsonb),
('Standard Negative Prompt', 'negative', 'blurry, low quality, distorted, deformed, disfigured, bad anatomy, ugly, duplicate, mutation', 'Standard negative prompt to avoid', '[]'::jsonb)
ON CONFLICT DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prompt_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_prompt_templates_updated_at
BEFORE UPDATE ON prompt_templates
FOR EACH ROW
EXECUTE FUNCTION update_prompt_templates_updated_at();
