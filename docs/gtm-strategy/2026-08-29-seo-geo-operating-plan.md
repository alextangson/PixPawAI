# PixPawAI — SEO + GEO 经营计划（2026-08-29）

> 性质：对 [pixpawai-gtm-strategy.md](pixpawai-gtm-strategy.md)（2026-07-04）§3 渠道策略的**修订**，定位与楔子不变。
> 触发事件：第一个真实付费用户出现（$4.99 Starter 积分包，来源未知/direct）。
> 证据基础：2026-08-29 仓库 SEO 审计 + 真实 SERP/GEO 侦察（本文所有 SERP 判断均为当日实查，无估算量）。

---

## 0. 判断变更记录（为什么改）

7 月策略的冷启动引擎是「付费 TikTok + 自然短视频」，SEO 为复利第二渠道。8 周后的事实：

| 事实 | 证据 |
|---|---|
| 社媒分发 8 周零执行（无内容、无投放） | Alex 2026-08-29 确认 |
| 唯一产生结果的渠道是搜索/入站 | 第一个付费用户在零分发下出现（GA 显示 direct/未查，organic 与 AI 推荐常落入 direct） |
| 自有 listicle 已在 "best ai pet portrait generator 2026" 排 ~#4 | pixpawai.com/en/blog/best-ai-pet-portrait-generator/（2026-08-29 实查） |
| 第三方已引用：petstudio.ai 榜单把 PixPaw 排 #3（8.0/10，提及内置打印） | petstudio.ai/blog/best-ai-pet-portrait-generators-2026 |
| 行业老大 Crown & Paw 已上线 `sitemap_agentic_discovery.xml` | 其 robots/sitemap 实查 — GEO 竞赛已开始 |

**决策：主渠道从 TikTok-first 改为 SEO+GEO-first。** 理由不是 SEO 突然变强，而是：(a) 它是唯一有产出证据的渠道；(b) 它匹配创始人实际会执行的工作方式（写代码/内容，而非拍视频）。预算=创始人时间，投给不会被执行的渠道等于零。TikTok 降级为「可选实验」，不再作为闸门。

**附带决策：Starter $4.99 积分包暂不退役。** monetization-flip 规格（2026-07-01）计划退役积分包，但迄今唯一真实成交就是积分包。在 keepsake/HD 收入被验证之前，保留积分包在售（Block ④ 定价页改版落地时只重排、不下架）。

7 月策略中**继续有效**的部分：礼赠/纪念楔子定位、诚实对比页打法、避开 Etsy/巨头占死的大词、寄生虫 SEO 合规两原则、产品缺口清单（礼品卡/直发）。

---

## 1. 本次已落地的技术地基（2026-08-29 会话）

- `public/llms.txt`（此前 404）— GEO 基础文件
- 首页 JSON-LD（Organization/WebSite/SoftwareApplication/Product/FAQPage）改为服务端渲染 — 不执行 JS 的爬虫此前看不到任何 schema
- Product/Offer schema 两处矛盾价格统一到单一来源
- 博客文章接入 FAQPage schema（`lib/seo/faq.ts` 此前写好未接线）
- WordPress meta 改读 Yoast 字段（此前用截断摘要，是 SEO_OVERRIDES 硬编码的根因）
- sitemap lastmod 修真（首页此前硬编码 2025-03-01；博客改用真实 modified 时间）
- WP 发布 webhook 自动 ping IndexNow（此前只能手动）
- noindex 补齐（auth/error、track-order）；/how-to 死代码与过期测试清理
- BOFU 拦截页 ×2：`/en/alternatives/crown-and-paw/`、`/en/alternatives/west-and-willow/`

---

## 2. 90 天计划（2026-09 → 2026-11）

### 2.1 前 10 个页面（按 价值÷难度，SERP 实查为据）

