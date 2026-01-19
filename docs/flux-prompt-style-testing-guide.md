# FLUX-dev 提示词风格 A/B 测试指南

## 📋 测试目标

验证 **关键词风格** vs **自然语言风格** 对 FLUX-dev 模型的生成效果影响，确定最佳提示词编写方式。

### 背景说明

FLUX-dev 模型与 Stable Diffusion 系列模型在提示词处理上有显著差异：
- **Stable Diffusion**: 偏好逗号分隔的关键词（如 `watercolor, portrait, soft, dreamy`）
- **FLUX-dev**: 官方推荐使用自然语言描述（如 `rendered as a watercolor portrait with soft and dreamy atmosphere`）

当前系统使用逗号连接的方式拼接提示词（`lib/prompt-system/prompt-builder.ts` line 67），可能并非 FLUX-dev 的最佳实践。本测试旨在通过实际生成结果，验证哪种风格更适合。

---

## 🐾 测试样本

### Tier 1: 高优先级测试（必测）

这些样本有明显特征，最能验证提示词准确性：

| 样本 | 特征 | 测试重点 | 图片来源建议 |
|------|------|----------|------------|
| **异瞳布偶猫** | - 一蓝一黄眼睛<br>- 长毛<br>- 浅色毛发 | ✓ 异瞳识别准确性<br>✓ 毛发质感<br>✓ 颜色渐变 | Unsplash: "ragdoll cat heterochromia" |
| **金毛犬异瞳** | - 异色瞳<br>- 金色长毛<br>- 大型犬 | ✓ 异瞳表现<br>✓ 毛发流向<br>✓ 表情捕捉 | Unsplash: "golden retriever odd eyes" |
| **三花猫** | - 黑白橙三色<br>- 复杂花纹 | ✓ 复杂图案识别<br>✓ 多色融合 | Unsplash: "calico cat" |
| **哈士奇蓝眼** | - 鲜明蓝眼<br>- 黑白毛色<br>- 狼型脸 | ✓ 眼睛颜色强度<br>✓ 对比色处理 | Unsplash: "husky blue eyes" |

**推荐测试顺序**: 先用异瞳布偶猫测试，因为异瞳是最独特且容易验证的特征。

### Tier 2: 补充测试（可选）

验证不同动物类型和风格：

| 样本 | 特点 | 测试价值 |
|------|------|----------|
| **英短蓝猫** | 圆脸、铜黄眼、蓝灰色 | 单色调表现 |
| **柯基** | 短腿、大耳朵、棕白色 | 体型比例 |
| **波斯猫** | 扁脸、长毛、纯白 | 面部细节 |
| **边牧** | 黑白花色、机警表情 | 动态姿态 |

---

## 🎯 测试变量设计

### 控制变量（保持不变）

在每对测试中，以下参数必须完全相同：

```
✓ 测试图片：同一张
✓ Tier: 2
✓ Strength: 0.35
✓ Guidance: 2.5
✓ Aspect Ratio: 1:1
✓ Negative Prompt: 空（或保持相同）
```

### 自变量（测试对比）

**提示词风格（2 组）**
- Version A: 关键词风格（Keywords Style）
- Version B: 自然语言风格（Natural Language Style）

---

## 📝 测试用例模板

### Test Case 1: 水彩风格（Watercolor）

#### 版本 A - 关键词风格

```
Style Name: WC_Keywords_Test

Prompt Suffix:
delicate watercolor portrait, soft brushstrokes, pastel colors, 
dreamy atmosphere, artistic rendering, gentle color transitions, 
high detail on eyes and facial features, impressionist style

Negative Prompt:
photorealistic, harsh lines, digital art, 3D render, overly saturated
```

**预期拼接结果**:
```
golden retriever, heterochromia (one blue eye, one brown eye), 
delicate watercolor portrait, soft brushstrokes, pastel colors, ...
```

#### 版本 B - 自然语言风格

```
Style Name: WC_Natural_Test

Prompt Suffix:
rendered as a delicate watercolor portrait with soft brushstrokes and pastel colors, 
featuring a dreamy atmosphere and artistic rendering with gentle color transitions, 
paying high attention to eye details and facial features in an impressionist style

Negative Prompt:
photorealistic, harsh lines, digital art, 3D render, overly saturated
```

**预期拼接结果**:
```
golden retriever, heterochromia (one blue eye, one brown eye), 
rendered as a delicate watercolor portrait with soft brushstrokes and pastel colors, ...
```

---

### Test Case 2: Pixar 风格（3D 卡通）

#### 版本 A - 关键词风格

