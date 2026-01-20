# 💰 定价配置说明

## 📋 当前定价（2026-01-20）

| 套餐 | 原价 | 现价 | Credits | 状态 |
|------|------|------|---------|------|
| **Starter Pack** | $4.99 | $4.99 | 15 | ✅ 正常价格 |
| **Pro Bundle** | $19.99 | $19.99 | 50 | ✅ 正常价格 |
| **Master Plan** | $49.99 | **$39.99** | 200 | 🔥 限时优惠 |

---

## 🔧 配置文件位置

### **1. 定价数据源（Dictionary）**
```bash
lib/dictionaries/en.json
lib/dictionaries/zh-CN.json
```

**Master Plan 配置：**
```json
{
  "master": {
    "title": "Master Plan",
    "price": "$49.99",           // 原价
    "salePrice": "$39.99",       // 当前优惠价 ✅
    "originalPrice": "$49.99",
    "credits": 200,              // 200 Ultra-HD Generations
    "features": [...]
  }
}
```

### **2. PayPal 后端配置**
```bash
lib/paypal/config.ts
```

**PRICING_TIERS 配置：**
```typescript
export const PRICING_TIERS = {
  starter: {
    amount: '4.99',
    credits: 15,
  },
  pro: {
    amount: '19.99',
    credits: 50,
  },
  master: {
    amount: '39.99',  // ✅ 使用优惠价
    credits: 200,     // ✅ 200 credits
  },
}
```

### **3. 前端调用**
```bash
app/[lang]/pricing/page.tsx
```

**传递价格：**
```typescript
<MasterCard 
  dict={dict} 
  onCTA={() => handleStartCreating(
    'master', 
    dict.pricing.cards.master.salePrice,  // ✅ $39.99
    200  // ✅ 200 credits
  )} 
/>
```

---

## ⚠️ 修改定价时的检查清单

当你需要修改价格时，确保同步更新：

- [ ] `lib/dictionaries/en.json` - 英文价格
- [ ] `lib/dictionaries/zh-CN.json` - 中文价格
- [ ] `lib/paypal/config.ts` - PayPal 后端价格 ⚠️ **最重要**
- [ ] `app/[lang]/pricing/page.tsx` - 前端传参
- [ ] `components/payment/payment-modal.tsx` - 弹窗显示
- [ ] `components/dashboard/credits-tab.tsx` - Dashboard 显示（如果有）

---

## 🧪 验证价格是否正确

### **测试方法：**
1. 刷新 Pricing 页面
2. 点击 "Get Master Plan"
3. 查看支付弹窗显示的价格
4. 完成支付
5. 查看 PayPal 收据的金额
6. 检查数据库 `payments` 表的 `amount_usd`

### **预期结果：**
```sql
SELECT tier, amount_usd, credits_purchased 
FROM payments 
WHERE tier = 'master' 
ORDER BY created_at DESC 
LIMIT 1;

-- 应该显示：
-- tier: master
-- amount_usd: 39.99  ✅ 优惠价
-- credits_purchased: 200  ✅ 200 credits
```

---

## 💡 关于优惠策略

### **当前设置：**
- Master Plan 永久显示为 $39.99（限时优惠）
- 前端显示倒计时（营造紧迫感）
- 实际以 $39.99 扣款

### **如果要恢复原价：**

**只需修改 `lib/paypal/config.ts`：**
```typescript
master: {
  amount: '49.99',  // 改回原价
  credits: 200,
}
```

**其他文件不用改**（Dictionary 中保留 salePrice 和 originalPrice，方便未来切换）

---

## ✅ 已修复内容

1. ✅ PayPal 后端配置：`master.amount = '39.99'`
2. ✅ Credits 数量：`master.credits = 200`
3. ✅ 前端传参：所有 MasterCard 调用都传 200 credits
4. ✅ 支付弹窗：Master Plan 显示正确的功能列表

---

**现在刷新页面，重新测试 Master Plan 购买流程！** 

应该看到：
- ✅ 支付弹窗显示：$39.99 USD，200 credits
- ✅ PayPal 收款：$39.99
- ✅ 支付成功后充值：+200 credits
- ✅ 数据库记录：amount_usd = 39.99, credits_purchased = 200

🎉 价格和 credits 现在完全一致了！