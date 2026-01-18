# 🎨 Admin Styles 数据库迁移指南

## ✅ 已完成的修改

### 1. 创建了数据库同步脚本
**文件：** `scripts/sync-styles-to-database.sql`

这个SQL脚本会：
- 删除9个低质量风格
- 插入/更新5个高质量风格到数据库
- 包含所有必要字段（emoji, preview_image_url等）

### 2. 创建了 useStyles Hook
**文件：** `lib/hooks/use-styles.ts`

功能：
- 从数据库 `/api/admin/styles` 读取风格
- 自动转换数据库格式到前端格式
- 失败时自动fallback到硬编码风格
- 只显示 `is_enabled=true` 的风格

### 3. 更新了所有组件使用数据库风格

**修改的文件：**
- ✅ `components/upload-modal-wizard.tsx` - 上传界面
- ✅ `components/style-showcase.tsx` - 首页风格展示
- ✅ `app/[lang]/admin/test-lab/page.tsx` - Test Lab

**现在的架构：**
```
Admin Styles (Supabase 数据库)
    ↓
useStyles Hook (自动获取)
    ↓
├─ 首页展示 ✅
├─ 上传界面 ✅  
├─ Test Lab ✅
└─ API 生成 ✅
```

---

## 🚀 执行步骤

### Step 1: 同步风格到数据库

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `scripts/sync-styles-to-database.sql` 的内容
4. 执行SQL

**预期结果：**
```
✅ 删除9个旧风格
✅ 插入5个新风格
✅ 查询显示5行数据
```

### Step 2: 重启开发服务器

```bash
# 清理缓存并重启
rm -rf .next
npm run dev
```

### Step 3: 测试验证

访问以下页面确认：

1. **首页** (`http://localhost:3000/en`)
   - ✅ 应该显示5个真实风格（从数据库读取）
   - ✅ 可能显示3个"Coming Soon"占位符（如果风格<8个）

2. **上传界面** (点击 "Create Now")
   - ✅ "Choose a Style" 显示5个风格（从数据库）

3. **Admin - Styles** (`http://localhost:3000/en/admin/styles`)
   - ✅ 显示5个启用的风格
   - ✅ 可以添加/编辑/删除风格

4. **Admin - Test Lab** (`http://localhost:3000/en/admin/test-lab`)
   - ✅ 风格下拉菜单显示5个风格（从数据库）

---

## 🎯 现在你可以做什么

### ✨ 在 Admin 界面管理风格

1. **添加新风格：**
   - 进入 `/en/admin/styles`
   - 点击"添加新风格"
   - 填写表单（ID, Name, Prompt Suffix等）
   - 保存

2. **新风格会自动同步到：**
   - ✅ 首页展示
   - ✅ 上传界面
   - ✅ Test Lab
   - ✅ API生成

3. **禁用风格：**
   - 点击"眼睛"图标禁用
   - 禁用后不会显示在前端，但数据保留

4. **删除风格：**
   - 点击"垃圾桶"图标永久删除

---

## 📊 数据库表结构

**表名：** `styles`

**关键字段：**
- `id` (string) - 唯一标识，如 "Christmas-Vibe"
- `name` (string) - 显示名称，如 "Merry Christmas"
- `emoji` (string) - 可选，如 "🎅"
- `prompt_suffix` (text) - 提示词后缀（核心）
- `preview_image_url` (string) - 预览图路径
- `is_enabled` (boolean) - 是否启用
- `sort_order` (integer) - 排序顺序

---

## 🔄 Fallback机制

如果数据库读取失败，系统会：
1. 在控制台显示警告
2. 自动使用 `lib/styles.ts` 的硬编码风格
3. 用户不会看到错误，功能正常

---

## ⚠️ 注意事项

### 1. 图片路径
数据库中的 `preview_image_url` 应该是：
- ✅ `/iShot_2026-01-16_15.15.27.png` (相对路径)
- ❌ 不要用完整URL

### 2. ID命名规范
- 使用 kebab-case: `My-Style-Name`
- 不要有空格或特殊字符
- 与 `style-tiers.ts` 中的配置保持一致

### 3. Prompt Suffix格式
- 必须以逗号开头: `, wearing a hat...`
- 这样可以直接拼接到主提示词后面

---

## 🧪 测试清单

- [ ] 执行SQL同步脚本
- [ ] 重启开发服务器
- [ ] 首页显示5个风格
- [ ] 上传界面显示5个风格
- [ ] Test Lab显示5个风格
- [ ] Admin可以添加新风格
- [ ] 新风格立即出现在所有页面
- [ ] 禁用风格后不显示在前端
- [ ] 删除风格后从所有地方消失

---

## 🎉 完成！

现在你的 Admin Styles 管理系统已经完全启用！

**工作流程：**
1. 在 Admin 界面添加/测试新风格
2. 在 Test Lab 中验证生成质量
3. 启用风格 → 自动出现在首页和上传界面
4. 禁用/删除风格 → 自动从所有地方移除

**不再需要：**
- ❌ 手动编辑 `lib/styles.ts`
- ❌ 重新部署代码
- ❌ 担心数据不同步

一切都通过 Admin 界面可视化管理！🚀
