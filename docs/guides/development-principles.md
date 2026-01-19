# 开发原则与最佳实践

本文档记录 PixPaw AI 项目的核心开发原则和经验教训，帮助团队避免重复踩坑。

---

## 🎯 核心原则

### 1. 框架优先原则 ⭐⭐⭐

**原则**：不要自定义框架已经处理好的东西

#### ❌ 错误示例
```typescript
// lib/supabase/client.ts
export function createClient() {
  return createBrowserClient(url, key, {
    cookies: {
      get(name) { /* 自定义逻辑 */ },
      set(name, value, options) { /* 自定义逻辑 */ },
      remove(name) { /* 自定义逻辑 */ }
    }
  })
}
```

**问题**：干扰了 Supabase SSR 的默认 cookie 机制，导致 OAuth 登录后客户端无法读取 session。

#### ✅ 正确示例
```typescript
// lib/supabase/client.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**为什么**：
- `@supabase/ssr` 在浏览器环境会自动使用 `document.cookie`
- 框架的默认配置经过大量测试和优化
- 自定义反而可能破坏内部机制

**何时可以自定义**：
- 框架文档明确说明需要自定义的场景
- 有充分的测试覆盖
- 团队充分理解自定义的后果

---

### 2. KISS 原则（Keep It Simple, Stupid）⭐⭐⭐

**原则**：简单优于复杂

#### ❌ 过度工程化
```typescript
// 5次重试 + 延迟 + 双重检查
let user = null
let attempts = 0
const maxAttempts = 5

while (!user && attempts < maxAttempts) {
  attempts++
  await new Promise(resolve => setTimeout(resolve, 1500))
  const { data: sessionData } = await supabase.auth.getSession()
  const { data } = await supabase.auth.getUser()
  if (data?.user) user = data.user
}
```

#### ✅ 简单直接
```typescript
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
setUser(user)
```

**为什么简单更好**：
- 更容易理解和维护
- 更少的 bug 机会
- 框架已经处理了大部分边界情况

---

### 3. 彻底回退原则 ⭐⭐

**原则**：回退功能时，要回退干净

#### ❌ 不完整回退
```
删除了功能调用代码 ✅
但保留了自定义配置 ❌
留下了复杂的辅助逻辑 ❌
```

#### ✅ 完整回退
```bash
# 推荐：使用 git revert
git revert <commit-hash>

# 或手动回退时检查清单：
# 1. 删除新增的文件
# 2. 恢复修改的配置
# 3. 移除引入的依赖
# 4. 清理相关的辅助代码
```

**检查清单**：
- [ ] 新增的文件是否都删除？
- [ ] 修改的配置是否恢复？
- [ ] 相关的辅助函数是否清理？
- [ ] 测试是否通过？

---

### 4. 数据持久化原则 ⭐⭐

**原则**：只保存可序列化的数据到 localStorage

#### ❌ 错误做法
```typescript
// File 对象无法保存到 localStorage
localStorage.setItem('file', uploadedFile)  // ❌

// 验证时只检查 File 对象
if (!uploadedFile) return  // ❌ 恢复后会失败
```

#### ✅ 正确做法
```typescript
// 保存字符串 URL
const config = {
  uploadedImageUrl: 'https://...',  // ✅ 可序列化
  selectedStyle: 'Pixar',
  timestamp: Date.now()
}
localStorage.setItem('config', JSON.stringify(config))

