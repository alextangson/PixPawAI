# 🎨 AI生图提示词优化指南

## 📋 优化总结

### 问题诊断

#### 1. Johannes Vermeer 风格问题
**原提示词**：
```
wearing a turban headscarf and a large pearl earring, in the style of Johannes Vermeer masterpiece "Girl with a Pearl Earring", classical oil painting, soft natural window light from the left, chiaroscuro, detailed brushstrokes, rich colors, baroque art style, high quality
```

**问题分析**：
- ❌ 强制性配饰（turban, pearl earring）与宠物形态冲突
- ❌ 定向光源（from the left）导致构图失衡
- ❌ 文学化描述（"Girl with a Pearl Earring"）对AI模型无效
- ❌ Tier 3 strength=0.52过高，导致宠物特征丢失

**优化后**：
```
, portrait composition in the style of Dutch Golden Age master painting, soft diffused natural lighting from window, dramatic chiaroscuro with deep shadows and luminous highlights, classical oil painting technique with visible brushstrokes, rich warm color palette, baroque portrait aesthetic, intimate three-quarter view, dark neutral background with subtle gradation, museum quality masterpiece
```

**参数调整**：
- Strength: 0.52 → 0.45 (降低13%)
- Guidance: 2.8 → 2.5
- 预期相似度: 65-75% → 70-78%

---

#### 2. 尺寸识别问题
**原因**：提示词中缺少画面比例指导

**解决方案**：在所有提示词构建中添加 `aspectRatioGuide`
- `1:1` → "square composition"
- `3:4` → "vertical portrait composition"
- `4:3` → "horizontal landscape composition"
- `16:9` → "wide cinematic composition"
- `9:16` → "tall vertical composition"

---

## 🎯 AI生图提示词最佳实践

### 原则1️⃣：避免强制性元素冲突

**❌ 错误示范**：
```
wearing a turban headscarf  // 强制所有宠物戴头巾
white fur with pink nose    // 强制颜色，覆盖原始毛色
```

**✅ 正确示范**：
```
adorned with a lush crown of flowers on head  // 灵活的装饰，不强制形态
natural fur colors with artistic interpretation  // 保留原始特征
```

### 原则2️⃣：使用功能性描述而非具象描述

**❌ 错误示范**：
```
"Girl with a Pearl Earring" masterpiece  // AI不理解文学引用
wearing exactly a turban  // 过于具体
```

**✅ 正确示范**：
```
Dutch Golden Age master painting style  // 功能性风格描述
baroque portrait aesthetic  // 艺术流派特征
dramatic chiaroscuro lighting  // 具体技术手法
```

### 原则3️⃣：光线描述要灵活

**❌ 错误示范**：
```
soft natural window light from the left  // 固定方向，可能导致构图问题
```

**✅ 正确示范**：
```
soft diffused natural lighting from window  // 不指定方向
dramatic chiaroscuro with deep shadows and luminous highlights  // 描述效果而非来源
```

### 原则4️⃣：构图指导必不可少

**新增策略**：
```typescript
// 根据画面比例添加构图指导
const aspectRatioGuide = 
  aspectRatio === '1:1' ? 'square composition' :
  aspectRatio === '3:4' ? 'vertical portrait composition' :
  aspectRatio === '16:9' ? 'wide cinematic composition' : ...
```

**效果**：
- 提高画面构图准确性
- 减少裁切错误
- 更好的画面平衡

---

## 📊 Tier配置优化

### Tier 1-2（写实/轻艺术）
**目标**：保留85-90%宠物特征

```typescript
strength: 0.25-0.40
guidance: 2.0-2.5
策略: "Preserve exact features, apply style"
```

**提示词模板**：
```
{pet_features}, {style_elements}, {composition_guide}.
Preserve exact features from reference image.
Apply {style_name} artistic style.
```

### Tier 3（强艺术）
**目标**：平衡风格与特征 (70-78%相似度)

