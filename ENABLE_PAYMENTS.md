# 🚀 启用真实支付（替换 Fake Door）

## 快速开始

按照 `PAYPAL_SETUP.md` 配置好环境变量后，只需 3 步启用支付：

---

## Step 1: 更新 Pricing 页面

打开 `app/[lang]/pricing/page.tsx`

### 1.1 导入新的支付弹窗组件

在文件顶部添加：

```typescript
import { PaymentModal } from '@/components/payment/payment-modal';
```

### 1.2 替换状态管理

找到这一行：

```typescript
const [showFakeDoor, setShowFakeDoor] = useState(false);
```

改为：

```typescript
const [showPaymentModal, setShowPaymentModal] = useState(false);
```

### 1.3 更新按钮点击处理

找到 `handleStartCreating` 函数中的这段代码：

```typescript
if (tier === 'free') {
  router.push(`/${lang}#upload`);
} else {
  setSelectedTier({ tier: tier as 'starter' | 'pro' | 'master', price: price || '' });
  setShowFakeDoor(true);  // ← 改这里
}
```

改为：

```typescript
if (tier === 'free') {
  router.push(`/${lang}#upload`);
} else {
  setSelectedTier({ tier: tier as 'starter' | 'pro' | 'master', price: price || '' });
  setShowPaymentModal(true);  // ← 真实支付
}
```

### 1.4 替换弹窗组件

找到页面底部的 `<PricingFakeDoorModal>` 组件：

```typescript
<PricingFakeDoorModal
  isOpen={showFakeDoor}
  onClose={() => setShowFakeDoor(false)}
  tier={selectedTier?.tier || 'starter'}
  price={selectedTier?.price || '$4.99'}
/>
```

改为：

```typescript
<PaymentModal
  isOpen={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  tier={selectedTier?.tier || 'starter'}
  price={selectedTier?.price || '$4.99'}
  credits={
    selectedTier?.tier === 'starter' ? 15 :
    selectedTier?.tier === 'pro' ? 50 : 100
  }
/>
```

---

## Step 2: 更新 Credits Tab（Dashboard）

打开 `components/dashboard/credits-tab.tsx`

### 2.1 导入支付弹窗

```typescript
import { PaymentModal } from '@/components/payment/payment-modal';
import { useState } from 'react';
```

### 2.2 添加状态和按钮

在 `CreditsTab` 组件内部添加：

```typescript
export function CreditsTab({ currentCredits }: CreditsTabProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // ... 原有的 plans 定义

  const handlePurchase = (plan: any) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };
```

### 2.3 更新按钮点击

找到 `Button` 组件，将 `onClick` 改为：

```typescript
<Button
  className="w-full bg-coral hover:bg-orange-600 text-white font-semibold"
  onClick={() => handlePurchase(plan)}  // ← 改这里
>
  Get {plan.name}
</Button>
```

### 2.4 添加弹窗到组件底部

```typescript
{/* 在 return 语句的最后添加 */}
{showPaymentModal && selectedPlan && (
  <PaymentModal
    isOpen={showPaymentModal}
    onClose={() => setShowPaymentModal(false)}
    tier={selectedPlan.id}
    price={selectedPlan.price}
    credits={selectedPlan.credits}
  />
)}
```

---

## Step 3: 创建支付成功页面（可选）

创建 `app/[lang]/payment/success/page.tsx`：

```typescript
export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-5xl">✅</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your credits have been added to your account.
          <br />
          Start creating amazing pet art now!
        </p>
        
        <a
          href="/en"
          className="inline-block bg-coral hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Start Creating →
        </a>
      </div>
    </div>
  );
}
```

创建 `app/[lang]/payment/cancelled/page.tsx`：

```typescript
export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-5xl">🤔</span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>
        
        <p className="text-gray-600 mb-6">
          No worries! No charges were made.
          <br />
          Ready to try again?
        </p>
        
        <div className="flex gap-3">
          <a
            href="/en/pricing"
            className="flex-1 bg-coral hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            View Pricing
          </a>
          <a
            href="/en"
            className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## 测试清单

启用支付后，测试以下流程：

- [ ] Pricing 页面点击 "Get Starter Pack" 显示支付弹窗
- [ ] PayPal 按钮正常显示（蓝色 PayPal 按钮）
- [ ] 信用卡按钮正常显示（黑色 Debit or Credit Card 按钮）
- [ ] 使用测试账户完成支付
- [ ] 支付成功后显示成功消息和彩纸动画
- [ ] 刷新页面，credits 数量正确更新
- [ ] Dashboard 中可以查看支付历史（可选功能）

---

## 回滚到 Fake Door（如需）

如果需要临时禁用支付，只需将上述改动撤销：

```typescript
// 改回原来的
const [showFakeDoor, setShowFakeDoor] = useState(false);
setShowFakeDoor(true);

<PricingFakeDoorModal ... />
```

---

## 下一步优化（可选）

1. **添加优惠码系统** - 在 create-order API 中验证 coupon code
2. **支付历史页面** - 展示用户的所有支付记录
3. **退款功能** - 在 admin 面板添加退款按钮
4. **邮件通知** - 支付成功后发送确认邮件
5. **发票生成** - 为企业用户提供发票下载

---

**完成！你的支付系统现在已经可以接受真实支付了！** 💰
