# PayPal 积分漏发修复（2026-08-28）

## 根因和改动

旧收款接口先将 `payments.status` 写成 `completed`，再调用
`increment_credits_safe`。该函数遇到 completed 立即返回
`payment_already_processed`，接口却将其视为正常重复请求。因此订单收款成功不等于积分到账。

旧 Webhook 同样先完成订单再加积分，积分失败仍返回 HTTP 200；再次投递也会被
completed 检查跳过。创建订单还存在未 await 数据库写入就返回 PayPal order ID 的窗口。

修复：

- 创建订单使用服务端管理员客户端，必须持久化成功才能返回 order ID；拒绝客户端直接写入可信的价格和积分数量。
- 收款接口和签名验证通过的 Webhook 都调用 `fulfill_paypal_credit_payment`。
- 数据库先锁订单行，再检查是否入账；积分、套餐、支付状态和 `credits_granted_at` 在同一事务内更新。任一步失败全部回滚。
- 校验实际 capture 状态、金额、币种和订单归属；不是完成状态不发积分。
- 收款重试沿用订单记录 UUID 作为 `PayPal-Request-Id`。超时或重复 capture 后查询已有订单，不再声称“没有扣款”。
- 入账失败返回非 2xx，前端不显示成功，Webhook 保持可重试。晚到的 APPROVED 不再覆盖人工补发元数据，DENIED 不能覆盖 completed。
- 已识别的 HD 解锁和实体商品订单不进入积分发放流程。

本次未调整退款扣积分策略、生成扣积分流程或其他积分 RPC。

## 历史订单与人工补发

**不批量补发、不根据当前余额推断历史是否到账。**

- `metadata.manual_credit_reconciliation.status = completed`：视为已有人工补发凭据，不再加积分，原凭据完整保留。
- 存在人工补发记录但状态不是 completed：阻止自动处理，交由人工确认。
- 旧 completed 订单没有积分凭据：返回需要核对的错误，不自动补发，也不虚报到账。
- 迁移不回填 `credits_granted_at`，不修改用户余额。

## 验证结果

- `npm run test:payments`：34/34 通过。18 项执行实际路由/辅助函数代码、替换外部 I/O 的测试；16 项隔离 PostgreSQL 事务测试。
- PostgreSQL 测试加载原 payments 和旧 RPC 迁移，实际复现旧缺陷；验证 12 路并发只加一次、并发不同订单不丢余额、故障回滚后可重试、重复 capture 冲突回滚、已补发订单不重复加分、权限限制及 master 套餐兼容。
- `npm run test:unit`：15/15 通过。
- `npm run build`：通过，112 个静态页面；三个支付接口均成功编译。
- 本地 production server 冒烟：未登录 create/capture 均返回 401，无签名 Webhook 返回 400；未执行任何真实支付。
- `git diff --check`：通过。
- 独立 `tsc --noEmit --incremental false`：仍有 82 个原有错误，均在三个使用未配置 Jest 全局变量的旧测试文件。对 HEAD 原文件与当前文件做编译器诊断比较，新增错误为 0。
- `npm run lint`：仓库没有配置 ESLint，命令进入首次配置提示，未完成 lint；没有为通过检查而修改配置。
- 额外的内容/SEO 测试：4 通过、5 失败，涉及缺失 how-to 页面和旧 SEO 断言；相关文件本次未改动。

支付测试不读取 `.env`、不连接远程数据库、不调用真实 PayPal。事务测试需要本机可执行
`initdb`、`pg_ctl`、`psql`；创建仅使用临时 Unix socket 的 PostgreSQL，测试结束销毁临时实例。

## 上线顺序（已获授权，尚未执行）

用户已授权迁移与部署。2026-08-28 上线预检发现当前 Supabase CLI 无目标项目访问权限，
Ego Lite 中目标项目需要重新登录；因此尚未执行任何生产迁移、余额写入或域名切换。
只读订单检查未发现重复订单、重复 capture 或待确认的人工补发记录；现有套餐均在兼容范围内。
迁移增加了 5 秒锁等待超时和 30 秒单语句超时，遇到繁忙数据库会中止回滚，避免长时间阻塞用户请求。

这是**协调发布**，不能直接在有结账流量时迁移完后继续运行旧应用：旧建单接口仍用用户权限写入，迁移撤销该权限后它会保存失败，却仍给买家返回 order ID。

1. 先在非生产环境应用迁移并验证完整结账、Webhook 重放和数据库失败后恢复。现有测试未代替真实 PayPal Sandbox 验收。
2. 确认当前生产发布版本、迁移权限、PayPal 应用和 Webhook 注册地址；验证 service role 可用。准备短暂支付维护窗口，拦截积分 create/capture 路由并等待在途请求结束。切换期间旧积分 Webhook 也应返回 503，不能继续写旧 completed 状态。
3. 只读检查重复 `(provider, provider_order_id)`、重复 capture、profiles 套餐约束和人工补发待确认记录。发现异常先停，不删除订单、不自动补余额。
4. 应用 `supabase/migrations/20260828_atomic_paypal_credit_fulfillment.sql`。这一步包含新列、唯一索引、事务 RPC、套餐约束与权限变更。
5. 部署匹配的应用代码，确认新 RPC 的 PostgREST schema cache 可见；保留维护窗口直到接口与数据库版本一致。
6. 恢复 Webhook 和结账。核对成功订单的积分凭据，并重放同一 Sandbox 事件验证不重复入账。真实资金测试需另行明确授权。

只读检查可输出计数，避免展示真实买家信息：

```sql
SELECT count(*) AS duplicate_order_groups FROM (
  SELECT provider, provider_order_id FROM public.payments
  GROUP BY provider, provider_order_id HAVING count(*) > 1
) duplicates;

SELECT count(*) AS manual_repairs_requiring_review
FROM public.payments
WHERE metadata ? 'manual_credit_reconciliation'
  AND (metadata #>> '{manual_credit_reconciliation,status}') IS DISTINCT FROM 'completed';
```

发布后若需回退，先重新暂停结账；**不能直接恢复存在漏发缺陷的旧接口并开放支付**。
保留已写入的积分凭据、人工补发记录及余额，不删除迁移列、不倒扣用户积分。

## 外部协议依据

- [PayPal Webhooks：非 2xx 会触发重新投递](https://developer.paypal.com/api/rest/webhooks/)。默认最多在三天内投递 25 次，超出需人工重发；这不是永久的自动对账任务。
- [PayPal Idempotency：使用同一个 PayPal-Request-Id 恢复不确定请求](https://developer.paypal.com/api/rest/reference/idempotency/)。数据库事务仍独立负责积分只发一次。
