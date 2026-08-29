# WordPress 转 PixPaw 专用 — 清理 Runbook（2026-08-29）

> 决策（Alex 2026-08-29）：furnituremadeinchina 站不再运营，共享 WP 实例
> （beige-yak-585162.hostingersite.com）整体转为 PixPaw 专用。
> 现状盘点：78 篇文章 = 41 篇宠物（保留）+ 37 篇家具（清理，见下表）。
> pixpawai.com 前端目前无家具内容泄漏（sitemap/博客索引已核实干净）；
> 风险在 CMS 域名本身可被非 Google 爬虫抓取 + 家具前端站仍在线（200）。

## 操作步骤（按顺序）

### 1. 批量下架 37 篇家具文（WP Admin，约 10 分钟）
Posts → Screen Options 设 100/页 → 勾选下表文章 → Bulk Actions → **Move to Trash**。
（Trash 可 30 天内恢复，不是永久删除——放心操作。）

想让我代劳的话：Users → Profile → Application Passwords 建一个应用密码，
放进 `.env.local`（`WP_USER` / `WP_APP_PASSWORD`），我脚本化 trash + 逐篇验证。

### 2. CMS robots 全封（headless CMS 不该被任何爬虫抓）
当前 robots.txt 只挡了 Googlebot，Bing/AI 爬虫全放行 —— 重复内容对 GEO 是负资产。
改为全封：

```
User-agent: *
Disallow: /
```

WP Settings → Reading → 勾选 "Discourage search engines"（若 Hostinger 面板有物理
robots.txt 则直接改文件）。注意：只封 CMS 域名，pixpawai.com 的 robots 不动。

### 3. 下线 furnituremadeinchina.site 前端
站点仍返回 200。在其托管平台删除部署或解绑域名。留着它 = 继续和 pixpawai.com
争夺同源内容的归属权。

### 4.（可选）装免费版 Yoast SEO
已核实该 WP 未装 Yoast（REST 无 yoast_head_json）。装上后，前端代码
（PR #19 已上）会自动优先读 Yoast 的 title/description；不装则继续走
excerpt 截断 + 代码里的 SEO_OVERRIDES。装比不装好，但不阻塞。

### 5.（第二优先级）宠物文去重
保留的 41 篇里有明显的批量生成重复（`-2` 后缀、同题多篇，如
best-ai-pet-portrait-generators-2026 / 同名-2 / cat-memorial-gift-ideas 两个版本、
pet-memorial-photo-ideas 三个变体）。前端按分类过滤所以暂无害，
但建议之后一次过审：每题留一篇最好的，其余 trash。此项不急。

### 6. 清理后验证（我来做）
- `GET /wp-json/wp/v2/posts?per_page=100` 确认只剩宠物文
- pixpawai.com/en/blog/ 与 sitemap 正常（前端本就只显示宠物文，预期无变化）
- 家具分类（seating/tables/sofa 等 14 个）删除或留空皆可，纯观感问题

## 待清理清单（37 篇，ID + slug）

| ID | Slug |
|----|------|
| 16 | sourcing-custom-furniture-china-luxury-hotels |
| 27 | render-to-reality-ffe-specs-guide |
| 31 | ffe-logistics-ddp-vs-cif-guide |
| 34 | value-engineering-mistakes-design-integrity |
| 186 | top-10-modern-villa-furniture-2026-top-10-statement-pieces-for-large-open-s |
| 292 | executive-office-chair-trends-sourcing-guide |
| 1086 | the-designer-s-guide-to-sourcing-hospitality-furniture-how-to-vet-hotel-fur |
| 1088 | understanding-incoterms-2026-for-furniture-export-exw-vs-fob-vs-ddp-explain |
| 1166 | how-to-master-looking-for-minotti-style-how-our-factory-matches-quality-wit |
| 1169 | how-to-master-how-to-get-the-minotti-aesthetic-for-your-commercial-project- |
| 1977 | import-furniture-china-to-india |
| 1983 | how-to-import-furniture-from-china-complete-2025-guide |
| 1987 | wholesale-custom-wooden-furniture-foshan-china |
| 1989 | wholesale-solid-wood-furniture-china |
| 1990 | hotel-furniture-manufacturers-china |
| 1991 | oem-furniture-manufacturer-china |
| 1992 | space-saving-furniture-manufacturer-china |
| 2225 | import-furniture-china-india-guide-2026 |
| 2496 | how-to-find-a-reliable-china-furniture-manufacturer-2026-guide-2 |
| 2497 | how-to-find-a-reliable-china-furniture-manufacturer-2026-guide |
| 2498 | wholesale-furniture-from-china-complete-buyers-guide |
| 2499 | custom-furniture-from-china-how-to-order-oem-odm-furniture |
| 2500 | furniture-quality-control-in-china-what-buyers-need-to-know |
| 2533 | the-complete-guide-to-importing-furniture-from-china-2025 |
| 2537 | how-to-import-furniture-from-china-to-india-complete-guide-for-2026 |
| 2552 | import-furniture-from-china-guide |
| 2553 | furniture-shipping-from-china-cost-guide |
| 2563 | illinois-custom-woodworking-company-files-chapter-11-what-it-signals-for-fu |
| 2564 | us-new-home-sales-dip-in-january-what-slowing-residential-demand-means-for- |
| 2565 | fedex-posts-most-profitable-peak-season-on-record-what-this-means-for-furni |
| 2663 | california-ports-request-1b-for-infrastructure-upgrades-what-it-means-for-f |
| 2668 | echo-global-logistics-acquires-its-creating-5-2b-freight-platform-what-it-m |
| 2675 | sustainability-takes-center-stage-in-furniture-sourcing-what-chinese-suppli |
| 2676 | us-japan-critical-mineral-pact-what-it-means-for-furniture-hardware-and-com |
| 2690 | usmca-review-set-to-reshape-north-american-supply-chains-what-furniture-imp |
| 2691 | hapag-lloyd-reports-sharp-profit-drop-as-freight-rates-soften-what-it-signa |
| 2695 | tariff-refunds-court-expands-scope-to-include-finally-liquidated-entries |

清单生成方式：REST API 全量拉取 78 篇后按 slug 关键词分类，3 篇边界案例逐一人工核对标题（1947 Pet Portrait Cost Guide 判定保留；34 value-engineering、27 ffe-specs 判定清理）。