```typescript
strength: 0.45-0.50
guidance: 2.5-2.8
策略: "Style interpretation with feature preservation"
```

**提示词模板**：
```
{pet_features}, {artistic_style_description}, {composition_guide}.
{Style_name} style interpretation.
Based on reference image, maintain distinctive features.
```

**优化案例**：
- Johannes Vermeer: 0.52 → 0.45
- Flower-Crown: 0.54 → 0.48
- Vintage-Traveler: 0.40 → 0.38

### Tier 4（极致艺术）
**目标**：强风格化 (55-65%相似度)

```typescript
strength: 0.65-0.75
guidance: 3.5
策略: "Complete artistic transformation"
```

---

## 🔬 风格提示词解剖

### 优秀提示词结构（Johannes Vermeer 优化版）

```
1. 构图类型
   "portrait composition"
   
2. 艺术风格定位
   "in the style of Dutch Golden Age master painting"
   
3. 光线效果
   "soft diffused natural lighting from window"
   "dramatic chiaroscuro with deep shadows and luminous highlights"
   
4. 技术手法
   "classical oil painting technique with visible brushstrokes"
   
5. 色彩基调
   "rich warm color palette"
   
6. 美学特征
   "baroque portrait aesthetic"
   "intimate three-quarter view"
   
7. 背景处理
   "dark neutral background with subtle gradation"
   
8. 品质标签
   "museum quality masterpiece"
```

### 对比：写实风格（Christmas-Vibe）

```
1. 具体元素
   "wearing a fluffy red and white Santa hat"
   
2. 情绪氛围
   "festive holiday spirit, bright joyful eyes"
   
3. 背景处理
   "solid bold red background"
   
4. 摄影类型
   "high-end commercial photography"
   
5. 构图要求
   "clean composition"
   
6. 氛围描述
   "warm and cheerful atmosphere"
   
7. 技术规格
   "8k resolution"
```

**关键差异**：
- 写实风格：具体物品 + 简单直接 + 商业摄影术语
- 艺术风格：艺术流派 + 技术手法 + 光影氛围描述

---

## 🧪 测试建议

### A/B测试矩阵

#### 测试组1：Strength对比（Johannes Vermeer）
- Control: strength=0.52 (旧版)
- Variant: strength=0.45 (新版)
- 指标：宠物特征保留率、风格一致性

#### 测试组2：提示词结构对比
- Control: 包含具象配饰（turban, pearl earring）
- Variant: 使用艺术流派描述（Dutch Golden Age, baroque）
- 指标：生成成功率、用户满意度

#### 测试组3：构图指导影响
- Control: 无aspectRatioGuide
- Variant: 添加aspectRatioGuide
- 指标：构图准确性、画面裁切错误率

---

## 📈 预期改进

### Johannes Vermeer风格
- ✅ 宠物特征保留率：65% → 75%
- ✅ 油画风格一致性：保持80%+
- ✅ 构图准确性：+15%
- ✅ 用户满意度：预计+20%

### 整体系统
- ✅ 尺寸识别准确率：+25%
- ✅ 所有Tier 3风格平衡性提升
- ✅ 减少"宠物面目全非"的投诉

---

## 🔄 迭代优化流程

### Phase 1: 监控数据收集
```sql
-- 查看filtered_features_log，分析冲突模式
SELECT 
  style_id,
  feature_type,
  filter_reason,
  COUNT(*) as frequency
FROM filtered_features_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY style_id, feature_type, filter_reason
ORDER BY frequency DESC;
```

### Phase 2: 用户反馈分析
- 收集"不满意"生成的common patterns
- 识别哪些风格的投诉率最高
- 分析是strength问题还是prompt问题

### Phase 3: 持续优化
1. 每周review一个风格的提示词
2. 根据数据调整strength ±0.05
3. 测试新的描述性词汇
4. 更新PROMPT_OPTIMIZATION_GUIDE.md