```
Style Name: Pixar_Keywords_Test

Prompt Suffix:
Pixar style, 3D render, vibrant colors, cute character design, 
big expressive eyes, soft studio lighting, smooth textures, 
professional animation quality, Disney aesthetic

Negative Prompt:
2D flat, sketch, realistic photo, dark atmosphere, low poly
```

#### 版本 B - 自然语言风格

```
Style Name: Pixar_Natural_Test

Prompt Suffix:
rendered in Pixar animation style as a 3D character with vibrant colors 
and cute character design, featuring big expressive eyes illuminated by 
soft studio lighting with smooth textures and professional animation quality 
reminiscent of Disney aesthetics

Negative Prompt:
2D flat, sketch, realistic photo, dark atmosphere, low poly
```

---

### Test Case 3: 写实摄影风格（Photography）

#### 版本 A - 关键词风格

```
Style Name: Photo_Keywords_Test

Prompt Suffix:
professional pet photography, studio lighting, shallow depth of field, 
bokeh background, sharp focus on eyes, natural colors, 
Canon EOS quality, 85mm portrait lens, f/1.8

Negative Prompt:
cartoon, illustration, painting, oversaturated, artificial
```

#### 版本 B - 自然语言风格

```
Style Name: Photo_Natural_Test

Prompt Suffix:
captured with professional pet photography using studio lighting 
and shallow depth of field creating bokeh background, 
with sharp focus on the eyes and natural colors, 
shot with Canon EOS and 85mm portrait lens at f/1.8

Negative Prompt:
cartoon, illustration, painting, oversaturated, artificial
```

---

## 🔬 测试执行流程（SOP）

### Phase 1: 准备阶段

```
□ 下载 4 张 Tier 1 测试图片
□ 重命名为: ragdoll_hetero.jpg, golden_hetero.jpg, calico.jpg, husky_blue.jpg
□ 登录 Test Lab: http://localhost:3000/en/admin/test-lab
□ 准备记录表格（见下方模板）
□ 清空浏览器 localStorage（可选，避免历史数据干扰）
```

### Phase 2: 执行测试（每张图片）

#### Round 1 - 关键词风格

```
1. 点击 "Create New" 模式
2. 输入 Style Name: [风格]_Keywords_[动物]
   例如: WC_Keywords_Ragdoll
3. 粘贴 Prompt Suffix（关键词版本）
4. 粘贴 Negative Prompt
5. 上传测试图片
6. 等待 Qwen 分析完成（约 5-10 秒）
7. 检查 "1. Image Analysis" 确认识别结果
8. 展开 "3. Prompt Preview" 确认最终提示词
9. 设置参数：
   - Manual Mode: OFF
   - Tier: 2
   - Strength: 0.35
   - Guidance: 2.5
   - Aspect Ratio: 1:1
10. 点击 "Generate & Test"
11. 等待生成完成（约 30-60 秒）
12. 点击生成的图片查看大图和细节
13. 评分（点击 1-5 颗星）
14. 截图保存结果（推荐使用 Cmd/Ctrl + Shift + 4）
15. 记录到测试表格
```

#### Round 2 - 自然语言风格

```
1. ⚠️ 不要刷新页面（保留 Qwen 分析结果）
2. 清空之前的 Style Name 和 Prompt Suffix
3. 输入新的 Style Name: [风格]_Natural_[动物]
   例如: WC_Natural_Ragdoll
4. 粘贴 Prompt Suffix（自然语言版本）
5. 保持 Negative Prompt 和所有参数完全相同
6. 点击 "Generate & Test"
7. 等待生成完成
8. 点击图片查看大图
9. 评分（1-5 星）
10. 截图保存结果
11. 记录到测试表格
```

#### Round 3 - 对比评估

```
12. 并排查看两张生成图（可以使用图片查看器）
13. 填写详细评估表（见下方模板）
14. 点击 "Mark Best" 标记更好的那个
15. 如果差异明显，可以在笔记中记录具体观察
```

---

## 📊 测试记录表格模板

### 快速评分表

```
测试日期: 2026-01-19
测试人: [你的名字]
环境: Test Lab (localhost:3000)

┌──────────────┬────────┬────────┬──────┬──────────┬────────────┐
│ 测试样本      │ 风格   │ 版本   │ 评分 │ 最佳     │ 生成时长    │
├──────────────┼────────┼────────┼──────┼──────────┼────────────┤
│ 异瞳布偶      │ 水彩   │ 关键词 │      │          │            │
│ 异瞳布偶      │ 水彩   │ 自然语 │      │ ✓        │            │
├──────────────┼────────┼────────┼──────┼──────────┼────────────┤
│ 异瞳布偶      │ Pixar  │ 关键词 │      │          │            │
│ 异瞳布偶      │ Pixar  │ 自然语 │      │          │            │
├──────────────┼────────┼────────┼──────┼──────────┼────────────┤
│ 异瞳布偶      │ 摄影   │ 关键词 │      │          │            │
│ 异瞳布偶      │ 摄影   │ 自然语 │      │          │            │
├──────────────┼────────┼────────┼──────┼──────────┼────────────┤
│ 金毛异瞳      │ 水彩   │ 关键词 │      │          │            │
│ 金毛异瞳      │ 水彩   │ 自然语 │      │          │            │
└──────────────┴────────┴────────┴──────┴──────────┴────────────┘
```

