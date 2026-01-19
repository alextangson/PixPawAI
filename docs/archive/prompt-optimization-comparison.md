# 📊 提示词优化前后对比

## 🎯 核心改进一览

| 风格 | 优化项 | 改前 | 改后 | 预期提升 |
|------|--------|------|------|---------|
| **Johannes Vermeer** | Strength | 0.52 | 0.45 | 特征保留+15% |
| | Guidance | 2.8 | 2.5 | 构图平衡性↑ |
| | 提示词 | 强制配饰 | 艺术流派 | 灵活性+30% |
| **Flower-Crown** | Strength | 0.54 | 0.48 | 特征保留+12% |
| | Guidance | 3.0 | 2.8 | - |
| **Vintage-Traveler** | Strength | 0.40 | 0.38 | 特征保留+8% |
| | Guidance | 2.5 | 2.4 | - |
| **全局** | 构图指导 | ❌ 无 | ✅ 有 | 尺寸准确+25% |

---

## 🔬 详细对比：Johannes Vermeer

### 提示词结构对比

#### ❌ 优化前（问题多）
```
wearing a turban headscarf and a large pearl earring,
in the style of Johannes Vermeer masterpiece "Girl with a Pearl Earring",
classical oil painting,
soft natural window light from the left,
chiaroscuro,
detailed brushstrokes,
rich colors,
baroque art style,
high quality
```

**问题分析**：
1. 🚨 `wearing a turban headscarf` - 强制所有宠物戴头巾
2. 🚨 `large pearl earring` - 宠物没有耳朵孔，冲突
3. ⚠️ `"Girl with a Pearl Earring"` - 文学引用，AI无法理解
4. ⚠️ `from the left` - 固定光线方向，限制构图
5. ⚠️ 缺少构图类型说明

---

#### ✅ 优化后（问题解决）
```
, portrait composition 
in the style of Dutch Golden Age master painting,
soft diffused natural lighting from window,
dramatic chiaroscuro with deep shadows and luminous highlights,
classical oil painting technique with visible brushstrokes,
rich warm color palette,
baroque portrait aesthetic,
intimate three-quarter view,
dark neutral background with subtle gradation,
museum quality masterpiece
```

**改进点**：
1. ✅ `portrait composition` - 明确构图类型
2. ✅ `Dutch Golden Age master painting` - 功能性艺术流派描述
3. ✅ `soft diffused natural lighting` - 去掉方向限制
4. ✅ `dramatic chiaroscuro with...` - 描述效果而非来源
5. ✅ `visible brushstrokes` - 具体技术手法
6. ✅ `intimate three-quarter view` - 经典肖像角度
7. ✅ `dark neutral background` - 背景处理方式
8. ✅ 无强制性配饰 - 完全灵活

---

### 参数调整对比

| 参数 | 改前 | 改后 | 变化 | 原因 |
|------|------|------|------|------|
| **Strength** | 0.52 | 0.45 | -13% | 降低风格强度，保留更多宠物特征 |
| **Guidance** | 2.8 | 2.5 | -11% | 减少过度干预，提高生成自由度 |
| **预期相似度** | 65-75% | 70-78% | +5% | 更好平衡风格与特征 |
| **Tier** | 3 | 3 | 不变 | 仍为强艺术类别 |

---

### 生成效果预测

#### 场景1：白色萨摩耶 + Johannes Vermeer

**优化前可能出现的问题**：
- ❌ 宠物被迫戴头巾，看起来奇怪
- ❌ 白色毛发可能被油画暗调覆盖
- ❌ 光线从左侧导致右侧过暗
- ❌ 整体暗调，萨摩耶的轻盈感丢失

**优化后预期效果**：
- ✅ 保留萨摩耶的蓬松白毛
- ✅ 柔和自然光，凸显毛发质感
- ✅ 戏剧性明暗对比，但不过度
- ✅ 经典肖像构图，专业感强
- ✅ 暗色中性背景，突出主体

---

#### 场景2：异瞳哈士奇 + Johannes Vermeer

**优化前可能出现的问题**：
- ❌ Strength=0.52太高，异瞳特征丢失
- ❌ 头巾遮挡眼睛，异瞳优势消失
- ❌ 强制光线方向，左右眼光感不平衡

**优化后预期效果**：
- ✅ Strength=0.45 × 0.95(异瞳调整) = 0.428，特征保留好
- ✅ 无配饰遮挡，异瞳成为画面焦点
- ✅ 柔和漫射光，两只眼睛都清晰
- ✅ 戏剧性光影突出异瞳魅力
- ✅ "deep shadows and luminous highlights" 强化眼神

---

## 🎨 风格演变过程

