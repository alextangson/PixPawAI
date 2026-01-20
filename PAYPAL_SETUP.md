# 🚀 PayPal 支付集成完整配置指南

## 📋 概述

已完成的功能：
- ✅ 数据库表（payments）
- ✅ PayPal API 路由（create-order, capture, webhook）
- ✅ 前端支付组件（支持 PayPal、信用卡、Apple Pay、Google Pay）
- ✅ 自动充值 credits 系统
- ✅ Webhook 安全验证

---

## 🔧 第一步：配置环境变量

在项目根目录创建 `.env.local` 文件，添加以下内容：

```bash
# ============================================
# PAYPAL 配置
# ============================================
PAYPAL_ENVIRONMENT=sandbox  # 测试环境，上线后改为 production

# PayPal API 凭证（从开发者控制台获取）
PAYPAL_CLIENT_ID=你的_Client_ID
PAYPAL_CLIENT_SECRET=你的_Client_Secret
PAYPAL_WEBHOOK_ID=你的_Webhook_ID  # 第三步后填写

# 前端 SDK 使用（和上面的 Client ID 相同）
NEXT_PUBLIC_PAYPAL_CLIENT_ID=你的_Client_ID

# 网站地址（用于支付回调）
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # 本地测试
# NEXT_PUBLIC_SITE_URL=https://pixpaw.ai  # 生产环境

# ============================================
# 其他必需的环境变量（如果还没有）
# ============================================
NEXT_PUBLIC_SUPABASE_URL=你的_Supabase_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_Anon_Key
SUPABASE_SERVICE_ROLE_KEY=你的_Service_Role_Key  # Webhook 需要
```

---

## 🎯 第二步：获取 PayPal 凭证

### 2.1 登录 PayPal 开发者控制台

访问：https://developer.paypal.com/dashboard/

### 2.2 创建 Sandbox App（测试用）

1. 点击左侧 **"Apps & Credentials"**
2. 确保在 **"Sandbox"** 标签页
3. 点击 **"Create App"** 按钮
4. 填写信息：
   - App Name: `PixPaw AI Sandbox`
   - App Type: `Merchant`
5. 点击 **"Create App"**

### 2.3 获取 API 凭证

创建 App 后，你会看到：
- **Client ID**（公开的，可以在前端使用）
- **Secret**（私密的，只能在服务端使用）

复制这两个值到 `.env.local`：

```bash
PAYPAL_CLIENT_ID=你的_Sandbox_Client_ID
PAYPAL_CLIENT_SECRET=你的_Sandbox_Secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=你的_Sandbox_Client_ID
```

### 2.4 配置 App Settings

在 App 设置页面，确保勾选：
- ✅ **Accept payments**
- ✅ **Advanced Credit and Debit Card Payments**（信用卡直接支付）

---

## 🔔 第三步：设置 Webhook

### 3.1 创建 Webhook

1. 在 PayPal 开发者控制台，点击左侧 **"Webhooks"**
2. 点击 **"Add Webhook"**
3. 填写信息：

**Webhook URL:**
```
http://localhost:3000/api/payments/paypal/webhook
```

> ⚠️ 本地测试时，需要使用 ngrok 或类似工具暴露本地端口：
> ```bash
> ngrok http 3000
> # 然后使用 ngrok 提供的 HTTPS URL
> https://你的随机域名.ngrok.io/api/payments/paypal/webhook
> ```

**Event types**（勾选以下事件）：
- ✅ `CHECKOUT.ORDER.APPROVED`
- ✅ `PAYMENT.CAPTURE.COMPLETED`
- ✅ `PAYMENT.CAPTURE.DENIED`
- ✅ `PAYMENT.CAPTURE.REFUNDED`

4. 点击 **"Save"**

### 3.2 获取 Webhook ID

创建后，在 Webhook 列表中点击你的 Webhook，复制 **Webhook ID**

更新 `.env.local`：

```bash
PAYPAL_WEBHOOK_ID=你的_Webhook_ID
```

---

## 🗄️ 第四步：运行数据库 Migration

在 Supabase SQL Editor 中执行以下文件：

```bash
supabase/migrations/20260120_add_payments_table.sql
```

或者复制文件内容，粘贴到 Supabase Dashboard → SQL Editor → New Query，点击 Run。

这会创建：
- `payments` 表
- 相关索引和 RLS 策略
- 辅助函数（`get_payment_history`, `get_payment_stats`）

---

## 🧪 第五步：测试支付流程

### 5.1 启动开发服务器

```bash
npm run dev
```

### 5.2 访问 Pricing 页面

```
http://localhost:3000/en/pricing
```

### 5.3 使用测试账户支付

点击任意套餐的购买按钮，使用 PayPal Sandbox 测试账户：

**测试 PayPal 账户：**
- 在 PayPal Developer Dashboard → Sandbox → Accounts
- 使用 "Personal" 类型的测试账户

**测试信用卡：**
```
卡号: 4032 0356 7490 3732（Visa）
过期: 任意未来日期
CVV: 123
```

更多测试卡号：https://developer.paypal.com/tools/sandbox/card-testing/

### 5.4 验证结果

