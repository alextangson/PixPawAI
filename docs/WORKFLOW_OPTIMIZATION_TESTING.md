# 工作流优化测试指南

> 测试智能混合方案（Three-Tier Strategy）的4种关键场景

---

## 测试目标

验证优化后的工作流能够：
1. ✅ 99%情况下只调用2次Qwen（quick + detailed）
2. ✅ 用户快速点击时智能等待
3. ✅ 详细分析失败时降级到quick
4. ✅ 所有情况都有fallback，不会失败

---

## 测试环境准备

### 1. 检查日志输出

确保以下日志可见：

```typescript
// 前端日志
console.log('⚡ Quick Check Result:', quickResult)
console.log('✅ Detailed Analysis Complete:', result)
console.log('📊 Analysis Status:', { status, hasDetailed, hasQuick })

// 后端日志
console.log('✅ Using frontend detailed analysis')
console.warn('⚠️ Detailed analysis unavailable, using quick analysis fallback')
console.error('❌ No frontend analysis provided, running backend analysis')
console.log('📊 Analysis Data Source: DETAILED/QUICK/BACKEND')
```

### 2. 准备测试图片

- **高质量宠物图片**：清晰的狗狗/猫咪照片（用于正常流程）
- **低质量图片**：模糊的宠物照片（用于质量警告测试）
- **非宠物图片**：风景照（用于错误处理测试）

---

## 测试场景

### 场景1：正常流程（最常见）

**预期：** 使用 detailedAnalysis，后端不调用Qwen

#### 操作步骤

1. 打开上传弹窗
2. 上传高质量宠物图片
3. 等待 5-8 秒（让详细分析完成）
4. 选择风格
5. 点击"生成"

#### 验证点

**前端日志：**
```
⚡ Quick Check Result: { hasPet: true, petType: "dog", quality: "good" }
🔍 Starting detailed analysis in background...
✅ Detailed Analysis Complete: { breed: "Golden Retriever", ... }
📊 Analysis Status: { status: "detailed", hasDetailed: true, hasQuick: true }
```

**后端日志：**
```
✅ Using frontend detailed analysis
✅ Detailed Analysis Data: { source: "frontend-detailed", breed: "Golden Retriever" }
📊 Analysis Data Source: DETAILED
```

**数据库验证：**
```sql
SELECT metadata->>'analysisDataSource' as source
FROM generations
WHERE id = '<generation_id>';

-- 预期结果: "detailed"
```

**✅ 通过标准：**
- [ ] Qwen 只被调用 2 次（quick + detailed）
- [ ] 后端使用 detailedAnalysis
- [ ] metadata.analysisDataSource = "detailed"
- [ ] 生成成功

---

### 场景2：快速点击（用户不耐心）

**预期：** 智能等待，最终使用 detailedAnalysis

#### 操作步骤

1. 打开上传弹窗
2. 上传高质量宠物图片
3. **立即点击生成**（< 1秒，详细分析未完成）
4. 观察等待提示

#### 验证点

**前端日志：**
```
⚡ Quick Check Result: { hasPet: true, ... }
🔍 Starting detailed analysis in background...
⏳ Detailed analysis in progress, waiting up to 10 seconds...
✅ Detailed analysis completed during wait
📊 Analysis Status: { status: "detailed", hasDetailed: true }
```

**用户界面：**
- 显示提示："正在分析宠物特征，请稍候..."
- 进度条或加载动画
- 3-8秒后开始生成

**后端日志：**
```
✅ Using frontend detailed analysis
📊 Analysis Data Source: DETAILED
```

**✅ 通过标准：**
- [ ] 前端显示等待提示
- [ ] 等待时间 < 10秒
- [ ] 最终使用 detailedAnalysis
- [ ] metadata.analysisDataSource = "detailed"
- [ ] 用户体验流畅（无卡顿）

---

### 场景3：详细分析失败（API错误）

**预期：** 降级到 quickAnalysis，生成仍成功

#### 操作步骤

1. **模拟详细分析失败**：
   - 方法A：临时注释 `/api/check-quality` 的响应
   - 方法B：在 `performDetailedAnalysis` 中强制抛出错误
   
