# PixPawAI — GTM 策略交接(Handover)

> 交接给在本仓库工作的 agent。你有代码库,但没有产出这份策略的对话上下文——本文件把你需要知道的一切讲清楚。
> 完整策略文档在 [`docs/gtm-strategy/`](docs/gtm-strategy/):
> - [`pixpawai-gtm-strategy.md`](docs/gtm-strategy/pixpawai-gtm-strategy.md) — 完整 GTM 策略
> - [`unit-economics.md`](docs/gtm-strategy/unit-economics.md) — 单位经济模型(**决定怎么花钱,先读**)
> - [`gifting-research/`](docs/gtm-strategy/gifting-research/) — 礼赠楔子竞品调研 + 决策依据(每条带 URL)
> 日期: 2026-07-04 · 代码库事实核对基于当日 grep,标注"⚠️待核"处请你在代码里再确认。

---

## 1. 一句话战略

PixPawAI 从"AI 生成工具"转向**礼赠楔子**:占据一个真实但狭窄的空缝——**唯一一个既"真·即时"(AI 秒出成品,不像 Crown & Paw/Eterna 还要等人工)、又"真·可送"(有礼品卡/直发/无物流截止,不像 Pawcaso 那些要用户自己搞)的宠物礼物**。

**定位语句:** 为**赶时间/没头绪、想给养宠亲友送走心礼物的送礼人**,提供**几秒生成、打开即成品、零物流截止的宠物艺术画像礼物**。不像 Crown & Paw / West & Willow(要等人工+物流,常错过节日),也不像 Pawcaso / PawToAI(即时但要自己搞、没有可送包装)。

**核心口号候选:** *"Their pet, gift-ready in seconds."*

---

## 2. 支配一切的经济现实(必须先内化)

详见 [`unit-economics.md`](docs/gtm-strategy/unit-economics.md)。三条铁律:

1. **$4.99 数字画像扛不住付费投放**(付费 CAC ~$15–30,一单就亏)。→ **数字只走免费渠道**(自然内容 + last-minute SEO,CAC≈0),进站后升级实物。
2. **付费投放(TikTok,创始人有此能力)只卖实物/套餐**(AOV $50–80 才扛得住 CAC)。宠物是 TikTok 投放 CAC 最低品类($13–20 可达)。
3. **两台引擎**:①付费 TikTok → 实物/套餐(可规模化);②免费自然+SEO → $4.99 数字钩子 → 站内升级实物。北极星 = **数字→实物 attach rate**。

⚠️ **待核 + 待定价决策**:`lib/seo/shop-products.ts` 的实物价格由 Printful 变体动态取("from $X")。**请读出当前 canvas/mug/pillow 真实零售价 + Printful 真实底价,代入 `unit-economics.md` 的毛利表**。若 canvas 现价 ≈$50、毛利仅 ~$20,则 CAC 没空间——策略建议**提到 ~$65 并做"数字+实物"套餐**,把毛利抬到 $35–38。这是需要创始人拍板的定价决策。

---

## 3. 代码库现状核对(EXISTS vs MISSING)

我实际 grep 过代码,很多基建**已经有了**,任务多是"补齐/改进"而非"从零建":

### ✅ 已存在
- 数字 credits 三档:Starter $4.99/15 · Pro $19.99/50 · Master $39.99/200(`PRICING_CONFIG.md`, `lib/paypal/config.ts`)
- 实物履约:**Printful 集成**(`app/api/printful/*`, `lib/printful/client.ts`),`/[lang]/shop` + `/[lang]/shop/[productId]`,商品含 canvas/mug/pillow(`lib/seo/shop-products.ts`,`app/layout.tsx` meta 已写 "ships on canvas, mugs & pillows")
- `/[lang]/pet-memorial/` 纪念落地页 + memorial 博客/content hub(`lib/content-hubs.ts`)
- `/[lang]/alternatives/` 路由(**仅一个 index `page.tsx`,无按竞品分页**)
- `admin/referral-codes` 后台(推荐码基建)
- `/[lang]/track-order`、分享卡生成(`app/api/create-share-card`)、styles/glossary/use-cases/blog SEO 基建
- 有 GSC(Search Console)