1. **前端**：支付成功后应该显示成功消息和彩纸动画
2. **数据库**：检查 `payments` 表，应该有一条 `status = 'completed'` 的记录
3. **Credits**：检查 `profiles` 表，用户的 `credits` 应该增加了对应数量
4. **日志**：查看终端日志，应该显示：
   ```
   ✅ [PayPal] Payment captured: CAPTURE_ID - User email@example.com received 15 credits (starter)
   ```

---

## 🚀 第六步：上线到生产环境

### 6.1 创建 Production App

1. 回到 PayPal Developer Dashboard
2. 切换到 **"Live"** 标签页（不是 Sandbox）
3. 点击 **"Create App"**
4. 填写信息：
   - App Name: `PixPaw AI Live`
   - App Type: `Merchant`
5. 完成 PayPal Business 账户验证（需要实名认证）

### 6.2 更新生产环境变量

在 Vercel/你的部署平台上设置环境变量：

```bash
PAYPAL_ENVIRONMENT=production  # ⚠️ 改为 production
PAYPAL_CLIENT_ID=你的_Live_Client_ID
PAYPAL_CLIENT_SECRET=你的_Live_Secret
PAYPAL_WEBHOOK_ID=你的_Live_Webhook_ID
NEXT_PUBLIC_PAYPAL_CLIENT_ID=你的_Live_Client_ID
NEXT_PUBLIC_SITE_URL=https://pixpaw.ai  # 你的真实域名
```

### 6.3 设置生产 Webhook

1. 在 Live 环境创建 Webhook
2. URL 使用真实域名：
   ```
   https://pixpaw.ai/api/payments/paypal/webhook
   ```
3. 勾选相同的事件类型
4. 复制 Webhook ID 到环境变量

### 6.4 测试生产支付

使用真实 PayPal 账户或真实信用卡进行小额测试（建议 $0.01 测试，然后立即退款）

---

## 📊 监控和调试

### 查看支付日志

```bash
# 服务器日志
✅ [PayPal] Order created: O-xxx for user email (starter)
💰 [PayPal Webhook] Payment captured: CAPTURE_ID
✅ [PayPal Webhook] Payment processed: starter - User uuid received 15 credits
```

### 查看数据库

```sql
-- 查看所有支付记录
SELECT 
  id, 
  tier, 
  amount_usd, 
  credits_purchased, 
  status, 
  created_at 
FROM payments 
ORDER BY created_at DESC 
LIMIT 10;

-- 查看某用户的支付历史
SELECT * FROM get_payment_history('user_uuid', 10);
```

### 常见问题

**Q: Webhook 没有收到事件？**
A: 
1. 检查 Webhook URL 是否正确（必须是 HTTPS）
2. 本地测试使用 ngrok
3. 查看 PayPal Dashboard → Webhooks → 你的 Webhook → Recent Deliveries

**Q: 支付成功但 credits 没增加？**
A: 
1. 检查 `SUPABASE_SERVICE_ROLE_KEY` 是否正确配置
2. 查看服务器日志是否有 `increment_credits` 错误
3. 检查 Webhook 签名验证是否通过

**Q: 测试环境可以，生产环境失败？**
A:
1. 确认已切换到 `PAYPAL_ENVIRONMENT=production`
2. 使用 Live 的 Client ID/Secret（不是 Sandbox 的）
3. Webhook URL 必须是 HTTPS

---

## 🎨 自定义集成

### 修改定价

编辑 `lib/paypal/config.ts`：

```typescript
export const PRICING_TIERS = {
  starter: {
    amount: '4.99',  // 改为你想要的价格
    credits: 15,     // 改为对应的 credits
    name: 'Starter Pack',
    description: '15 High-Resolution Generations',
  },
  // ... 其他套餐
};
```

### 修改支付成功页面

编辑 `components/payment/paypal-buttons-advanced.tsx` 的 `onApprove` 函数

### 添加优惠码系统

1. 在 `payments` 表添加 `coupon_code` 字段
2. 在 `create-order` API 中验证优惠码
3. 调整 `amount_usd` 和 `credits_purchased`

---

## 📞 支持

遇到问题？

1. **PayPal 官方文档**：https://developer.paypal.com/docs/
2. **PayPal 技术支持**：https://developer.paypal.com/support/
3. **Supabase 文档**：https://supabase.com/docs
4. **查看日志**：服务器终端和浏览器控制台

---

## ✅ 完成清单

测试环境：
- [ ] 配置 Sandbox 环境变量
- [ ] 创建 Sandbox App
- [ ] 设置 Sandbox Webhook（使用 ngrok）
- [ ] 运行数据库 Migration
- [ ] 测试完整支付流程
- [ ] 验证 credits 自动充值

生产环境：
- [ ] 验证 PayPal Business 账户
- [ ] 创建 Live App
- [ ] 配置生产环境变量
- [ ] 设置 Live Webhook（使用真实域名）
- [ ] 小额真实支付测试
- [ ] 监控第一笔真实订单

---

**恭喜！你的支付系统已经准备就绪！** 🎉

记得在 Pricing 页面将 `PricingFakeDoorModal` 替换为 `PaymentModal` 来启用真实支付。