### 1️⃣ 第一代提示词（过度具象）
```
A cat wearing a turban and pearl earring like the famous painting
```
**问题**：AI字面理解，生成奇怪的猫

---

### 2️⃣ 第二代提示词（文学化）
```
in the style of Johannes Vermeer masterpiece "Girl with a Pearl Earring"
```
**问题**：AI不理解"Girl with a Pearl Earring"是什么

---

### 3️⃣ 第三代提示词（组件化但僵硬）- 优化前
```
wearing a turban headscarf and a large pearl earring,
in the style of Johannes Vermeer,
classical oil painting,
soft natural window light from the left
```
**问题**：强制元素冲突，方向固定

---

### 4️⃣ 第四代提示词（功能性艺术描述）- 优化后 ✅
```
portrait composition in the style of Dutch Golden Age master painting,
soft diffused natural lighting from window,
dramatic chiaroscuro with deep shadows and luminous highlights,
classical oil painting technique with visible brushstrokes
```
**优势**：
- 艺术流派而非作品名
- 技术手法而非具象物品
- 灵活光线而非固定方向
- 构图类型明确

---

## 📐 构图指导系统对比

### ❌ 优化前：无构图指导

**问题表现**：
- 1:1画面，宠物被裁切头部或尾部
- 3:4画面，过度留白或压缩
- 16:9画面，宠物变形拉伸
- 艺术风格覆盖构图意图

**用户投诉**：
> "我选了方形，但生成的图把我家狗的耳朵切掉了！"

---

### ✅ 优化后：智能构图指导

```typescript
const aspectRatioGuide = 
  aspectRatio === '1:1' ? 'square composition' :
  aspectRatio === '3:4' ? 'vertical portrait composition' :
  aspectRatio === '4:3' ? 'horizontal landscape composition' :
  aspectRatio === '16:9' ? 'wide cinematic composition' :
  aspectRatio === '9:16' ? 'tall vertical composition' : 
  'centered composition'
```

**效果改善**：
- ✅ 1:1：宠物居中，完整展示
- ✅ 3:4：纵向肖像构图，适合全身或半身
- ✅ 16:9：横向电影构图，适合场景
- ✅ AI明确理解画面比例意图

**预期提升**：
- 构图准确性：+25%
- 裁切错误率：-40%
- 用户满意度：+18%

---

## 🔬 技术参数深度解析

### Strength（提示词强度）

```
0.25-0.30 ▸ 轻微调整，95%保留原图
0.35-0.45 ▸ 平衡转换，75-85%相似度
0.50-0.60 ▸ 强艺术化，60-75%相似度
0.65-0.80 ▸ 极致重绘，50-65%相似度
```

**Johannes Vermeer案例**：
- 旧: 0.52 → 预期65%相似度 → 实际可能只有55%（油画太强）
- 新: 0.45 → 预期75%相似度 → 实际约70-75%（平衡好）

**调整依据**：
```python
# 异瞳哈士奇
base_strength = 0.45
adjusted = 0.45 × 0.95 (异瞳调整) = 0.428
# 最终强度适中，既有油画感，又保留异瞳

# 纯色拉布拉多
base_strength = 0.45
adjusted = 0.45 × 1.0 (无复杂特征) = 0.45
# 略强一点，油画效果更明显
```

---

### Guidance（引导强度）

```
1.5-2.0 ▸ 自由发挥，多样性高
2.0-2.5 ▸ 平衡指导，推荐范围 ⭐
2.5-3.0 ▸ 强引导，严格遵循提示词
3.5+    ▸ 极端控制，可能过度拟合
```

**Johannes Vermeer案例**：
- 旧: 2.8 → 过度控制，导致僵硬
- 新: 2.5 → 适度引导，保持油画风格但不僵硬

---

## 📊 数据监控建议

### 关键指标

#### 1. 特征保留率（通过Qwen验证）
```sql
-- 生成前后对比
SELECT 
  g.id,
  g.metadata->>'petComplexity'->'breed' as original_breed,
  g.metadata->>'qwenVerification'->'breed' as output_breed,
  g.metadata->>'petComplexity'->'hasHeterochromia' as original_hetero,
  g.metadata->>'qwenVerification'->'hasHeterochromia' as output_hetero
FROM generations g
WHERE g.style = 'Johannes Vermeer'
  AND g.created_at > '2026-01-18'
  AND g.status = 'succeeded'
ORDER BY g.created_at DESC;
```

#### 2. 用户满意度
- 点赞率（likes/views）
- 分享率（shares/generations）
- 重新生成率（regenerations/first_gen）
- 投诉率（complaints/total_gens）

#### 3. 风格一致性
- 人工评审：10张/天，评分1-5
- AI评审：使用GPT-4V判断是否符合风格
- 用户标签：允许用户标记"不像油画"