| # | 页面 | 目标查询 | SERP 现状（2026-08-29 实查） | 状态 |
|---|---|---|---|---|
| 1 | /en/alternatives/crown-and-paw/ | "crown and paw alternative" | 前十全是薄站+竞品博客，最软高意图 SERP | ✅ 本次建成 |
| 2 | /en/alternatives/west-and-willow/ | "west and willow alternative" | 同上；对手无预览政策+BBB 投诉是公开弹药 | ✅ 本次建成 |
| 3 | 刷新自有 listicle（WordPress） | "best ai pet portrait generator 2026" | 已排 ~#4，是 AI 引擎的主要摄取源 → 加深、加对比表、保持年份新鲜 | 每月维护 |
| 4 | /en/pet-memorial/ 内容加深 | "pet portrait for memorial gift" | **无任何 AI 工具在排名**，全是小博客+Etsy 类目页 — 交叉点无人占领 | 9 月 |
| 5 | WP 长文：dog passed away gift for owner | "dog passed away gift for owner" | 全是可打的内容站（mommy blog、listicle） | 9 月 |
| 6 | /en/styles/ 圣诞落地页强化 | "christmas pet portrait ai" | pawtograph.app、drawmy.pet 用单风格落地页已验证模板 | **10 月上旬前必须收录**（Q4） |
| 7 | /en/styles/royal（皇家风格页加深） | "royal pet portrait generator" | 纯微工具 SERP，零权威站 | 10 月 |
| 8 | 首页 title 加 "Free" 前置 | "ai pet portrait generator free" | 该 SERP 无任何权威站 — 全站权重最高页可直接吃 | 9 月（一行改动） |
| 9 | /en/alternatives/pawcaso/（AI 工具拦截） | "pawcaso alternative" 等 | 沿用 7 月已验证研究，打「可送性」 | 10 月 |
| 10 | /en/breeds/ 试点（golden-retriever 等 3 页） | "[breed] portrait" 长尾 | 仅 petcanvas.art 在做 breed 页，模板开放 | 11 月，程序化 |

节奏基线：**每周 1 个内容单元**（新页 / WP 长文 / 旧页刷新），宁可少而重（E-E-A-T：真实样张、真实生成过程截图，拒绝模板化 AI 水文）。

### 2.2 GEO 专项（让 AI 引擎引用你）

已有底子：robots 已放行全部 AI 爬虫；GA4 `ai_referral` 事件已埋（ChatGPT/Perplexity/Gemini/Claude 等 referrer 自动打标）；第三方榜单已引用。

1. **llms.txt 已上线**（本次）— 每季随产品更新
2. **自有 listicle = GEO 旗舰**：AI 引擎回答 "best ai pet portrait generator" 时的主要语料，保持事实密度（价格、风格数、交付方式用可核实的具体数字）
3. **占领第三方引用面**：认领 thingtesting.com 与 alternativeto.net 的品牌条目（两者都在 alternative 类 SERP 排名；alternativeto 已列竞品未列你）
4. **每篇内容带 Q&A 段**：FAQPage schema 本次已自动化，AI 引擎偏好可直接摘取的问答格式
5. **观察项**：Crown & Paw 的 agentic-discovery sitemap — 暂不跟进，Q4 后评估
6. **红线**：r/Petloss 是严格互助社区，**永远不做营销**；memorial 流量只从搜索内容获取

### 2.3 明确不做（本周期）

- TikTok/Reels/Pinterest 内容生产（8 周证明不会被执行；若 Alex 主动想做随时欢迎，但不作为计划依赖）
- "custom pet canvas" 等被 Crown & Paw/Snapfish 占死的头词硬碰
- 多语言/hreflang 扩展（一个市场没跑通前不做）
- 订阅制（维持 7 月决议的重估条件）

---

## 3. 运营节奏（持续经营的骨架）

### 每周一 30 分钟仪表盘（固定习惯，数据记在本文档 §5 或表格）

