# 🚀 PayPal 支付上线完整清单

## 📊 当前状态

✅ **已完成（Sandbox 测试）：**
- [x] 数据库表创建完成
- [x] PayPal API 集成完成（create-order, capture, webhook）
- [x] 前端支付组件完成
- [x] Sandbox 环境测试通过
- [x] 支付流程完整验证
- [x] Credits 自动充值验证
- [x] 等级自动升级验证

---

## 🎯 上线步骤（按顺序执行）

### **Week 1: PayPal 认证 + 法律准备**

#### 1. 完成 PayPal Business 账户认证 ⏰
- [ ] 登录 PayPal.cn 商家账户
- [ ] 提交企业认证资料：
  - 营业执照
  - 法人身份证
  - 银行账户信息
- [ ] 等待审核（1-3 个工作日）
- [ ] 收到认证通过通知

**联系方式：**
- PayPal 中国客服：400-820-0036
- 企业认证页面：https://www.paypal.com/cn/business

#### 2. 准备法律文档 📝
- [ ] 创建 Terms of Service（服务条款）
- [ ] 创建 Refund Policy（退款政策）
- [ ] 创建/更新 Privacy Policy（隐私政策）
- [ ] 法律审核（如有条件）

**模板位置：** 我可以帮你生成这些页面的基础模板

---

### **Week 2: 配置生产环境**

#### 3. 创建 Live App
- [ ] 访问 https://developer.paypal.com/dashboard/
- [ ] 切换到 **"Live"** 标签
- [ ] 点击 "Create App"
  - App Name: `PixPaw AI Production`
  - App Type: `Merchant`
- [ ] 复制 Live Client ID
- [ ] 复制 Live Secret（点击 Show）

#### 4. 配置 Vercel 环境变量
- [ ] 登录 Vercel Dashboard
- [ ] 进入 PixPaw AI 项目
- [ ] Settings → Environment Variables
- [ ] 添加以下变量（Production 环境）：

```bash
PAYPAL_ENVIRONMENT=production
PAYPAL_CLIENT_ID=你的_Live_Client_ID
PAYPAL_CLIENT_SECRET=你的_Live_Secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=你的_Live_Client_ID
NEXT_PUBLIC_SITE_URL=https://pixpaw.ai
PAYPAL_WEBHOOK_ID=（第5步后填写）
```

- [ ] 保存并重新部署

#### 5. 配置生产 Webhook
- [ ] 在 PayPal Developer Dashboard (Live 模式)
- [ ] 创建 Webhook：
  - URL: `https://pixpaw.ai/api/payments/paypal/webhook`
  - Events: 勾选支付相关事件
- [ ] 复制 Webhook ID
- [ ] 更新 Vercel 环境变量：`PAYPAL_WEBHOOK_ID`
- [ ] 重新部署

#### 6. 数据库 Migration（生产环境）
- [ ] 登录生产环境 Supabase
- [ ] SQL Editor → 运行 `20260120_add_payments_table.sql`
- [ ] 验证表创建成功：
  ```sql
  SELECT * FROM payments LIMIT 1;
  ```

---

### **Week 3: 测试 + 上线**

#### 7. 小额真实支付测试 🧪
- [ ] 访问 `https://pixpaw.ai/en/pricing`
- [ ] 使用真实 PayPal 账户支付 **Starter Pack ($4.99)**
- [ ] 验证支付成功
- [ ] 检查 Credits 是否充值（+15）
- [ ] 检查等级是否升级（free → starter）
- [ ] 检查 Vercel Logs 是否有错误
- [ ] 检查 Webhook 是否收到通知

**验证点：**
```bash
# Vercel Logs 应该显示：
✅ [PayPal] Order created: xxx
✅ [PayPal Webhook] Payment captured: xxx
✅ [PayPal] Payment captured: xxx - User received 15 credits (starter)

# Supabase payments 表应该有：
tier: starter
amount_usd: 4.99
credits_purchased: 15
status: completed
```

#### 8. 退款测试
- [ ] 在 PayPal Dashboard 手动退款上一笔测试订单
- [ ] 等待 Webhook 通知
- [ ] 检查 Credits 是否扣除（-15）
- [ ] 检查 `payments` 表：`status = 'refunded'`

#### 9. 正式上线 🎉
- [ ] 在 Pricing 页面移除 "测试中" 提示（如有）
- [ ] 发布公告：支付功能上线
- [ ] 监控前 10 笔订单
- [ ] 准备客服话术（支付问题处理）

---

## 🚨 上线后的持续监控

### **每日检查：**
- [ ] Vercel Logs（查看是否有 API 错误）
- [ ] PayPal Dashboard（查看交易记录）
- [ ] Supabase payments 表（查看订单状态）
- [ ] 用户反馈（支付问题）

### **每周检查：**
- [ ] Webhook 发送成功率
- [ ] 支付转化率（多少人完成支付）
- [ ] 退款率
- [ ] 平均客单价

---

## 📞 紧急联系方式

**PayPal 技术支持：**
- 中国客服：400-820-0036
- 开发者论坛：https://developer.paypal.com/support/

**如果遇到生产环境问题：**
1. 查看 Vercel Logs
2. 查看 PayPal Dashboard → Webhooks → Recent Deliveries
3. 查看 Supabase Logs
4. 联系 PayPal 技术支持

---

## ⏰ 预估时间线

```
今天（Day 1）：
  ✅ Sandbox 测试完成

明天（Day 2-3）：
  📝 提交 PayPal Business 认证
  📝 准备法律文档

下周（Day 7-10）：
  ✅ 认证通过
  🔧 配置生产环境
  🧪 小额真实支付测试

2周后（Day 14）：
  🚀 正式上线
  💰 开始接受真实支付
```

---

## 💡 现在可以做什么？

**选项 1：继续 Sandbox 测试**
- 测试所有边缘情况
- 测试不同套餐
- 测试错误处理

**选项 2：准备上线**
- 申请 PayPal Business 认证
- 准备法律文档
- 规划上线时间表

**选项 3：我帮你生成法律文档模板**
- Terms of Service 页面
- Refund Policy 页面
- Privacy Policy 页面

---

**你想先做哪个？** 🤔

1. 继续测试 Sandbox？
2. 开始 PayPal 认证流程？
3. 让我帮你生成法律文档页面？