### 详细评估表（每个测试）

```markdown
## 测试 ID: WC_Ragdoll_001

### 基础信息
- 动物: 异瞳布偶猫
- 风格: 水彩 Watercolor
- 版本: A (关键词) vs B (自然语言)
- 测试日期: 2026-01-19 14:30

### Qwen 识别结果
- Pet Type: cat
- Breed: Ragdoll
- Heterochromia: Yes (left blue, right yellow)
- Primary Color: cream white
- Quality: Good

### 版本 A - 关键词风格

**最终提示词** (从 Prompt Preview 复制):
```
[完整的 positive prompt]
```

**生成参数**:
- Strength: 0.35
- Guidance: 2.5
- Tier: 2
- Time: 45s

**评分**:
- 风格准确性: ⭐⭐⭐⭐ (4/5)
- 细节保留: ⭐⭐⭐ (3/5)
- 异瞳表现: ⭐⭐⭐⭐ (4/5)
- 艺术性: ⭐⭐⭐ (3/5)
- **整体: ⭐⭐⭐⭐ (3.5/5)**

**观察笔记**:
- 水彩质感不错，但边缘有些模糊
- 异瞳颜色准确，左蓝右黄
- 背景过于简单
- 毛发细节一般

### 版本 B - 自然语言风格

**最终提示词**:
```
[完整的 positive prompt]
```

**生成参数**:
- Strength: 0.35
- Guidance: 2.5
- Tier: 2
- Time: 43s

**评分**:
- 风格准确性: ⭐⭐⭐⭐⭐ (5/5)
- 细节保留: ⭐⭐⭐⭐⭐ (5/5)
- 异瞳表现: ⭐⭐⭐⭐⭐ (5/5)
- 艺术性: ⭐⭐⭐⭐ (4/5)
- **整体: ⭐⭐⭐⭐⭐ (4.75/5)**

**观察笔记**:
- 水彩笔触更自然，能看到明显的水痕
- 异瞳细节更丰富，有光泽感
- 整体构图更协调
- 毛发质感更柔软

### 对比结论

✅ **版本 B (自然语言) 明显更好**

**理由**:
1. 更准确理解了 "delicate" 和 "soft" 的含义
2. 笔触表现更自然，不是简单堆砌效果
3. 细节保留和艺术表现力都更好
4. 整体评分高出 1.25 星

**差异程度**: 显著 (Significant)
```

---

## 🎯 成功标准

### 定量指标

如果满足以下条件，认为某版本更优：

```
□ 平均评分高 0.5 星以上
□ 至少 70% 的测试中被标记为 Best
□ 在所有 3 个风格中都表现更稳定（标准差更小）
□ 生成时长差异 < 10%（排除性能因素）
```

### 定性指标

```
□ AI 更准确理解提示词意图
□ 生成结果更符合预期风格
□ 细节表现更丰富
□ 艺术性和审美更好
□ 提示词的可读性和可维护性更好
```

---

## ⏱️ 预计时间

```
准备阶段: 30 分钟
- 下载图片: 15 分钟
- 熟悉流程: 15 分钟

执行测试: 2-3 小时
- 每张图片 × 3 风格 × 2 版本 = 24 次生成
- 每次生成约 1 分钟（包括 Qwen 分析 10s + Replicate 生成 40-60s）
- 评估记录约 2 分钟/次
- 总计: 24 × 3 = 72 分钟

分析总结: 30 分钟
- 整理数据
- 编写结论
- 准备演示

总计: 约 3-4 小时
```

**建议**: 可以分多个时段进行，不必一次完成。先测试 1 张图片的 3 个风格（约 20 分钟），验证流程后再扩展到所有测试。

---

## 📂 测试输出

完成后你应该有以下文件：