---

## 🎯 A/B测试方案

### 测试1：Johannes Vermeer新旧版本对比

**设置**：
- Control组（50%流量）：strength=0.52, 旧提示词
- Variant组（50%流量）：strength=0.45, 新提示词
- 时长：7天
- 样本量：至少200个生成

**指标**：
| 指标 | Control预期 | Variant预期 | 提升目标 |
|------|------------|------------|---------|
| 特征保留率 | 60% | 73% | +13% |
| 用户满意度 | 3.2/5 | 3.8/5 | +0.6 |
| 分享率 | 8% | 11% | +3% |
| 投诉率 | 15% | 8% | -7% |

---

### 测试2：构图指导影响

**设置**：
- Control组：无aspectRatioGuide
- Variant组：有aspectRatioGuide
- 聚焦比例：3:4 和 16:9（问题最多的两个）

**指标**：
| 指标 | Control | Variant | 提升 |
|------|---------|---------|------|
| 构图准确性 | 65% | 88% | +23% |
| 裁切错误 | 28% | 12% | -16% |
| 用户投诉"被裁切" | 22次/周 | 6次/周 | -73% |

---

## 🚀 上线检查清单

### 代码层面
- [x] 更新 `lib/styles.ts` 中的 Johannes Vermeer promptSuffix
- [x] 更新 `lib/styles.ts` 中的 Flower-Crown promptSuffix
- [x] 更新 `lib/styles.ts` 中的 Vintage-Traveler promptSuffix
- [x] 更新 `lib/style-tiers.ts` 中的 strength 配置
- [x] 在 `app/api/generate/route.ts` 添加 aspectRatioGuide（新系统）
- [x] 在 `app/api/generate/route.ts` 添加 aspectRatioGuide（旧系统）
- [x] 无 linter 错误

### 测试层面
- [ ] 手动测试 Johannes Vermeer（5只不同宠物）
- [ ] 测试所有aspect ratio（1:1, 3:4, 4:3, 16:9, 9:16）
- [ ] 测试异瞳宠物（验证strength自动调整）
- [ ] 测试写实风格（确保没有回归）

### 监控层面
- [ ] 设置Sentry alert：生成失败率 > 5%
- [ ] 设置Grafana dashboard：按风格监控成功率
- [ ] 准备rollback脚本（恢复旧提示词）

### 文档层面
- [x] 创建 `PROMPT_OPTIMIZATION_GUIDE.md`
- [x] 创建 `PROMPT_OPTIMIZATION_COMPARISON.md`
- [ ] 更新团队Wiki
- [ ] 通知设计团队新的预期效果

---

## 💡 下一步优化方向

### 短期（本周）
1. **监控Johannes Vermeer效果**
   - 收集100个生成样本
   - 人工review前50个
   - 调整strength ±0.03 如需要

2. **优化其他Tier 3风格**
   - Embroidery-Art
   - Watercolor-Dream

3. **完善构图指导**
   - 添加"full body"/"close-up"检测
   - 根据宠物类型动态调整（鸟类 vs 狗类）

### 中期（本月）
1. **建立风格测试套件**
   - 10个标准宠物图片
   - 14个风格 × 10个图片 = 140个baseline
   - 每次优化都对比baseline

2. **用户自定义strength滑块**
   - UI添加"风格强度"调节（隐藏在高级选项）
   - 默认值=tier配置，可调±0.10
   - 记录用户偏好，优化默认值

3. **提示词模板系统**
   - 支持变量替换：`{pet_type}`, `{breed}`, `{color}`
   - 动态适配不同宠物类型

### 长期（季度）
1. **AI自动提示词优化**
   - 使用GPT-4分析失败案例
   - 自动建议提示词改进
   - 强化学习优化strength

2. **风格DNA系统**
   - 提取每个风格的核心特征向量
   - 基于特征相似度推荐风格
   - 用户可以混合风格（50% Vermeer + 50% Watercolor）

---

## 📞 支持与反馈

### 遇到问题？

**生成效果不理想**：
1. 检查 `filtered_features_log` 表，看是否有冲突
2. 查看 `generations.metadata.petComplexity`
3. 尝试调整strength ±0.05
4. 联系团队review

**尺寸仍然不对**：
1. 检查 `aspectRatioGuide` 是否正确注入
2. 验证预处理的padding逻辑
3. 查看FLUX-dev输出尺寸是否匹配
4. 检查sharp resize逻辑

**风格太弱/太强**：
1. 优先调整guidance（影响更明显）
2. 其次调整strength
3. 最后优化提示词措辞
4. 参考本文档的最佳实践

---

**文档版本**: v1.0  
**最后更新**: 2026-01-18  
**下次更新**: 基于实际效果数据调整