// 验证时检查所有可能的数据源
if (!uploadedFile && !uploadedImageUrl) return  // ✅
```

**可保存的类型**：
- ✅ 字符串、数字、布尔值
- ✅ 普通对象、数组
- ❌ File、Blob、ArrayBuffer
- ❌ Function、Promise
- ❌ DOM 元素、React 组件

---

### 5. 验证逻辑要全面 ⭐

**原则**：考虑所有可能的数据来源

#### ❌ 不完整的验证
```typescript
if (!uploadedFile) {
  setError('Please upload a photo')
  return
}
```

**问题**：登录后恢复配置时，只有 `uploadedImageUrl` 没有 `uploadedFile`。

#### ✅ 完整的验证
```typescript
if (!uploadedFile && !uploadedImageUrl) {
  console.error('[Component] Missing required data:', {
    hasFile: !!uploadedFile,
    hasImageUrl: !!uploadedImageUrl
  })
  setError('Please upload a photo')
  return
}
```

**验证清单**：
- [ ] 新用户的情况（没有任何数据）
- [ ] 已登录用户的情况（可能有缓存数据）
- [ ] 恢复配置的情况（只有部分数据）
- [ ] 错误处理（数据格式不对）

---

### 6. 调试日志原则 ⭐

**原则**：关键流程添加详细日志

#### ❌ 无用的日志
```typescript
console.log('user:', user)  // 太简单
console.log(data)          // 没有上下文
```

#### ✅ 有用的日志
```typescript
console.log('[UploadModalWizard] User:', user ? `${user.email} (${user.id})` : 'Not logged in')

console.log('[handleGenerate] 💾 Saving config before login:', {
  hasImageUrl: !!uploadedImageUrl,
  style: selectedStyle,
  petName: petName
})

console.error('[Component] ❌ Failed:', {
  error: error.message,
  hasFile: !!uploadedFile,
  hasUrl: !!uploadedImageUrl
})
```

**好日志的特点**：
- 包含组件/函数名称
- 使用图标标识状态（✅ ❌ 💾 🔐）
- 提供上下文信息
- 便于搜索和过滤

---

## 📝 开发清单

### 实现新功能前

- [ ] 框架是否已经提供类似功能？
- [ ] 是否有官方文档说明最佳实践？
- [ ] 是否需要自定义，还是用默认配置即可？
- [ ] 复杂度是否最小化？

### 代码审查时

- [ ] 是否过度工程化？
- [ ] 是否自定义了不该自定义的东西？
- [ ] 验证逻辑是否全面？
- [ ] 是否有足够的调试日志？

### 回退功能时

- [ ] 新增的文件是否删除？
- [ ] 修改的配置是否恢复？
- [ ] 相关的辅助代码是否清理？
- [ ] 是否有遗留的"僵尸代码"？

---

## 🚨 常见陷阱

### 1. "我需要更好地控制 X"

**陷阱**：认为自定义可以更好地控制行为。

**现实**：99% 的情况下，框架的默认行为已经足够好。

**解决**：
1. 先用默认配置
2. 遇到问题查文档
3. 确认无法满足需求后再自定义
4. 充分测试自定义逻辑

### 2. "我的场景很特殊"

**陷阱**：认为自己的场景是独特的，需要特殊处理。

**现实**：大多数"特殊场景"都是常见问题。

**解决**：
1. 搜索 GitHub Issues
2. 查看官方示例
3. 询问社区
4. 检查是否理解错了需求

### 3. "这只是临时的 workaround"

**陷阱**：添加"临时"代码，最后成为永久技术债。

**现实**：临时代码很少被清理。

**解决**：
1. 不要添加临时代码
2. 要么正确实现，要么不做
3. 如果必须临时，设置提醒清理
4. 添加 TODO 注释

---

## 📚 扩展阅读

### Next.js 相关
- [Next.js 15 App Router 文档](https://nextjs.org/docs)
- [Server Actions 最佳实践](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

### Supabase 相关
- [Supabase SSR 文档](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Auth 最佳实践](https://supabase.com/docs/guides/auth)

### 通用原则
- [KISS 原则](https://en.wikipedia.org/wiki/KISS_principle)
- [YAGNI (You Aren't Gonna Need It)](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it)

---

## 📅 更新日志

### 2026-01-19
- **初始版本**：基于 OAuth 登录修复的经验教训
- 核心原则：框架优先、KISS、彻底回退、数据持久化、验证全面、调试日志

---

**记住**：当你觉得需要"hack"或"绕过"框架时，先问自己：**是不是用错了？**