### ❌ 缺失 / 待建(按策略优先级)
- **memorial 生成风格**:⚠️ `lib/styles.ts` 里**没有** memorial/rainbow-bridge/halo 等纪念风格(只有生日风格带 rainbow 字样)。内容在引流 memorial,产品却接不住——**产品-内容断层,先补**。
- **礼品卡 / 直发收礼人流程**:代码里 "recipient" 只出现在 Printful 收货地址,**没有** gift-card / send-to-friend 购买流。这是封住楔子 + 吃"无照片送礼人"(占季节购买 25%)的关键机制。
- **按竞品的拦截页**:`/alternatives/[competitor]`(crown-and-paw、west-and-willow、pawcaso)+ `/vs/` 页,主打"他们要等,你不用等"。现有 `/alternatives` 只是空壳 index。
- **"数字+实物"套餐 SKU**:抬 AOV、锁定数字体验、支撑付费 CAC。
- **BOFU 礼赠落地页**:last-minute / instant / gift-card / gift-for-dog-mom 等长尾意图页(绕开被 Etsy/巨头占死的大词)。
- **站内分析 + 漏斗埋点**:有 GSC,但需 Plausible/GA4 + 关键事件(访客→数字购买→实物 attach),否则无法读转化。⚠️待核是否已有。
- **用户侧转介绍闭环**:有 referral-codes 后台,但⚠️待核是否有面向用户的"晒图/邀朋友"拥护回路(把用户变成获客渠道)。

---

## 4. 优先级行动清单(90 天冷启动 = 验证冲刺)

目标不是规模,是**证明有人买 + 找到可规模化的付费引擎**。顺序很重要:

**第一步(周 1–2):让产品能承接 + 能测量**
1. 补 memorial 生成风格(`lib/styles.ts`)——修产品-内容断层。
2. 装站内分析 + 埋转化漏斗事件(访客→数字→实物 attach)。
3. 定价决策:核实 `shop-products.ts` 真实价,按 `unit-economics.md` 决定是否 canvas→$65 + 建套餐 SKU。
4. 把首页/一个落地页锋利对准楔子:"打开即成品、零物流截止"。

**第二步(周 3–8):两台引擎并跑拿首批 10–25 单**
5. 付费 TikTok(~$400/月)打**实物/套餐**落地页,3–4 组素材,目标 CAC 压到毛利线以下。
6. 自然内容(TikTok/Reels/Pinterest/社群)引 $4.99 数字画像,量 attach rate。
7. 建 gift-card / send-to-recipient 流(吃无照片送礼人)。

**第三步(周 9–12):验证通过后投复利基建**
8. 按竞品建 `/alternatives/[competitor]` + `/vs/` 拦截页。
9. 铺 BOFU 礼赠长尾落地页矩阵。
10. 上用户侧转介绍/晒图闭环。

---

## 5. 止损条件(现在就写死,防沉没成本)

- 付费 TikTok 3 轮素材后,实物/套餐 CAC 仍 > 毛利线 → 这个 AOV 撑不起付费,退回自然+SEO,付费只做再营销。
- 落地页 3 次迭代、N 个冷流量后仍 <目标转化 → 楔子/定位问题,重审(别加渠道)。
- 礼品卡上线 2 个月无人用 → "无照片送礼人"假设错,砍掉。
- 那道"即时×可送"缝被巨头抄走(Pawcaso 加礼品卡 / Eterna 换 AI)→ 转向关键词地盘 + 品牌承诺防御。
- **memorial 不做获客引擎**(一次性 + 营销受限),只做高毛利垂直承接。
- **年度会员**:parked 到 phase-3,重开条件——数据证明同一送礼人一年买 4+ 次,或 B2B(救助站/宠物店)角度。

---

## 6. 需要创始人提供 / 待定的输入

1. 实物真实零售价 + Printful 真实底价(核 `shop-products.ts`)→ 定死毛利线和 CAC 上限。
2. canvas 是否提价 + 是否上套餐 SKU(定价决策)。
3. 首批 TikTok 流量的 **CAC** 和 **attach rate**(装好分析后自动产出)→ 用真实数替换 `unit-economics.md` 里的行业基准止损线。

---

## 7. 交接注记

- 本策略基于真实竞品调研(见 `gifting-research/`,每条带 URL)。市场规模类数字(礼赠占 58%、AI 市场 $240M)为单一来源(Petraitly,页面 403),方向可信但勿写进对外材料。
- 代码库事实(§3)基于 2026-07-04 grep,标 ⚠️待核处请在代码里二次确认后再动手。
- 与现有 `PRODUCT_ROADMAP.md` / `PRICING_AND_FEATURE_STRATEGY.md` / `SITE_RENOVATION_PLAN.md` 可能有重叠或冲突——以本文件的"礼赠楔子 + 两台引擎经济模型"为最新战略基准,发现冲突请向创始人确认后对齐。
