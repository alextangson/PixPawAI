# 💎 Credits 策略建议

## 当前配置
- **新用户注册**: 2 免费 credits
- **每次生成消耗**: 1 credit

---

## 🎯 建议的 Credits 配置方案

### 方案 A: 保守型（当前）
```
新用户: 2 credits
理由: 
✅ 让用户体验产品
✅ 控制初期成本
❌ 可能不够用户充分体验
```

**适合场景**: 
- MVP 测试阶段
- 需要严格控制成本
- AI API 成本较高

---

### 方案 B: 平衡型 ⭐ **推荐**
```
新用户: 5 credits
理由:
✅ 足够用户测试多个风格
✅ 提高转化率
✅ 用户有充分时间评估产品
✅ 成本可控
```

**适合场景**:
- 正式上线
- 想要提高用户留存
- 有一定预算

**成本分析**:
- 假设 Replicate Flux 成本: ~$0.03/张
- 5 credits = $0.15/用户
- 如果 10% 转化付费 → ROI 正向

---

### 方案 C: 激进型
```
新用户: 10 credits
理由:
✅ 用户可以充分探索所有功能
✅ 最高转化率
✅ 强大的市场竞争力
❌ 较高成本
```

**适合场景**:
- 有充足资金
- 需要快速获客
- 竞争激烈的市场

---

## 📊 竞品对比

| 产品 | 免费 Credits | 策略 |
|------|-------------|------|
| **PhotoAI** | 3-5 张 | 平衡型 |
| **PetPicture.AI** | 2 张 | 保守型 |
| **Aragon.ai** | 1 次免费试用 | 极保守 |
| **PixPaw (我们)** | **2 张** | 保守型 |

---

## 💡 推荐策略

### 阶段 1: MVP 测试（现在）
```
免费: 2 credits
付费包:
- Starter: 10 credits @ $4.99
- Pro: 30 credits @ $12.99
- Ultimate: 100 credits @ $39.99
```

### 阶段 2: 正式上线
```
免费: 5 credits ⬆️
付费包: 同上
额外: 推荐好友 +2 credits
```

### 阶段 3: 增长期
```
免费: 5 credits
首次购买优惠: 50% off
月度订阅: Unlimited @ $29.99/月
```

---

## 🎁 增加 Credits 的其他方式

### 1. 邀请奖励
- 邀请 1 个好友注册 → +2 credits
- 好友首次购买 → +5 credits

### 2. 社交分享
- 分享生成结果到社交媒体 → +1 credit

### 3. 每日登录
- 连续登录 7 天 → +1 credit

### 4. 节日活动
- 新用户注册期间限时 +3 credits

### 5. Beta 测试奖励
- 早期用户永久 +10 credits

---

## 🔧 技术实现（如果要修改）

### 修改默认 Credits 数量

#### 选项 1: 修改数据库默认值

在 Supabase SQL Editor 运行：

```sql
-- 修改表默认值为 5 credits
ALTER TABLE public.profiles 
ALTER COLUMN credits SET DEFAULT 5;

-- 为现有用户补发 credits（从 2 增加到 5）
UPDATE public.profiles 
SET credits = 5 
WHERE credits = 2 AND total_generations = 0;
```

#### 选项 2: 修改触发器函数

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, credits)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    5  -- 👈 明确设置为 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎯 我的建议

### 现阶段保持 2 Credits，但是：

1. **添加推荐系统** → 邀请好友 +2 credits
2. **社交分享奖励** → 分享到 Twitter/FB +1 credit
3. **Beta 用户奖励** → 前 100 名用户 +10 credits

### 理由：
- ✅ 控制成本的同时增加病毒传播
- ✅ 用户获得更多 credits 的途径
- ✅ 提高用户参与度和留存率
- ✅ 早期用户忠诚度奖励

---

## 📊 建议监测指标

1. **转化率**: 免费用户 → 付费用户
2. **Credits 使用率**: 平均每用户使用的免费 credits
3. **用户留存**: 7天/30天留存率
4. **CAC vs LTV**: 获客成本 vs 生命周期价值

如果:
- 转化率 < 5% → 考虑增加免费 credits
- 用户用完 credits 后立即离开 → 增加免费额度
- 大部分用户只用 1 credit → 可能保持 2 就够

---

## 💬 决策问题

请回答以下问题帮助确定最佳策略：

1. **您的 AI 成本**: 每张图片大概多少钱？
   - < $0.01 → 可以给 5-10 credits
   - $0.01-0.05 → 建议 3-5 credits
   - > $0.05 → 保持 2 credits

2. **目标用户群**:
   - C 端消费者 → 多给一些（5 credits）
   - B 端企业 → 2 credits + 试用期

3. **竞争策略**:
   - 快速获客 → 多给（5-10）
   - 稳健增长 → 保持（2-3）

4. **预算情况**:
   - 充足 → 10 credits
   - 中等 → 5 credits
   - 紧张 → 2 credits

---

## ✅ 行动建议

### 立即（保持 2 Credits）
- [x] 数据库已配置为 2
- [ ] 确认所有文档统一
- [ ] 在 UI 中清晰显示

### 短期（1-2 周内）
- [ ] 实现推荐系统
- [ ] 添加社交分享奖励
- [ ] Beta 用户特殊奖励

### 中期（1 个月后）
- [ ] 根据数据决定是否调整
- [ ] A/B 测试不同 credits 数量
- [ ] 优化定价策略
