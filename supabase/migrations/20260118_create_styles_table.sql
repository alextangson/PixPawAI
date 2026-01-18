/**
 * 创建 styles 表用于动态管理风格库
 * 
 * 功能：
 * - 存储所有可用的图片风格
 * - 支持动态启用/禁用
 * - 支持排序和预览图
 * - 支持 promptSuffix 和 basePrompt
 */

-- 创建 styles 表
CREATE TABLE IF NOT EXISTS styles (
  id TEXT PRIMARY KEY,  -- 风格唯一标识（如 'Watercolor-Dream'）
  name TEXT NOT NULL,  -- 显示名称（如 'Watercolor Dream'）
  display_name TEXT,  -- 多语言显示名称（可选）
  emoji TEXT,  -- emoji图标（可选）
  
  -- 提示词配置
  base_prompt TEXT,  -- 基础提示词（低优先级）
  prompt_suffix TEXT NOT NULL,  -- 后缀提示词（高优先级，必需）
  negative_prompt TEXT,  -- 负面提示词
  
  -- 风格特征
  tags TEXT[],  -- 标签（用于搜索和分类）
  category TEXT,  -- 分类（如 'artistic', '3d', 'realistic'）
  
  -- 生成参数建议
  recommended_strength_min DECIMAL(3,2) DEFAULT 0.85,  -- 推荐的最小 strength
  recommended_strength_max DECIMAL(3,2) DEFAULT 0.95,  -- 推荐的最大 strength
  recommended_guidance DECIMAL(3,1) DEFAULT 3.5,  -- 推荐的 guidance
  
  -- 预览图
  preview_image_url TEXT,  -- 预览图URL
  example_image_url TEXT,  -- 示例图URL
  
  -- 元数据
  description TEXT,  -- 风格描述
  sort_order INTEGER DEFAULT 0,  -- 排序顺序（越小越靠前）
  is_enabled BOOLEAN DEFAULT true,  -- 是否启用
  is_premium BOOLEAN DEFAULT false,  -- 是否为高级风格
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),  -- 创建者
  
  -- 统计数据
  usage_count INTEGER DEFAULT 0,  -- 使用次数
  success_rate DECIMAL(5,2),  -- 成功率
  
  CONSTRAINT styles_name_unique UNIQUE(name)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_styles_enabled ON styles(is_enabled);
CREATE INDEX IF NOT EXISTS idx_styles_sort_order ON styles(sort_order);
CREATE INDEX IF NOT EXISTS idx_styles_category ON styles(category);
CREATE INDEX IF NOT EXISTS idx_styles_usage_count ON styles(usage_count DESC);

-- 添加RLS策略
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看启用的风格
CREATE POLICY "Public can view enabled styles"
  ON styles
  FOR SELECT
  USING (is_enabled = true);

-- 管理员可以查看所有风格
CREATE POLICY "Admin can view all styles"
  ON styles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 管理员可以增删改风格
CREATE POLICY "Admin can manage styles"
  ON styles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_styles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER styles_updated_at_trigger
  BEFORE UPDATE ON styles
  FOR EACH ROW
  EXECUTE FUNCTION update_styles_updated_at();

-- 插入现有的风格数据（从 lib/styles.ts 迁移）
INSERT INTO styles (id, name, emoji, prompt_suffix, category, description, sort_order, is_enabled) VALUES
  ('Watercolor-Dream', 'Watercolor Dream', '🎨', 'watercolor painting style, soft colors, dreamy atmosphere, artistic brushstrokes', 'artistic', 'Soft watercolor art with dreamy vibes', 1, true),
  ('Disney-Magic', 'Disney Magic', '✨', '3D Disney Pixar style, vibrant colors, expressive eyes, cute and charming', '3d', 'Classic Disney/Pixar 3D animation style', 2, true),
  ('Oil-Painting', 'Oil Painting', '🖼️', 'oil painting style, rich colors, textured brushwork, classical art', 'artistic', 'Traditional oil painting with rich textures', 3, true),
  ('Anime-Style', 'Anime Style', '🌸', 'anime art style, big expressive eyes, colorful hair, Japanese animation', 'artistic', 'Japanese anime/manga art style', 4, true),
  ('Cartoon-Pop', 'Cartoon Pop', '🎪', 'cartoon style, bold outlines, vibrant colors, playful and fun', 'artistic', 'Bold cartoon style with pop art elements', 5, true),
  ('3D-Render', '3D Render', '🎬', '3D rendered, smooth surfaces, professional lighting, highly detailed', '3d', 'Photorealistic 3D rendering', 6, true),
  ('Vintage-Photo', 'Vintage Photo', '📷', 'vintage photograph, sepia tone, nostalgic feel, film grain', 'photo', 'Classic vintage photography style', 7, true),
  ('Cyberpunk', 'Cyberpunk', '🌃', 'cyberpunk style, neon lights, futuristic, dark and moody', 'futuristic', 'Sci-fi cyberpunk aesthetic', 8, true),
  ('Fantasy-Art', 'Fantasy Art', '🧙', 'fantasy art style, magical atmosphere, detailed background, epic', 'artistic', 'Epic fantasy illustration', 9, true),
  ('Minimalist', 'Minimalist', '⚪', 'minimalist style, simple shapes, clean lines, limited colors', 'modern', 'Clean and simple minimalist design', 10, true),
  ('Surreal-Dream', 'Surreal Dream', '🌀', 'surreal art style, dreamlike, imaginative, unexpected elements', 'artistic', 'Surrealist art with dreamlike quality', 11, true),
  ('Pop-Art', 'Pop Art', '💥', 'pop art style, bold colors, comic book aesthetic, halftone dots', 'artistic', 'Vibrant pop art inspired by Warhol', 12, true),
  ('Sketch-Drawing', 'Sketch Drawing', '✏️', 'pencil sketch style, hand-drawn, artistic lines, shading', 'artistic', 'Hand-drawn pencil sketch', 13, true),
  ('Stained-Glass', 'Stained Glass', '🪟', 'stained glass window style, colorful glass pieces, medieval art', 'artistic', 'Medieval stained glass art', 14, true),
  ('Origami', 'Origami', '📃', 'origami paper craft style, folded paper, geometric shapes', 'craft', 'Japanese paper folding art', 15, true)
ON CONFLICT (id) DO NOTHING;

-- 添加注释
COMMENT ON TABLE styles IS '风格库表 - 存储所有可用的图片生成风格';
COMMENT ON COLUMN styles.id IS '风格唯一标识';
COMMENT ON COLUMN styles.prompt_suffix IS '高优先级提示词后缀（最重要）';
COMMENT ON COLUMN styles.base_prompt IS '低优先级基础提示词';
COMMENT ON COLUMN styles.recommended_strength_min IS '推荐的 strength 最小值 (0-1)';
COMMENT ON COLUMN styles.sort_order IS '排序顺序，数字越小越靠前';