```typescript
// 临时测试代码
const performDetailedAnalysis = async (imageUrl: string, petType: string) => {
  throw new Error('Simulated API failure') // 测试用
  // ... 原有代码
}
```

2. 上传高质量宠物图片
3. 等待 5 秒
4. 点击生成

#### 验证点

**前端日志：**
```
⚡ Quick Check Result: { hasPet: true, petType: "dog" }
🔍 Starting detailed analysis in background...
Detailed analysis error: Simulated API failure
📊 Analysis Status: { status: "quick", hasDetailed: false, hasQuick: true }
```

**后端日志：**
```
⚠️ Detailed analysis unavailable, using quick analysis fallback
⚠️ Quick Analysis Data: { source: "frontend-quick", petType: "dog" }
⚠️ AnalysisDegradation: { reason: "detailed_analysis_missing" }
📊 Analysis Data Source: QUICK
```

**数据库验证：**
```sql
SELECT metadata->>'analysisDataSource' as source
FROM generations
WHERE id = '<generation_id>';

-- 预期结果: "quick"
```

**✅ 通过标准：**
- [ ] 详细分析失败但不影响生成
- [ ] 后端使用 quickAnalysis
- [ ] metadata.analysisDataSource = "quick"
- [ ] 生成成功（可能略不准确但可用）
- [ ] 降级事件被记录到日志

---

### 场景4：极端情况（所有前端分析都失败）

**预期：** 后端 fallback，记录错误日志

#### 操作步骤

1. **模拟所有前端分析失败**：

```typescript
// 临时测试代码 - 在 handleGenerate 中
const response = await fetch('/api/generate', {
  body: JSON.stringify({
    // ... 其他参数
    detailedAnalysis: null,  // 强制为 null
    quickAnalysis: null,     // 强制为 null
  })
})
```

2. 上传高质量宠物图片
3. 点击生成

#### 验证点

**后端日志：**
```
❌ No frontend analysis provided, running backend analysis (SLOW)
❌ Backend Analysis Data: { source: "backend-fallback", warning: "Extra Qwen API call" }
🚨 BackendAnalysisFallback: { reason: "all_frontend_analysis_missing" }
📊 Analysis Data Source: BACKEND
```

**数据库验证：**
```sql
SELECT metadata->>'analysisDataSource' as source
FROM generations
WHERE id = '<generation_id>';

-- 预期结果: "backend"
```

**监控告警：**
- 应该触发错误日志（logger.error）
- 如果配置了Sentry，应该收到告警

**✅ 通过标准：**
- [ ] 生成仍然成功（不会失败）
- [ ] 后端调用了 analyzePetFeatures（第3次Qwen）
- [ ] metadata.analysisDataSource = "backend"
- [ ] 错误日志被记录
- [ ] 标记为需要调查的异常情况

---

## 性能指标验证

### 1. Qwen调用次数统计

运行以下SQL查询统计数据来源分布：

```sql
-- 统计最近100次生成的数据来源
SELECT 
  metadata->>'analysisDataSource' as source,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM generations
WHERE created_at > NOW() - INTERVAL '1 day'
  AND metadata->>'analysisDataSource' IS NOT NULL
GROUP BY metadata->>'analysisDataSource'
ORDER BY count DESC;
```

**预期结果：**
```
source    | count | percentage
----------|-------|------------
detailed  |   95  |   95.00%    ✅ 目标：> 90%
quick     |    4  |    4.00%    ⚠️  可接受：< 10%
backend   |    1  |    1.00%    ❌ 需调查：< 1%
```

### 2. 用户等待时间

测量从上传到生成开始的时间：

```typescript
// 前端添加计时
const uploadStartTime = Date.now()

// 在 handleGenerate 开始时
const waitTime = Date.now() - uploadStartTime
console.log(`⏱️ User wait time: ${waitTime}ms`)
```

**预期结果：**
- 正常流程：5-8秒（详细分析时间）
- 快速点击：8-12秒（等待 + 分析）
- 降级流程：1-3秒（只用quick）

