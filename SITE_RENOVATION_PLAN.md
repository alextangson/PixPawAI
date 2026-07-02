# PixPaw 冷启动站内改造方案

> 目的：把网站从"积分制 AI 生成器"改造成"免费生成当钩子、卖实体 keepsake 变现"的转化漏斗，
> 配合短视频 + Pinterest 的流量打法。**原则：跟着流量改、只改流量碰得到的那一段，不做整站重设计。**

---

## 战略前提（已对齐）

- **流量引擎**：TikTok / Reels（病毒反转视频，主）+ Pinterest（买家意图，导自己站）。
- **不走 Etsy**（已决定）→ **自己的站是唯一成交入口**，所以站内转化质量要求被拉高。
- **变现**：生成免费/慷慨当钩子 → 在情感峰值卖**实体 keepsake**（canvas / framed print / ornament / pillow）+ 数字高清上卖。
- **场景**："送礼"是品类，**纪念是其中情绪最重的入口**；统一在 "honor / celebrate your pet" 品牌伞下。

---

## 现状盘点（基于代码核实）

| 模块 | 状态 | 证据 |
|---|---|---|
| 生成流程 | ✅ 可用 | 游客 2 次/天免费（含水印），登录用积分 · `lib/guest-credits.ts`, `app/api/generate/route.ts` |
| 纪念落地页 | ✅ 真实（381行+FAQ） | `app/[lang]/pet-memorial/page.tsx` |
| Printful 集成 | ✅ 在 | webhook + `printful_orders` 表 · `app/api/printful/webhook/route.ts` |
| 生成→实体 桥 | ⚠️ 半成品 | result modal "Love it" → `/en/shop/pillow?generationId=X`（写死 pillow、次要 CTA）· `components/result-modal.tsx:100,686` |
| 邮箱/名单基建 | ✅ 可复用 | `merch_waitlist` / `payment_waitlist` API |
| 个性化下单是否真打通 | ❓ 待验证 | 旧 `/shop/[id]` 已退化为重定向，疑个性化链路回归 |
| GA 测量 | ❌ 生产未生效 | env 未部署；purchase/begin_checkout 埋点已补（待 redeploy） |

**核心判断**：变现翻转 = 补全 + 重排优先级，不是从零建。硬基建都在。

---

## 分阶段改造（按该动手的顺序）

### Stage 0 · 测量（进行中）
- [x] 补 `begin_checkout` + `purchase` GA4 事件（`payment-modal.tsx`）
- [ ] **你**：Vercel 核对 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 变量名 + Production 环境 + **redeploy**
- 验收：线上 HTML 出现 gtag、GA4 Realtime 能看到事件
- 意义：之后每一步改动都可被测量，不再盲飞

### Stage 1 · 打通"生成 → 实体 keepsake"命门桥（最高优先级）
- **1a** 验证并修复 `/[lang]/shop/[productId]?generationId=X` —— 必须真把**用户的图**放到产品上、端到端能下单付款
- **1b** 把"做成实体 keepsake"提为 "Love it" 后的**首要 CTA**；把 Share/Download/积分话术降级
- **1c** 按场景给对的产品：纪念/送礼优先 canvas / framed print / ornament（不止 pillow）；情感峰值给对的物
- 意义：这条桥是"不跟免费工具比价"的全部底气；没有它，整套策略是空话

### Stage 2 · 视频流量的 message-match 转化路径
- **2a** bio 链接落地页：纪念页已存在 → 把其 CTA 接进 `免费生成 → keepsake` 漏斗；按需加 gift 落地页
- **2b** 确保 `落地 → 生成(免费钩子) → Love it → 买 keepsake` 全程顺滑，无多余登录墙阻断

### Stage 3 · 邮箱捕获 + 再营销
- 复用 waitlist 基建，在"生成后 / 下单前"关键点抓 email（"保存你的肖像 / keepsake 9 折"）
- 意义：冷社媒流量极少首访就买，抓了邮箱才能再营销转化

### Stage 4 · 变现模型翻转（去积分化）
- 主变现从积分包 → keepsake + 数字高清上卖；积分降级为次要"更多生成/高清下载"
- 重写 pricing 页定位
- 时机：Stage 1 跑通、keepsake 转化被验证后再做（避免一次动太多）
- **[2026-07-02 已上线] 数字高清底座**：服务端水印 + 私有原图桶 + $9.99 单次 HD 解锁后端（PayPal）+ 门控下载路由，生产验证通过（详见 `docs/superpowers/plans/2026-07-01-hd-unlock-server-watermark.md`）。购买 UI 与 CTA 重排在下一计划。顺带修复：游客生成（nullable user_id）、Art Card 覆写 metadata、全站虚假 2K/4K 宣传清零。

### Stage 5 · 首页重定位（最后）
- 生成器 → "honor / celebrate your pet" 礼品品牌
- 时机：仅当有品牌/回访流量后（冷流量不落首页）

---

## 现在明确不做

- 不大改首页（没流量前装修门厅）
- 不注册 Etsy（已决定）
- 不做整站重设计

## 执行依赖

```
Stage 0 ──► Stage 1 ──► (Stage 2 ∥ Stage 3) ──► Stage 4 ──► Stage 5
（测量）   （命门桥）    （落地页 / 邮箱）        （去积分）   （首页）
```