---

## 📚 专业术语词典

### 光影术语
- **Chiaroscuro**: 明暗对比法（Caravaggio风格）
- **Diffused lighting**: 柔光，无明显阴影
- **Rim light**: 轮廓光，边缘高光
- **Golden hour**: 黄金时段光线（日出/日落）

### 构图术语
- **Three-quarter view**: 四分之三侧面角度
- **Portrait composition**: 肖像构图
- **Rule of thirds**: 三分法构图
- **Centered composition**: 居中构图

### 艺术流派
- **Dutch Golden Age**: 荷兰黄金时代（1588-1672）
- **Baroque**: 巴洛克风格（1600-1750）
- **Impressionism**: 印象派
- **Art Nouveau**: 新艺术运动

### 技术手法
- **Visible brushstrokes**: 可见笔触
- **Impasto**: 厚涂法
- **Glazing**: 透明薄涂法
- **Sfumato**: 渐隐法（达芬奇）

---

## 🚀 快速参考卡片

### 问题：风格太强，宠物面目全非
**解决方案**：
1. 降低strength（-0.05至-0.10）
2. 降低guidance（-0.2至-0.5）
3. 在提示词前加"preserve exact features from reference image"
4. 移除强制性颜色词

### 问题：风格太弱，看不出艺术效果
**解决方案**：
1. 提高strength（+0.03至+0.05）
2. 增强风格描述的具体性
3. 添加技术手法词汇（"visible brushstrokes", "chiaroscuro"）
4. 使用更具体的艺术流派名称

### 问题：构图不准确，宠物被裁切
**解决方案**：
1. 添加aspectRatioGuide ✅（已实现）
2. 明确构图类型（"portrait composition", "full body"）
3. 检查预处理的padding逻辑
4. 在Tier 1-2使用"centered composition"

---

## 📝 变更日志

### 2026-01-18 - Major Optimization
**Changed**:
- ✅ Johannes Vermeer提示词重构（去除强制配饰）
- ✅ Johannes Vermeer strength: 0.52 → 0.45
- ✅ Flower-Crown strength: 0.54 → 0.48
- ✅ Vintage-Traveler strength: 0.40 → 0.38
- ✅ 所有提示词添加aspectRatioGuide
- ✅ 优化光线描述（移除定向指令）

**Added**:
- ✅ 构图指导系统
- ✅ 更灵活的艺术风格描述

**Improved**:
- ✅ 宠物特征保留率（Tier 3）
- ✅ 画面比例准确性
- ✅ 艺术风格一致性

---

## 🎓 进阶阅读

### FLUX-dev最佳实践
- 官方文档：https://replicate.com/black-forest-labs/flux-dev
- Strength范围：0.25-0.80（推荐0.30-0.60）
- Guidance范围：1.5-4.0（推荐2.0-3.5）

### Image-to-Image技巧
1. **低strength (0.25-0.35)**：保真度优先
2. **中strength (0.40-0.55)**：平衡转换
3. **高strength (0.60+)**：创意优先

### 提示词工程资源
- Midjourney Prompt Guide
- Stable Diffusion Prompt Matrix
- Leonardo.AI Style Reference

---

## ⚠️ 注意事项

1. **不要过度优化单一指标**
   - 追求100%相似度 = 失去艺术性
   - 追求极致风格 = 宠物面目全非
   - 平衡是关键

2. **用户心理预期管理**
   - Tier 1: "这是我家宠物+小装饰"
   - Tier 3: "这是一幅艺术作品，灵感来自我的宠物"
   - 在UI中明确告知用户

3. **数据驱动决策**
   - 用filtered_features_log监控冲突
   - 用用户反馈验证假设
   - 不要凭感觉调参数

---

**最后更新**: 2026-01-18  
**优化负责人**: AI Prompt Specialist  
**下次review**: 2026-01-25