### 3. 生成成功率

```sql
-- 统计成功率
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM generations
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY status;
```

**预期结果：**
```
status      | count | percentage
------------|-------|------------
succeeded   |   98  |   98.00%    ✅ 目标：> 95%
failed      |    2  |    2.00%
```

---

## 回归测试

确保优化没有破坏现有功能：

### 基础功能

- [ ] 上传图片正常
- [ ] 质量检查警告正常显示
- [ ] 风格选择正常
- [ ] 生成按钮可点击
- [ ] 进度条正常显示
- [ ] 结果模态框正常显示

### 特殊场景

- [ ] Guest用户上传正常
- [ ] 登录用户上传正常
- [ ] Credits不足时正常提示
- [ ] 网络错误时正常处理
- [ ] 不同aspect ratio正常生成

---

## 故障排查

### 问题：后端仍然调用3次Qwen

**可能原因：**
1. 前端没有正确传递 detailedAnalysis
2. 前端没有正确传递 quickAnalysis
3. 数据格式不匹配

**排查步骤：**
```typescript
// 1. 检查前端发送的数据
console.log('Sending to backend:', {
  detailedAnalysis,
  quickAnalysis
})

// 2. 检查后端接收的数据
console.log('Received in backend:', {
  detailedAnalysis: body.detailedAnalysis,
  quickAnalysis: body.quickAnalysis
})

// 3. 检查条件判断
console.log('Condition check:', {
  hasDetailed: !!detailedAnalysis,
  hasQuick: !!quickAnalysis
})
```

### 问题：用户等待时间过长

**可能原因：**
1. waitForDetailedAnalysis 超时设置太长
2. 详细分析API响应慢
3. 网络延迟

**解决方案：**
```typescript
// 调整超时时间（当前10秒）
await waitForDetailedAnalysis(8000) // 改为8秒

// 或添加进度提示
setError(`正在分析... (${Math.floor(elapsed/1000)}秒)`)
```

### 问题：降级率过高（> 10%）

**可能原因：**
1. /api/check-quality 不稳定
2. Qwen API限流
3. 网络问题

**排查步骤：**
```sql
-- 查看失败原因
SELECT 
  metadata->>'analysisDataSource' as source,
  error_message,
  COUNT(*)
FROM generations
WHERE metadata->>'analysisDataSource' = 'quick'
  AND created_at > NOW() - INTERVAL '1 day'
GROUP BY source, error_message;
```

---

## 测试完成检查清单

- [ ] 场景1（正常流程）通过
- [ ] 场景2（快速点击）通过
- [ ] 场景3（详细分析失败）通过
- [ ] 场景4（极端情况）通过
- [ ] Qwen调用次数 ≤ 2次（99%情况）
- [ ] Backend fallback率 < 1%
- [ ] 生成成功率 > 99%
- [ ] 用户等待时间 ≤ 10秒
- [ ] 回归测试全部通过
- [ ] 日志记录完整
- [ ] 数据库metadata正确

---

## 生产环境监控

部署后持续监控以下指标：

### 1. 每日数据源分布

```sql
-- 每日统计
SELECT 
  DATE(created_at) as date,
  metadata->>'analysisDataSource' as source,
  COUNT(*) as count
FROM generations
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), metadata->>'analysisDataSource'
ORDER BY date DESC, count DESC;
```

### 2. Backend Fallback告警

如果 backend fallback 率 > 5%，立即调查：

```sql
-- 查找异常
SELECT 
  id,
  user_id,
  created_at,
  metadata->>'analysisDataSource' as source,
  metadata
FROM generations
WHERE metadata->>'analysisDataSource' = 'backend'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
```

### 3. 性能趋势

```sql
-- 周对比
SELECT 
  DATE_TRUNC('week', created_at) as week,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration_seconds,
  COUNT(*) as total_generations
FROM generations
WHERE status = 'succeeded'
  AND created_at > NOW() - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;
```

---

**测试负责人：** 开发团队  
**最后更新：** 2026-01-20  
**下次复查：** 部署后7天
