-- ============================================
-- 更新 Birthday Party 风格
-- 改进：更喜庆的背景 + 更开心的表情
-- ============================================

UPDATE styles SET
  prompt_suffix = ', celebrating a joyful birthday party, wearing a vibrant rainbow-colored striped party hat, sweet cheerful expression with closed mouth, happy eyes, sitting behind a delicious birthday cake with colorful candles, WARM FESTIVE PARTY BACKGROUND with pink yellow and orange balloons, golden confetti, warm-toned streamers, pastel gift boxes, soft fairy lights, WARM COLOR PALETTE throughout, cozy cheerful atmosphere, soft warm lighting, joyful celebration photography, 8k resolution',
  
  negative_prompt = 'wide open mouth, laughing, grinning, showing teeth, tongue out, tongue sticking out, big smile, scary expression, cold colors, blue background, purple background, dark tones, grey tones, sad face, serious expression, plain background, minimalist, blurry, low quality',
  
  description = 'Warm cheerful birthday - gentle smile, party hat, cake, festive decor',
  
  updated_at = now()
  
WHERE id = 'Birthday-Party';

-- 验证更新
SELECT 
  id,
  name,
  '✅ Updated' as status,
  LEFT(prompt_suffix, 100) || '...' as new_prompt_preview,
  negative_prompt as new_negative
FROM styles
WHERE id = 'Birthday-Party';