```
/test_results/
  ├── 20260119_prompt_style_test_report.md    # 测试报告
  ├── screenshots/
  │   ├── WC_Keywords_Ragdoll.png
  │   ├── WC_Natural_Ragdoll.png
  │   ├── Pixar_Keywords_Ragdoll.png
  │   ├── Pixar_Natural_Ragdoll.png
  │   ├── Photo_Keywords_Ragdoll.png
  │   ├── Photo_Natural_Ragdoll.png
  │   └── ... (其他测试图片)
  ├── prompt_logs/
  │   ├── qwen_analysis_ragdoll.json
  │   ├── final_prompts_wc_keywords.txt
  │   ├── final_prompts_wc_natural.txt
  │   └── ...
  └── comparison/
      ├── side_by_side_wc_ragdoll.jpg  # 并排对比图
      └── ...
```

---

## 💡 测试建议

### Tip 1: 批量测试策略

先用 **1 张图片测试所有风格**，快速找出明显差异，再决定是否扩展到其他图片。

**推荐顺序**:
1. 异瞳布偶猫 × 水彩风格 (2 个版本) → 10 分钟
2. 如果差异明显 → 继续测试 Pixar 和摄影风格
3. 如果差异不明显 → 更换测试图片或调整提示词

### Tip 2: 盲测验证

让其他人（不知道哪个是哪个版本）也评分，验证结果客观性：

```
1. 准备两张图片，编号为 Image A 和 Image B
2. 不告诉他们哪个是关键词风格，哪个是自然语言
3. 让他们按相同标准评分
4. 对比你的评分和他们的评分
```

### Tip 3: 极端案例测试

如果水彩风格差异不明显，可以测试更复杂的提示词：

```
A majestic portrait combining Renaissance painting techniques 
with modern digital artistry, featuring intricate details in 
the style of Leonardo da Vinci with chiaroscuro lighting...
```

这种复杂的自然语言描述能更好地测试模型的语义理解能力。

### Tip 4: 实时笔记

在测试时，开一个文本编辑器记录即时观察：

```
14:30 - WC_Keywords_Ragdoll 生成中
14:31 - 完成，第一感觉：水彩质感可以，但有点平
14:32 - WC_Natural_Ragdoll 生成中
14:33 - 完成，哇！笔触更自然，异瞳更有神
14:34 - 对比：自然语言版明显更好，评 5 星
```

这些即时反应比事后回忆更准确。

### Tip 5: 参数微调测试（进阶）

如果某个版本表现更好，可以进一步测试参数优化：

```
基准: 自然语言 + Strength 0.35 → 5 星
测试: 自然语言 + Strength 0.40 → 5 星（更艺术化）
测试: 自然语言 + Strength 0.30 → 4 星（更保守）
```

---

## 📈 数据分析方法

### 简单统计

```python
# 伪代码示例
keywords_scores = [3.5, 3.0, 4.0, 3.5, ...]
natural_scores = [4.75, 5.0, 4.5, 5.0, ...]

avg_keywords = sum(keywords_scores) / len(keywords_scores)
avg_natural = sum(natural_scores) / len(natural_scores)

print(f"关键词平均分: {avg_keywords}")
print(f"自然语言平均分: {avg_natural}")
print(f"差异: {avg_natural - avg_keywords} 星")
```

### 可视化建议

使用 Google Sheets 或 Excel 创建：
- 柱状图：对比两种风格的平均评分
- 散点图：每个测试的评分分布
- 热力图：不同风格 × 不同动物的评分矩阵

---

## 🚀 快速开始

**现在就可以开始第一个测试！**

### 5 分钟快速验证流程

1. 打开 Unsplash 搜索 "ragdoll cat heterochromia"
2. 下载一张图片
3. 登录 Test Lab
4. 执行 Test Case 1 的两个版本（水彩风格）
5. 10 分钟后你就有第一个对比结果！

### 测试完后

请回答以下问题：

1. **哪个版本更好？**
   - [ ] 关键词风格
   - [ ] 自然语言风格
   - [ ] 差不多

2. **差异明显吗？**
   - [ ] 非常明显（一眼就能看出）
   - [ ] 中等（仔细看能发现）
   - [ ] 不明显（几乎一样）

3. **需要调整测试方案吗？**
   - [ ] 需要增加更多测试样本
   - [ ] 需要调整评分标准
   - [ ] 需要测试更极端的提示词
   - [ ] 不需要，当前方案可行

4. **你的初步结论**:
   - [在这里写下你的观察和建议]

---

## 📞 反馈和支持

测试过程中遇到问题或有新发现，请记录下来：

- **技术问题**: 如生成失败、Qwen 识别错误
- **流程问题**: 如测试步骤不清晰、时间估算不准
- **新发现**: 如意外的风格差异、参数敏感性

这些反馈将用于优化测试流程和改进系统。

---

**祝测试顺利！🔬**

记住：实践是检验真理的唯一标准。数据会告诉我们答案！
