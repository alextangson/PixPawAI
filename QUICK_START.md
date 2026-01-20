# 🚀 PayPal 支付快速启动指南

## ✅ 已完成的工作

1. ✅ **数据库表创建** - `payments` 表
2. ✅ **后端 API 路由** - create-order, capture-order, webhook
3. ✅ **前端支付组件** - PayPalButtonsAdvanced 高级按钮
4. ✅ **Pricing 页面更新** - 已替换 fake door 为真实支付弹窗

---

## 📝 下一步操作（3步启动）

### Step 1: 配置 PayPal 环境变量（5分钟）

在项目根目录创建或编辑 `.env.local` 文件：

```bash
# ============================================
# PAYPAL 配置（新增这部分）
# ============================================
PAYPAL_ENVIRONMENT=sandbox

# 从 https://developer.paypal.com/dashboard/ 获取
PAYPAL_CLIENT_ID=你的_Client_ID
PAYPAL_CLIENT_SECRET=你的_Secret

# 前端用（和上面的 Client ID 一样）
NEXT_PUBLIC_PAYPAL_CLIENT_ID=你的_Client_ID

# Webhook ID（后面配置，现在留空）
PAYPAL_WEBHOOK_ID=

# 网站地址
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**如何获取 Client ID 和 Secret？**

1. 访问：https://developer.paypal.com/dashboard/
2. 切换到 **Sandbox** 标签
3. 点击 **Apps & Credentials**
4. 选择或创建一个 App
5. 复制 **Client ID** 和 **Secret**

---

### Step 2: 运行数据库 Migration（2分钟）

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 打开文件：`supabase/migrations/20260120_add_payments_table.sql`
4. 复制全部内容
5. 粘贴到 SQL Editor
6. 点击 **Run**

---

### Step 3: 测试支付（5分钟）

```bash
# 1. 验证配置是否正确
node test-paypal-credentials.js

# 2. 启动开发服务器
npm run dev

# 3. 访问 pricing 页面
# http://localhost:3000/en/pricing

# 4. 点击任意购买按钮，测试支付流程
```

**测试支付方式：**

- **测试 PayPal 账户**：在 PayPal Developer → Sandbox → Accounts 中找到
- **测试信用卡**：
  ```
  卡号: 4032 0356 7490 3732
  过期: 任意未来日期（如 12/2028）
  CVV: 123
  ```

---

## 🎯 验证清单

测试时检查以下项目：

- [ ] Pricing 页面点击 "Get Starter Pack" 显示支付弹窗（不是 fake door）
- [ ] 弹窗中显示 PayPal 蓝色按钮
- [ ] 弹窗中显示信用卡支付按钮
- [ ] 点击 PayPal 按钮可以跳转到 PayPal 支付页面
- [ ] 使用测试账户完成支付
- [ ] 支付成功后显示成功消息和彩纸动画
- [ ] 刷新页面，credits 数量正确增加

---

## 🐛 常见问题

### Q: 运行 `node test-paypal-credentials.js` 失败

**A: 检查以下几点：**
1. `.env.local` 文件是否在项目根目录
2. `PAYPAL_CLIENT_ID` 和 `PAYPAL_CLIENT_SECRET` 是否正确复制
3. 确保没有多余的空格或换行

### Q: 支付按钮显示 "Loading secure checkout..." 一直转圈

**A: 检查浏览器控制台错误：**
1. 按 F12 打开开发者工具
2. 查看 Console 标签是否有错误
3. 常见问题：`NEXT_PUBLIC_PAYPAL_CLIENT_ID` 未设置

### Q: 支付成功但 credits 没增加

**A: 检查以下几点：**
1. `SUPABASE_SERVICE_ROLE_KEY` 是否正确配置
2. 数据库 migration 是否成功运行
3. 查看 `payments` 表是否有记录
4. 查看 `profiles` 表的 `credits` 字段

---

## 📞 需要帮助？

如果遇到问题：

1. **查看完整文档**：`PAYPAL_SETUP.md`
2. **查看日志**：服务器终端和浏览器控制台
3. **截图给我**：错误信息、PayPal 配置页面、控制台输出

---

## 🎉 成功标志

当你看到以下内容时，说明配置成功：

```bash
# test-paypal-credentials.js 输出：
✅ 认证成功！
✅ 订单创建成功！
🎉 所有测试通过！你的 PayPal 配置正确！
```

```bash
# 支付成功后浏览器显示：
🎉 Payment Successful!
50 credits have been added to your account
Refreshing your dashboard...
```

**恭喜！你的支付系统已经可以接受真实支付了！** 💰
