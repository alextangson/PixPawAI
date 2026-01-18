# Phase 6.2: 灰度测试指南

## 🎯 目标

对管理员账号启用新的 Prompt 系统，验证实际生成效果，确保核心 bug 已修复。

## ✅ Phase 6.1 完成状态

- [x] 新 Prompt 系统已集成到 `/api/generate`
- [x] 功能开关控制（USE_NEW_PROMPT_SYSTEM）
- [x] Negative prompt 支持
- [x] 详细日志记录
- [x] 旧系统作为 fallback
- [x] 代码已部署到生产环境

## 🔧 启用灰度测试

### 步骤 1：在 Vercel 添加环境变量

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择 `PixPawAI` 项目
3. 进入 **Settings** → **Environment Variables**
4. 添加新变量：
   - **Name**: `NEXT_PUBLIC_USE_NEW_PROMPT_SYSTEM`
   - **Value**: `true`
   - **Environment**: 选择 `Production`, `Preview`, `Development` （全部勾选）
5. 点击 **Save**

### 步骤 2：触发重新部署

1. 在 Vercel Dashboard，进入 **Deployments** 标签
2. 找到最新的部署记录
3. 点击右侧的 **⋯** 菜单
4. 选择 **Redeploy**
5. 等待部署完成（约 2-3 分钟）

### 步骤 3：验证环境变量生效

1. 访问你的网站：`https://pixpawai.com`
2. 打开浏览器开发者工具（F12）
3. 在 Console 中运行：
   ```javascript
   console.log(process.env.NEXT_PUBLIC_USE_NEW_PROMPT_SYSTEM)
   ```
4. 应该看到输出：`true`

---

## 🧪 测试步骤

### 测试用例 1：上传猫 → 生成猫（核心 bug 修复验证）

**目标**：验证上传猫不会生成狗

1. 登录你的管理员账号
2. 上传一张**猫的照片**
3. 选择风格：`Watercolor Dream`
4. Pet Name 留空或填写 "Kitty"
5. 点击 **Generate**
6. 等待生成完成

**预期结果**：
- ✅ 生成的图片是**猫**，不是狗
- ✅ 猫的毛色正确（不会变成白色）
- ✅ 猫的品种特征保留

**如何验证新系统已启用**：
- 打开浏览器开发者工具（F12）→ Console
- 搜索日志：`Using NEW prompt system`
- 应该看到详细的 prompt building 日志

---

### 测试用例 2：异瞳狗 → 异瞳保留

**目标**：验证异瞳特征正确保留

1. 上传一张**异瞳狗**的照片（如哈士奇）
2. 选择风格：`3D Render` 或 `Oil Painting`
3. 点击 **Generate**

**预期结果**：
- ✅ 生成的图片保留异瞳特征
- ✅ 两只眼睛颜色不同（如一蓝一棕）
- ✅ Qwen 识别的 heterochromia details 被正确应用

---

### 测试用例 3：用户自定义提示词优先级

**目标**：验证用户输入 > Qwen 识别

1. 上传一张**黑色拉布拉多**的照片
2. Pet Name 填写：`white Samoyed`（故意不匹配）
3. 选择风格：`Cartoon Pop`
4. 点击 **Generate**

**预期结果**：
- ✅ 生成的图片应该倾向于白色 Samoyed 风格
- ✅ 用户输入的特征优先级高于 Qwen 识别
- ⚠️ 注意：可能会混合一些原始狗的姿势/背景

---

### 测试用例 4：提示词冲突清理

**目标**：验证 promptSuffix 中的硬编码特征被清理

1. 上传一张**橙色猫**的照片
2. 选择风格：包含 "soft white fur" 的风格（如 `Christmas Vibe`）
3. Pet Name 留空
4. 点击 **Generate**

**预期结果**：
- ✅ 生成的猫是**橙色**，不是白色
- ✅ 最终 prompt 中**不应该**包含 "white fur"
- ✅ 检查 Console 日志中的 "Conflicts Detected" 部分

**如何查看冲突检测日志**：
1. F12 → Console
2. 搜索：`[Prompt Builder] Conflicts Detected`
3. 应该看到检测到的冲突和清理结果

---

## 📊 成功标准

### 必须通过：
- [ ] 上传猫 → 生成猫（不是狗）✅
- [ ] 异瞳狗 → 异瞳正确保留 ✅
- [ ] 提示词中无硬编码颜色冲突 ✅

### 推荐验证：
- [ ] 用户自定义优先级正确工作
- [ ] Console 日志显示 "Using NEW prompt system"
- [ ] 生成质量与旧系统相当或更好
- [ ] 没有意外错误或崩溃

---

## 🐛 问题排查

### 问题 1：没有看到 "Using NEW prompt system" 日志

**可能原因**：
- 环境变量未生效
- 需要重新部署

**解决方案**：
1. 检查 Vercel 环境变量是否正确设置
2. 重新部署应用
3. 清除浏览器缓存并刷新

---

### 问题 2：生成失败或报错

**可能原因**：
- 新系统代码有 bug
- Replicate API 调用失败

**解决方案**：
1. 查看 Vercel 部署日志（Deployments → Logs）
2. 如果是新系统问题，代码会自动 fallback 到旧系统
3. 如果多次失败，暂时关闭新系统：
   - 在 Vercel 环境变量中将 `NEXT_PUBLIC_USE_NEW_PROMPT_SYSTEM` 改为 `false`
   - 重新部署

---

### 问题 3：生成质量下降

**可能原因**：
- Negative prompt 过于严格
- 特征优先级不合理

**解决方案**：
1. 在 Test Lab 中测试相同图片和风格
2. 对比新旧系统生成的 prompt
3. 如需调整，可以：
   - 修改 `lib/prompt-system/prompt-builder.ts` 中的逻辑
   - 调整 conflict cleaner 的规则

---

## 📝 测试反馈模板

完成测试后，请提供以下反馈：

```
### 测试结果

**测试用例 1（猫 → 猫）**：
- 结果：✅ 通过 / ❌ 失败
- 截图：[上传截图]
- 备注：

**测试用例 2（异瞳保留）**：
- 结果：✅ 通过 / ❌ 失败
- 截图：[上传截图]
- 备注：

**测试用例 3（用户优先级）**：
- 结果：✅ 通过 / ❌ 失败
- 备注：

**测试用例 4（冲突清理）**：
- 结果：✅ 通过 / ❌ 失败
- Console 日志截图：[上传截图]

**整体评价**：
- 生成质量：⭐⭐⭐⭐⭐ (1-5星)
- 是否推荐全量上线：是 / 否
- 其他问题或建议：
```

---

## ✅ 下一步（检查点 6 通过后）

如果测试全部通过，我们将进入 **Phase 6.3 - 全量上线**：
1. 保持环境变量 `USE_NEW_PROMPT_SYSTEM=true`
2. 监控错误日志 24 小时
3. 收集用户反馈
4. 如无问题，进入 Phase 7（清理旧代码）

---

**准备好了吗？开始测试吧！** 🚀

完成后请告诉我测试结果。
