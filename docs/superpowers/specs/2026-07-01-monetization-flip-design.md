# PixPawAI 变现翻转迭代 · 设计文档

> 日期：2026-07-01 · 状态：已由 Alex 批准（方案 A）
> 前置文档：`SITE_RENOVATION_PLAN.md`（冷启动站内改造方案，本文档是其 Stage 3 + Stage 4 的具体化）

---

## 1. 背景与决策记录

### 1.1 目标

把变现模型从"卖生成积分"翻转为"卖作品"：免费生成当钩子，在情感峰值卖**实体 keepsake**（主角）和**数字高清解锁**（副产品），并铺好邮件再营销的地基。

### 1.2 关键决策：本期不做付费订阅

- 宠物肖像是低频、情绪驱动的一次性购买（纪念/送礼/装饰），不是高频创作工具；生成订阅的留存预期极差（订阅→生成一次→退订）。
- 品类头部（Crown & Paw、West & Willow 等）全部是一次性电商模式，无订阅先例。
- 支付基建只有 PayPal 一次性通道（`app/api/payments/paypal/`），接 Subscriptions API 需 1-2 周额外工期。
- 当前流量为零，冷流量首访订阅转化约等于零。

**重新评估条件**（满足任一再考虑轻会员 fast-follow，形态为年费权益：不限生成 + 实物折扣 + 免运费）：

- GA4 显示有一批用户 30 天内回访生成 ≥3 次；
- 累计实体买家 ≥100 人（有再营销标的）。

### 1.3 SEO / 设计的范围约束

零流量根因是分发未启动，不是 SEO。本期 SEO 和页面设计**只动转化路径碰得到的页面**（结果弹窗、shop、pricing、落地页），不做首页重设计、不做整站改版。流量靠短视频 + Pinterest 分发解决，不在本文档范围。

---

## 2. 新价值阶梯

| 层级 | 内容 | 价格 | 支付 |
|---|---|---|---|
| 免费钩子 | 生成 + 服务端水印下载（游客 2 次/天逻辑不变） | $0 | — |
| 数字高清解锁 | 按**单次生成**解锁：无水印原始分辨率图 + 个人打印授权 | $9.99 | PayPal 一次性 |
| 实体 keepsake（主推） | canvas / framed print / ornament / pillow / mug 等 | $19.99–$59.99 | PayPal 一次性（已有 Printful 链路） |

**积分制退役但不删除**：pricing 页停售积分包；已有积分照常消耗（`app/api/generate/route.ts` 零改动）；share +1（`/api/share`）、referral +5 保留为免费生成补充。

---

## 3. 设计分块

### ① 服务端水印 + HD 解锁（新数字商品）

**现状问题**：水印在客户端用 Canvas 合成（`components/result-modal.tsx:185-298`），原图签名 URL 直接下发浏览器，devtools 可绕过。一旦卖"无水印高清"，免费路径必须真正封住原图。

**设计**：

- 生成完成时用 sharp 在服务端预合成水印变体，与原图一同存入 `generated-results` bucket（原图路径现为 `{userId}/preprocessed/{timestamp}-{generationId}.png`，水印版并列存放）。
- 免费下载 / 结果弹窗预览一律走水印版；原图签名 URL 只经新的解锁校验路由下发（如 `/api/generations/[id]/hd`）。
- 新建 `hd_unlocks` 表：`generation_id, paypal_order_id, email, user_id(nullable), created_at`。游客购买用 PayPal payer email 绑定 generation_id，无需注册。
- PayPal 新增商品类型 `hd_unlock`：扩展 `create-order` / `capture-order`（现只卖积分包，见 `app/api/payments/paypal/create-order/route.ts:94-100`）；capture 成功即写入 `hd_unlocks` 并返回下载链接。
- 删除虚假宣传：`components/payment/payment-modal.tsx:63` 的 "4K Resolution (4096px)" 未实现，移除该承诺（HD = 原始生成分辨率，文案如实表述）。

### ② 结果弹窗转化层级重排

现状（`components/result-modal.tsx`）：Share to Gallery 占最显眼位（coral 渐变、col-span-2），实体 CTA 是黑色次级按钮——积分时代的排法。翻转为：

1. **主 CTA**（大、情感文案，如 "Turn it into real art"）→ 产品选择，默认 canvas，memorial 语境优先 framed print，带 `generationId` 进 shop。
2. **次 CTA**："Download HD — no watermark · $9.99" → 内嵌 PayPal（hd_unlock）。
3. **降级区**：免费带水印下载、Share to Gallery、referral。

"Not quite" 反馈 + 积分退款路径（`result-modal.tsx:337-356`）不动。

### ③ 邮件捕获（本期"订阅"的形态：免费邮件订阅）

接入 **Resend**（Vercel 生态、免费额度足够冷启动）：

