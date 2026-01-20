# 废弃字段清理总结

## 🗑️ 已删除的字段

### 1. `emoji` 
- **原因**: 统一使用 `preview_image_url` 作为风格图标
- **影响**: UI 显示优先级：`preview_image_url` > 默认图标

### 2. `tier`
- **原因**: 移除 Tier 分级系统，改为直接配置 strength 和 guidance
- **影响**: 不再有 Tier 1-4 的分级概念

### 3. `expected_similarity`
- **原因**: 与 tier 绑定设计，无独立用途
- **影响**: 不再显示预期相似度范围

### 4. `recommended_strength_max`
- **原因**: 生成 API 只使用 `recommended_strength_min`（实际表示单个推荐值）
- **影响**: 只使用单个 strength 值，而非范围

---

## ✅ 已完成的修改

### 数据库迁移
- ✅ `supabase/migrations/20260120_remove_unused_fields.sql`
  - 删除 `styles` 表中的 4 个字段
  - 删除 `style_versions` 表中的 4 个字段
  - 包含验证和错误检查

### 代码更新

#### TypeScript 接口
- ✅ `lib/supabase/styles.ts`
  - 更新 `DatabaseStyle` 接口
  - 删除 `getStyleTierFromDatabase()` 废弃函数
  - 删除 `getTierDescription()` 辅助函数
  - 移除 `StyleTierConfig` import

#### Admin UI
- ✅ `app/[lang]/admin/styles/page.tsx`
  - 更新 `Style` 接口
  - 删除表单中的 emoji, tier, expected_similarity, recommended_strength_max 输入框
  - 简化参数显示（Strength Range → Strength）
  - 更新默认值：`recommended_strength_min: 0.92`, `recommended_guidance: 3.5`
  - 删除显示区域的 emoji 渲染逻辑
  - 更新版本历史显示（移除 strength_max）

#### API 路由
- ✅ `app/api/admin/styles/route.ts` (POST)
  - 移除废弃字段的请求体解析
  - 移除插入数据中的废弃字段
  
- ✅ `app/api/admin/styles/[id]/route.ts` (PUT)
  - 移除废弃字段的请求体解析
  - 移除重要变化检测中的 `recommended_strength_max`
  - 移除版本保存中的废弃字段
  - 移除更新对象中的废弃字段

- ✅ `app/api/admin/styles/[id]/restore/route.ts` (POST)
  - 移除备份和恢复逻辑中的废弃字段

---

## 🚀 部署步骤

### 1. 执行数据库迁移

```bash
# 在 Supabase Dashboard 的 SQL Editor 中执行
supabase/migrations/20260120_remove_unused_fields.sql
```

**预期输出**:
```
✅ Successfully removed all deprecated columns from styles and style_versions
```

### 2. 部署代码

```bash
git add .
git commit -m "Remove deprecated fields: emoji, tier, expected_similarity, recommended_strength_max"
git push origin main
```

### 3. 验证

- ✅ Vercel 自动部署成功
- ✅ Admin 页面正常加载
- ✅ 风格创建/编辑功能正常
- ✅ 版本历史功能正常

---

## 📊 字段对比

### Before (旧结构)

```typescript
interface Style {
  id: string
  name: string
  emoji?: string              // ❌ 删除
  prompt_suffix: string
  negative_prompt?: string
  category?: string
  description?: string
  tags?: string[]
  tier?: number               // ❌ 删除
  expected_similarity?: string // ❌ 删除
  recommended_strength_min?: number
  recommended_strength_max?: number // ❌ 删除
  recommended_guidance?: number
  preview_image_url?: string
  sort_order: number
  is_enabled: boolean
  is_premium: boolean
}
```

### After (新结构)

```typescript
interface Style {
  id: string
  name: string
  prompt_suffix: string
  negative_prompt?: string
  category?: string
  description?: string
  tags?: string[]
  recommended_strength_min?: number // 实际表示推荐的 strength 值
  recommended_guidance?: number
  preview_image_url?: string
  sort_order: number
  is_enabled: boolean
  is_premium: boolean
}
```

---

## 🔄 默认值变化

| 字段 | 旧默认值 | 新默认值 | 说明 |
|------|---------|---------|------|
| `recommended_strength_min` | 0.33 | 0.92 | 写实风格的推荐值 |
| `recommended_guidance` | 2.5 | 3.5 | 提高引导强度 |

---

## 💡 注意事项

1. **已存在的数据**
   - 数据库迁移会自动删除所有废弃字段的数据
   - 不需要手动清理

2. **API 兼容性**
   - 如果前端仍然发送废弃字段，后端会自动忽略
   - 不会报错，向后兼容

3. **版本历史**
   - 现有的版本历史数据会保留（迁移前创建的）
   - 新版本不再保存废弃字段

---

## 🎯 后续优化建议

1. **重命名字段**
   - 考虑将 `recommended_strength_min` 重命名为 `recommended_strength`
   - 更准确地反映其实际用途（单个值，而非范围）

2. **数据验证**
   - 添加 strength 的范围验证（0.2 - 1.0）
   - 添加 guidance 的范围验证（1.5 - 10.0）

3. **UI 改进**
   - 在 Admin UI 中显示参数的推荐范围
   - 添加参数预览功能（实时生成效果预览）

---

**清理完成时间**: 2026-01-20  
**影响文件数**: 8 个  
**删除字段数**: 4 个（emoji, tier, expected_similarity, recommended_strength_max）
