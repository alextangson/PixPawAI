# 🎨 MVP 风格系统测试指南

**创建日期**: 2026-01-17  
**状态**: ✅ 代码已部署，等待测试  
**开发服务器**: http://localhost:3003

---

## ✅ 已完成的工作

### 1. 代码更新
- ✅ **lib/styles.ts**: 添加了 4 个新风格的完整 prompt
- ✅ **lib/style-tiers.ts**: 添加了 4 个 tier 配置（strength/guidance 参数）
- ✅ **public/**: 创建了 4 个占位符预览图

### 2. 新增的 MVP 风格

| Tier | 风格 ID | 显示名称 | Strength | Guidance | 目标相似度 |
|------|---------|---------|----------|----------|-----------|
| **Tier 1** | `Spring-Vibes` | Spring Vibes | 0.28 | 2.0 | 85-90% |
| **Tier 2** | `Retro-Pop-Art` | Retro Pop Art | 0.35 | 2.5 | 75-80% |
| **Tier 3** | `Watercolor-Dream` | Watercolor Dream | 0.50 | 3.0 | 65-75% |
| **Tier 4** | `Pixel-Mosaic` | Pixel Mosaic | 0.68 | 3.5 | 55-65% |

---

## 🧪 测试步骤

### 前置条件
- ✅ 开发服务器运行中（http://localhost:3003）
- ✅ 已登录用户账号
- ✅ 账号有足够的积分（每次生成消耗 1 积分）

---

### 测试场景 1: UI 验证

**目标**: 验证 4 个新风格是否出现在上传向导中

**步骤**:
1. 访问 http://localhost:3003
2. 点击"上传"按钮
3. 在上传向导中，进入"选择风格"步骤
4. **检查点**: 应该看到以下新风格（带预览图）：
   - ✅ Spring Vibes
   - ✅ Retro Pop Art
   - ✅ Watercolor Dream
   - ✅ Pixel Mosaic

**预期结果**:
- 所有 14 个风格都显示（10 个原有 + 4 个新增）
- 预览图正确加载（占位符图片）
- 点击可正常选择

---

### 测试场景 2: Tier 1 - Spring Vibes（写实增强）

**目标**: 验证高相似度（85-90%），樱花元素清晰

**Prompt 关键词**:
- `cherry blossom petals falling`
- `pastel pink and white`
- `soft bokeh background`
- `professional pet photography`

**步骤**:
1. 上传一张清晰的宠物照片（最好是浅色毛发，容易看出樱花）
2. 选择 **Spring Vibes** 风格
3. 点击生成

**预期结果**:
- ✅ 宠物的毛色、花纹、眼神**高度保留**（85-90% 相似度）
- ✅ 背景有樱花花瓣飘落效果
- ✅ 整体色调温暖粉嫩
- ✅ 摄影质感清晰锐利

**判断标准**:
- 如果用户说"这就是我的宠物，只是加了樱花"→ ✅ 成功
- 如果用户说"不太像我的宠物了"→ ❌ strength 需要降低

---

### 测试场景 3: Tier 2 - Retro Pop Art（轻艺术）

**目标**: 验证平衡的风格化（75-80%），几何化但仍可识别

**Prompt 关键词**:
- `bold geometric shapes`
- `flat color blocks`
- `mid-century modern`
- `vibrant contrasting colors`

**步骤**:
1. 上传同样的宠物照片
2. 选择 **Retro Pop Art** 风格
3. 点击生成

**预期结果**:
- ✅ 宠物特征可识别（75-80% 相似度）
- ✅ 明显的几何化处理（圆形、椭圆、色块）
- ✅ 鲜艳的撞色（黄+蓝+红+橙）
- ✅ 复古海报质感

**判断标准**:
- 如果社交媒体分享率高 → ✅ 成功（年轻用户喜爱）
- 如果视觉不够鲜明 → ❌ guidance 需要提高

---

### 测试场景 4: Tier 3 - Watercolor Dream（强艺术）

**目标**: 验证艺术感强（65-75%），水彩质感明显

**Prompt 关键词**:
- `soft transparent watercolor`
- `flowing brush strokes`
- `water stains and gradients`
- `textured paper background`

**步骤**:
1. 上传同样的宠物照片
2. 选择 **Watercolor Dream** 风格
3. 点击生成

**预期结果**:
- ✅ 宠物轮廓和神态可识别（65-75% 相似度）
- ✅ 明显的水彩笔触和晕染效果
- ✅ 边缘有水渍、颜色渐变
- ✅ 柔和的艺术氛围

**判断标准**:
- 如果女性用户评价"好美，想挂在墙上"→ ✅ 成功
- 如果艺术感不够 → ❌ strength 需要提高
- 如果完全认不出宠物 → ❌ strength 需要降低

---

### 测试场景 5: Tier 4 - Pixel Mosaic（极致艺术）

**目标**: 验证极致风格化（55-65%），像素化明显

**Prompt 关键词**:
- `8-bit pixel art`
- `retro video game aesthetic`
- `square pixel grid`
- `limited color palette`

**步骤**:
1. 上传同样的宠物照片
2. 选择 **Pixel Mosaic** 风格
3. 点击生成

**预期结果**:
- ✅ 宠物**基本**可识别（55-65% 相似度）
- ✅ 明显的像素块（8-bit 游戏风格）
- ✅ 色彩简化（纯色色块，无渐变）
- ✅ 怀旧游戏美学

**判断标准**:
- 如果游戏玩家评价"太酷了，像素风"→ ✅ 成功
- 如果完全认不出是什么动物 → ❌ strength 过高，需要降低
- 如果像素感不明显 → ❌ strength 需要提高

---

### 测试场景 6: 对比测试（同一张照片）

**目标**: 用同一张宠物照片测试所有 4 个 Tier，观察相似度梯度

**步骤**:
1. 选择一张**高质量**的宠物照片（清晰、光线好、背景简单）
2. 依次生成 4 个风格：
   - Tier 1: Spring Vibes
   - Tier 2: Retro Pop Art
   - Tier 3: Watercolor Dream
   - Tier 4: Pixel Mosaic
3. 将 4 张生成图并排对比

**预期观察**:
- ✅ Tier 1 最像原图（几乎写实，只加了樱花）
- ✅ Tier 2 开始风格化（但仍能快速认出）
- ✅ Tier 3 艺术感明显（需要仔细看才能对应原图）
- ✅ Tier 4 高度风格化（可能需要告知"这是 XX 宠物"才能看出）

**成功标准**:
- 4 个 Tier 的相似度呈现**明显梯度**
- 每个 Tier 的风格特征**清晰可辨**
- 用户能根据需求选择合适的 Tier

---

## 📊 数据收集（2周测试期）

### 关键指标

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| **生成量** | 每个风格 ≥50 次生成 | 数据库查询 |
| **分享率** | Tier 2/4 ≥30% | `generations.is_public` |
| **用户反馈** | 满意度 ≥80% | 假门测试中的评论 |
| **重复使用率** | 用户多次选同一风格 ≥40% | 用户行为分析 |

### SQL 查询示例

```sql
-- 每个风格的生成量
SELECT 
  style, 
  COUNT(*) as total_generations,
  COUNT(CASE WHEN is_public = true THEN 1 END) as shared_count,
  ROUND(100.0 * COUNT(CASE WHEN is_public = true THEN 1 END) / COUNT(*), 2) as share_rate
FROM generations
WHERE created_at >= '2026-01-17'
  AND style IN ('Spring-Vibes', 'Retro-Pop-Art', 'Watercolor-Dream', 'Pixel-Mosaic')
GROUP BY style
ORDER BY total_generations DESC;
```

---

## 🚨 可能的问题与解决方案

### 问题 1: 新风格不显示在 UI 中

**症状**: 上传向导只显示旧的 10 个风格

**原因**: 
- 前端缓存
- 开发服务器未重启

**解决方案**:
```bash
# 1. 强制刷新浏览器（Cmd+Shift+R）
# 2. 如果不行，重启开发服务器：
Ctrl+C
npm run dev
```

---

### 问题 2: 生成失败（API 错误）

**症状**: 点击生成后显示错误

**可能原因**:
- Style ID 不匹配（大小写、连字符）
- Tier 配置缺失
- OpenRouter API 超时

**检查步骤**:
1. 打开浏览器控制台（F12）
2. 查看 Network 标签的 `/api/generate` 请求
3. 检查 Request Payload 中的 `style` 值是否正确
4. 检查 Response 的错误信息

**解决方案**:
```typescript
// 确认 lib/styles.ts 和 lib/style-tiers.ts 中的 ID 完全一致
// 正确：'Spring-Vibes'（大写 S 和 V，连字符）
// 错误：'spring-vibes' 或 'Spring Vibes'
```

---

### 问题 3: 生成结果不符合预期

**症状**: 
- Tier 1 相似度太低（应该 85-90%，实际只有 60%）
- Tier 4 相似度太高（应该 55-65%，实际有 80%）

**原因**: Strength 参数需要微调

**调整策略**:
```typescript
// lib/style-tiers.ts

// 如果相似度太低，降低 strength：
'Spring-Vibes': {
  strength: 0.28 → 0.25  // 降低 0.03
}

// 如果相似度太高，提高 strength：
'Pixel-Mosaic': {
  strength: 0.68 → 0.72  // 提高 0.04
}
```

**调整幅度建议**:
- **小幅调整**: ±0.03-0.05（优先）
- **中幅调整**: ±0.08-0.10
- **大幅调整**: ±0.15+（慎用）

---

### 问题 4: Prompt 效果不明显

**症状**: 
- Spring Vibes 没有樱花
- Watercolor 看起来不像水彩

**原因**: 
- Prompt 关键词不够强
- Guidance 参数过低

**解决方案**:
1. **强化 Prompt 关键词**:
```typescript
// lib/styles.ts
// 不够强：', with cherry blossoms'
// 更强：', surrounded by MANY soft pink cherry blossom petals'
```

2. **提高 Guidance**:
```typescript
// lib/style-tiers.ts
'Spring-Vibes': {
  guidance: 2.0 → 2.5  // 提高以增强 prompt 效果
}
```

---

## 📅 测试时间表

| 时间 | 任务 | 负责人 |
|------|------|--------|
| **Day 1-2** | 基础功能测试（UI、生成流程） | 开发者 |
| **Day 3-7** | 小范围用户测试（5-10 人） | 产品经理 |
| **Day 8-14** | 扩大测试（50+ 用户） | 市场团队 |
| **Day 15** | 数据分析和决策会议 | 全员 |

---

## 🎯 成功标准（2周后评估）

### Tier 1: Spring Vibes
- ✅ 平均相似度 85-90%
- ✅ 生成量 ≥50 次
- ✅ 用户反馈"很像我的宠物"≥80%

### Tier 2: Retro Pop Art
- ✅ 平均相似度 75-80%
- ✅ 分享率 ≥30%（社交友好度）
- ✅ 年轻用户（18-35岁）占比 ≥60%

### Tier 3: Watercolor Dream
- ✅ 平均相似度 65-75%
- ✅ 女性用户占比 ≥70%
- ✅ 用户反馈"艺术感强"≥75%

### Tier 4: Pixel Mosaic
- ✅ 平均相似度 55-65%
- ✅ 社交传播力（views/generation）≥3.0
- ✅ 游戏玩家/极客用户喜爱度 ≥80%

---

## 🔮 Phase 2 决策点（2026-01-31）

### 如果测试成功 → 升级到风格变体系统

**实施内容**:
1. 为 Spring Vibes 添加 ABC 三个变体（樱花/花环/郁金香）
2. 数据库存储 `promptVariantIndex`
3. Gallery 添加"Recreate Style"按钮
4. 扩展其他受欢迎的风格

**预期工时**: 2-3 小时

---

### 如果某个 Tier 失败 → 替换风格

**Tier 2 备选方案**:
- Victorian-Royal（已有，复杂服装）
- 或新增：版画/木刻风格

**Tier 3 备选方案**:
- Johannes Vermeer（已有，名画风格）
- 或新增：拼贴艺术

**Tier 4 备选方案**:
- ASCII 艺术（极致抽象）
- 3D 立体雕塑感

---

## 📝 测试日志模板

### 测试记录表（每次生成后填写）

| 测试时间 | 风格 | 宠物类型 | 相似度（主观1-10分） | 风格效果（1-10分） | 备注 |
|---------|------|---------|-------------------|------------------|------|
| 2026-01-17 14:30 | Spring Vibes | 金毛 | 9/10 | 8/10 | 樱花效果很好 |
| 2026-01-17 14:35 | Retro Pop Art | 橘猫 | 7/10 | 10/10 | 几何化很明显 |
| ... | ... | ... | ... | ... | ... |

---

## 🚀 快速开始

```bash
# 1. 确保开发服务器运行
npm run dev

# 2. 访问
open http://localhost:3003

# 3. 登录并上传宠物照片

# 4. 依次测试 4 个新风格

# 5. 记录结果并分享反馈
```

---

## 📞 问题反馈

如果测试中遇到任何问题，请记录：
1. **复现步骤**
2. **预期结果** vs **实际结果**
3. **截图**（如果可能）
4. **浏览器控制台错误**（F12）

---

**祝测试顺利！** 🎨✨
