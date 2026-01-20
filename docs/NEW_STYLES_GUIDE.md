# 新风格使用指南

## 📸 Magazine Chic（时尚杂志风格）

### 风格特点
- 高端时尚杂志编辑摄影风格
- 设计师配饰（太阳镜、西装、领巾、胸针、相机）
- 温暖的工作室光线和米色背景
- 超写实商业摄影质感

### 最佳参数配置
```json
{
  "prompt_strength": 0.85-0.92,
  "guidance": 2.0-2.5,
  "num_inference_steps": 50,
  "output_quality": 95,
  "go_fast": false,
  "aspect_ratio": "3:4" 或 "1:1"
}
```

### 关键成功因素
1. **高 strength (0.85-0.92)**：需要生成精细的配饰细节
2. **中等 guidance (2.0-2.5)**：平衡写实感和风格化
3. **guidance 不能低于 2.0**：否则模型不听从指令，背景和色调会失控
4. **color_quality = 95**：确保材质细节清晰

### 色彩协调建议
- **橙色猫** → 橙色西装 + 米黄背景 + 金色光线
- **白色猫** → 米色/奶油色西装 + 温暖米色背景 + 柔和暖光
- **黑色猫** → 深灰/炭色西装 + 暖棕色背景 + 边缘光

### 提示词模板
```
[pet_description], elegantly dressed as a fashion photographer, 
wearing stylish oversized designer sunglasses and a luxurious [color] 
textured blazer, silk scarf with decorative brooch, holding a vintage camera, 
professional low-angle fashion portrait, WARM CREAMY BEIGE BACKGROUND, 
soft golden studio lighting, warm color palette, vogue editorial style, 
ultra-realistic, SHARP FOCUS, rich textures, 8k resolution
```

---

## 🎨 Wes Anderson Pop（韦斯·安德森波普艺术）

### 风格特点
- 对称构图（Wes Anderson 标志性风格）
- 强烈的色彩分块（纯色背景 + 鲜艳服装）
- 波普艺术美学
- 几何感和秩序感

### 最佳参数配置
```json
{
  "prompt_strength": 0.88-0.95,
  "guidance": 2.0,
  "num_inference_steps": 50,
  "output_quality": 80,
  "go_fast": true,
  "aspect_ratio": "1:1"
}
```

### 关键成功因素
1. **超高 strength (0.92)**：完全改变原图色彩和风格
2. **固定 guidance (2.0)**：保持艺术风格的一致性
3. **go_fast = true**：艺术风格可以牺牲部分细节换取速度
4. **对称构图**：在提示词中强调 "symmetrical"

### 色彩组合建议
```
经典组合：
- 亮黄色雨衣 + 天蓝色背景
- 粉红色外套 + 薄荷绿背景
- 橙色西装 + 紫色背景
- 红色连帽衫 + 黄色背景

原则：高饱和度对比色 + 纯色背景
```

### 提示词模板
```
A symmetrical fashion editorial portrait of a [pet_type], 
[pet_features], anthropomorphically dressed in glossy bright [color1] 
[clothing] with [details], wearing oversized translucent [color2] sunglasses, 
wearing a matching [color1] bucket hat, clean solid vivid [color3] background, 
Wes Anderson cinematic style, strong color blocking, pop art aesthetic, 
geometric composition, soft studio lighting, sharp focus, highly detailed
```

---

## 🔑 关键参数对比

| 风格 | Strength | Guidance | Steps | Quality | Go Fast | 适合比例 |
|------|----------|----------|-------|---------|---------|----------|
| **Magazine Chic** | 0.85-0.92 | 2.0-2.5 | 50 | 95 | false | 3:4, 1:1 |
| **Wes Anderson Pop** | 0.88-0.95 | 2.0 | 50 | 80 | true | 1:1 |

---

## ⚠️ 常见问题和解决方案

### Q1: Magazine Chic 背景色调不对（还是灰蓝色）
**原因**：guidance 太低（如 1.4）导致模型不听从指令  
**解决**：将 guidance 提高到至少 2.0

### Q2: Magazine Chic 清晰度不够
**原因**：
1. output_quality 设置太低
2. 提示词中缺少 "SHARP FOCUS, 8k resolution"
3. go_fast 开启了

**解决**：
- output_quality = 95
- go_fast = false
- 提示词中用大写强调 "SHARP FOCUS"

### Q3: Wes Anderson Pop 颜色不够鲜艳
**原因**：prompt_strength 太低  
**解决**：提高到 0.92 或更高

### Q4: 配饰生成不够精细
**原因**：prompt_strength 太低（< 0.80）  
**解决**：配饰类风格需要 strength >= 0.85

---

## 📊 测试结果总结

### Magazine Chic 成功案例
- **White Cat**: strength=0.9, guidance=2.05, steps=40 ✅
- **Orange Cat**: strength=0.87, guidance=1.9, steps=50 ✅

### 失败案例教训
- strength=0.01: 几乎无变化 ❌
- guidance=1.4: 背景和色调失控 ❌
- 未强调背景色: 默认变成灰色 ❌

### 最佳实践
1. **写实风格**：高 strength (0.85+) + 中等 guidance (2.0-2.5)
2. **艺术风格**：超高 strength (0.90+) + 固定 guidance (2.0)
3. **提示词工程**：用大写强调关键词，重复重要元素
4. **色彩协调**：服装色 ≈ 宠物色 + 和谐背景色 = 高级感

---

生成日期：2026-01-20  
测试平台：Replicate FLUX-dev  