| 指标 | 来源 | 性质 |
|---|---|---|
| 非品牌 impressions / clicks | GSC Performance（过滤掉含 pixpaw 的查询） | 领先 |
| 已收录页数 / 总页数 | GSC 覆盖率 | 领先 |
| ai_referral 会话数（按 ai_source 分） | GA4 事件报表 | 领先（GEO） |
| BOFU 页目标词排名段位 | GSC 按页过滤看 avg position | 领先 |
| 各 SKU 成交数 + 归因来源 | GA4 purchase + acquisition | 滞后 |

### 每月（1 小时）
- 新页 GSC 手动请求收录；覆盖率异常（"已抓取未收录"堆积）排查
- Top 查询 CTR 检查 → title/description 微调（沿用 SEO_OVERRIDES 模式）
- listicle 年份/事实刷新；竞品 alternative SERP 位置抽查

### 季度复盘（对照杀死条件）

**预先承诺的杀死/转向条件（2026-11-30 检查）：**
- 前提：≥10 个内容单元已发布且被收录（执行到位才有资格评判渠道）
- 若非品牌点击未较 9 月基线增长 ≥3×，**且**新增成交中无一可归因 organic/AI → SEO 单渠道假设证伪 → 启动 $400 付费测试（TikTok 或 Google Ads 打 BOFU 词）
- 若 alternative 页收录 6 周后仍未进目标词前 20 → 内容/定位重写，而不是加页数
- 若 ai_referral 会话持续为 0 而 GSC 正常增长 → GEO 打法单独复检（llms.txt 抓取日志、第三方引用面）

---

## 4. 风险与依赖

1. **共享 WordPress 是重复内容炸弹**：furnituremadeinchina.site 正逐字转载 PixPaw 博客（2026-08-29 实查）——与当初家具文章漏入你博客同根（共享 Hostinger 实例）。处理：核实对方页面是否同源输出 → 隔离 WP 实例（独立托管）或 DMCA。**在此之前，博客是在给别人做嫁衣。**
2. **限流已死**：Upstash 实例失效后全站 fail-open，游客 2 次/天上限**未被强制执行**。SEO 起量后 = Replicate 成本裸奔。扩流量前必须补（Alex 动作 §6）。
3. **Q4 时间窗**：圣诞内容 10 月上旬必须可收录，错过等 12 个月。
4. **风格页现状偏薄**（每页 2 个 FAQ）：随节奏逐页加深，不批量灌水。

---

## 5. 周度数据日志

| 周 | 非品牌展示 | 非品牌点击 | 收录/总页 | ai_referral | 成交(归因) | 备注 |
|---|---|---|---|---|---|---|
| 2026-09-01 | （基线待记） | | | | | GSC 当前值 = 基线 |

---

## 6. Alex 行动清单（只有你能做的）

1. **PR #17 上线 runbook**（顺序敏感）：
   a. Supabase Dashboard 依次执行 `supabase/migrations/20260704_add_memorial_styles.sql`、`20260704_add_bundle_hd_addon.sql`（先跑 migration：坏窗口只是纪念款缩略图短暂 404；反过来则是弱强度生成+HD bundle 不发货）
   b. 合并 PR #17（与 main 零冲突，已验证）→ Vercel 自动部署
   c. 验收：/en/pet-memorial/ 三个纪念款缩略图正常、生成一张纪念款确认宠物身份保持、实体结账 GA4 事件出现
2. **GSC 基线**：记录当前 覆盖率+非品牌点击 到 §5；提交更新后的 sitemap；对本次新页请求收录
3. **GA4 考古**：Acquisition 报表查 $4.99 成交那个会话的 source/medium（可能藏在 direct 里，看 landing page 维度）
4. **认领** thingtesting.com、alternativeto.net 品牌条目
5. **WP 隔离决策**：确认 furnituremadeinchina.site 内容同源问题，选独立 WP 托管或 DMCA
6. **补 Upstash Redis**：新建实例 + 更新 Vercel `UPSTASH_REDIS_REST_URL/TOKEN`（恢复限流与游客上限）
7. （7 月遗留）真实 $9.99 HD 购买+退款验证 capture 路径；GA4 DebugView 确认 `hd_unlock_view`/`purchase`