- **抓取点 1（高意图）**：生成完成后 "Email me my portrait" —— 输入邮箱收带水印图，天然价值交换。
- **抓取点 2**：shop 产品页 "首单 9 折码换邮箱"。
- 新建 `email_subscribers` 表：`email, source('portrait_delivery'|'discount_optin'), generation_id(nullable), created_at`，API 复用 waitlist 路由模式（参考 `app/api/merch-waitlist/`）。
- 本期只做**事务性邮件**：肖像投递邮件 + 一封含折扣码的跟进邮件。drip 自动化明确不做。
- 折扣码 v1 从简：静态码（如 `PIXPAW10`，首单 10%），在 `app/api/printful/create-order` 服务端校验并作用于商品小计，记录进 `printful_orders`。不做按用户防重，接受少量泄漏。

### ④ Pricing 页重写

`app/[lang]/pricing/page.tsx` 从 4 档积分卡改为价值阶梯页：

- 三段式：Free（水印生成）/ HD Portrait $9.99 / Keepsakes from $19.99（产品卡直链 shop 详情页）。
- 删除积分包售卖、删除 4K 虚假承诺；FAQ 按新模型重写。
- 沿用 `lib/pricing-analytics.ts` 事件，variant 标记为 `value_ladder`（保留与旧 `optimized` 变体的对比能力）。

### ⑤ 落地页 + Printful 目录补全

- **pet-memorial 页**（`app/[lang]/pet-memorial/page.tsx`）：CTA 从"回首页"改为直接进生成流程并预选 memorial 风格；结果弹窗在该语境主推 framed print / canvas。
- **新增 /pet-gift 落地页**：结构镜像 pet-memorial（hero + 风格示例 + FAQ + Breadcrumb/FAQ schema），目标词群 "pet portrait gift" / "gifts for dog moms" 等；同时作为短视频流量的 message-match 落点。
- **Printful 目录**（`lib/printful/config.ts:PRINTFUL_PRODUCTS`）补 **framed print** 和 **ornament**（纪念/送礼场景正确产品）。实施时须在 Printful 后台选定实际 variant ID 并核对价格（参照 commit a486db0 踩过的坑）。
- memorial 语境的判定：生成时所选风格属于 memorial 系列即视为 memorial 语境，结果弹窗主 CTA 的默认产品据此切换（canvas → framed print）。
- 首页不重设计，仅确认 merch showcase 链接进入漏斗。

### ⑥ 测量补全

关键缺口：**实体订单从未上报 GA4 purchase**（现只有积分购买有，`components/payment/payment-modal.tsx:91,107`）。补齐：

| 事件 | 触发点 |
|---|---|
| `view_item` | shop 产品详情页加载（带 product_id, generationId 有无） |
| `add_to_cart` / `begin_checkout` | 产品页发起结算 |
| `purchase`（merch） | `confirm-order` 成功后客户端上报（transaction_id = printful order） |
| `hd_unlock_click` / `purchase`（hd_unlock） | 结果弹窗次 CTA → capture 成功 |
| `download_free` | 免费水印下载 |
| `email_capture` | 两个抓取点提交（带 source） |

---

## 4. 执行顺序与依赖

```
① 服务端水印 + hd_unlocks + PayPal hd_unlock   ← 最先（封住免费路径才有数字商品）
② 结果弹窗重排（依赖 ① 的 HD 购买入口）+ Printful 补 framed/ornament
④ Pricing 页重写（依赖 ①② 的新模型落地）
③ Resend 邮件捕获（独立，可与 ④ 并行）
⑤ pet-gift 落地页 + memorial CTA 改接（独立，可最后）
⑥ 测量事件随各块一起交付，作为各块验收标准的一部分
```

每块独立可发布，按序上线，GA4 观察一块再上下一块。

---

## 5. 验收标准

1. 免费路径下载到的图**服务端带水印**；网络面板拿不到无水印原图 URL。
2. PayPal sandbox 走通两条钱路：hd_unlock（解锁后能下载原图）、merch（Printful 测试订单创建成功）。
3. GA4 DebugView 看到完整漏斗：`generate → keepsake_cta / hd_unlock_click → begin_checkout → purchase`。
4. Pricing 页无积分包、无 4K 承诺；三层价值阶梯 + shop 直链可点。
5. 两个抓取点提交后 Resend 实际送达邮件；`email_subscribers` 有记录。
6. pet-gift 页可被索引（sitemap 收录、schema 校验通过）；memorial CTA 直达生成流程。

---

## 6. 明确不做（本期）

- 付费订阅 / PayPal Subscriptions（见 1.2 重新评估条件）
- 首页重设计、整站视觉改版
- 多语言（`lib/i18n-config.ts` 维持 en）
- drip 邮件自动化、按用户折扣码防重
- 生成引擎 / 画质放大（4K 承诺删除而非实现）
- Etsy 或其他渠道

---

## 7. 已知风险

- **sharp 水印性能**：生成流程新增一次图片处理，需确认不拖慢出图体感（可异步生成水印版，下载时兜底同步生成）。
- **Printful 新品 variant ID**：历史上出过 ID/价格不匹配（a486db0 修复），新增 framed/ornament 时须以 Printful 后台实际值为准。
- **积分兼容层**：停售后 pricing 入口消失，但 payment-modal 里的积分购买流程仍被旧组件引用，需排查所有入口避免死链。
