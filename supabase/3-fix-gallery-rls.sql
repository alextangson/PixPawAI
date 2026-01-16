-- ============================================
-- 修复 Gallery RLS 策略
-- 确保公开的生成记录可以被所有人查看
-- ============================================

-- 删除旧的策略
DROP POLICY IF EXISTS "Public generations are viewable by everyone" ON public.generations;

-- 创建新的公开查看策略
CREATE POLICY "Public generations are viewable by everyone"
ON public.generations
FOR SELECT
USING (
  is_public = true 
  AND status = 'succeeded' 
  AND output_url IS NOT NULL
);

-- 确保用户可以查看自己的所有记录
DROP POLICY IF EXISTS "Users can view their own generations" ON public.generations;

CREATE POLICY "Users can view their own generations"
ON public.generations
FOR SELECT
USING (auth.uid() = user_id);

-- 显示完成信息
DO $$
BEGIN
  RAISE NOTICE '✅ Gallery RLS policies updated successfully!';
END $$;
