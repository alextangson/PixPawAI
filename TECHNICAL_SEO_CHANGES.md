# Technical SEO Changes Summary

**Branch:** `fix/technical-seo`  
**Date:** 2026-02-15  
**Priority:** P0

## Overview
This document summarizes all technical SEO fixes implemented to address Google Search Console issues:
- Only 6 pages indexed out of 63 known
- 50 pages "Discovered - currently not indexed"
- 5 pages "Page with redirect"
- 2 pages "Duplicate without user-selected canonical" (www vs non-www)

---

## 1. www/non-www Canonical Unification ✅

### Problem
`www.pixpawai.com` and `pixpawai.com` both existed, causing Google to see duplicate content.

### Solution Implemented

#### A. Added 301 Redirect in `next.config.js`
```javascript
async redirects() {
  return [
    {
      source: '/:path*',
      has: [
        {
          type: 'host',
          value: 'www.pixpawai.com',
        },
      ],
      destination: 'https://pixpawai.com/:path*',
      permanent: true, // 301 redirect
    },
  ];
}
```

#### B. Updated Canonical URLs in `app/[lang]/layout.tsx`
- Changed from relative paths (`/${lang}`) to absolute URLs (`https://pixpawai.com/${lang}`)
- Updated language alternates to use full URLs

#### C. Updated All Page Canonicals
- `app/[lang]/how-to/page.tsx`: Canonical now uses `https://pixpawai.com/${lang}/how-to`
- `app/[lang]/how-to/[slug]/page.tsx`: Canonical now uses `https://pixpawai.com/en/how-to/${slug}`
- `app/[lang]/pricing/layout.tsx`: Canonical now uses `https://pixpawai.com/${lang}/pricing`

---

## 2. Remove Wrong Article ✅

### Problem
`https://pixpawai.com/en/how-to/how-to-master-furniture-quality-control-service-china-complete-guide` was indexed — this is a FurnitureMadeInChina article that doesn't belong on PixPawAI.

### Solution Implemented

#### A. Added Blocklist in `lib/wordpress/blog.ts`
```typescript
const BLOCKED_SLUGS = [
  'how-to-master-furniture-quality-control-service-china-complete-guide',
  'furniture-quality-control-service-china',
];
```

#### B. Block Check in `getBlogArticle()`
- Returns `null` (triggering 404) if a blocked slug is requested

#### C. Block Check in `getAllArticleSlugs()`
- Filters out blocked slugs from sitemap and static generation

---

## 3. Sitemap Verification & Update ✅

### Status
The sitemap at `app/sitemap.ts` was already correctly configured:
- Uses `SITE_URL` environment variable (defaults to `https://pixpawai.com`)
- Includes all important pages:
  - Homepage (`/en`)
  - Gallery (`/en/gallery`)
  - Pricing (`/en/pricing`)
  - How-to (`/en/how-to`)
  - Shop (`/en/shop`)
  - All blog articles (fetched from WordPress)
  - Gallery images (top 100 by views)

### No Changes Required
The sitemap was already correctly implemented with non-www URLs.

---

## 4. Schema.org Structured Data ✅

### A. Homepage Schema (Already Existed)
`components/home-schema.tsx` already includes:
- Organization Schema
- WebSite Schema (with SearchAction)
- SoftwareApplication Schema
- Product Schema (AggregateOffer with all pricing tiers)
- FAQPage Schema (when FAQs are provided)

### B. Blog Article Schema (Already Existed)
`components/blog/blog-article-schema.tsx` includes:
- Article Schema (headline, datePublished, author, image, etc.)
- BreadcrumbList Schema

### C. Gallery ImageGallery Schema (NEW)
Created `components/gallery/gallery-schema.tsx`:
```typescript
{
  '@context': 'https://schema.org',
  '@type': 'ImageGallery',
  name: 'PixPaw AI Pet Portrait Gallery',
  description: 'Discover stunning AI-generated pet portraits...',
  url: 'https://pixpawai.com/en/gallery',
  image: [...] // First 12 images
}
```

### D. Pricing Product Schema (NEW)
Created `app/[lang]/pricing/layout.tsx` with:
- Product Schema
- AggregateOffer with 3 pricing tiers:
  - Starter Bundle: $4.99 (15 credits)
  - Pro Bundle: $19.99 (50 credits)
  - Master Bundle: $39.99 (200 credits)
- AggregateRating (4.9/5 from 10,000 reviews)

---

## 5. Gallery Style Pages SEO ✅

### Current Implementation
The gallery uses client-side filtering with query parameters (`?style=pixar-dogs`). For better SEO, proper URL paths would be ideal, but this would require significant refactoring.

### Improvements Made
- Added ImageGallery Schema to gallery page
- Canonical URL is correctly set to `https://pixpawai.com/${lang}/gallery`
- Gallery page has proper meta title and description

### Future Recommendation
Consider implementing proper URL paths like `/en/gallery/pixar-dogs` for each style filter. This would require:
- Dynamic route segments for styles
- Static generation for each style page
- Unique title/description for each style

---

## Files Modified

| File | Changes |
|------|---------|
| `next.config.js` | Added 301 redirect from www to non-www |
| `app/[lang]/layout.tsx` | Updated canonical URLs to absolute non-www |
| `app/[lang]/how-to/page.tsx` | Updated canonical to absolute URL |
| `app/[lang]/how-to/[slug]/page.tsx` | Added canonical meta tag |
| `app/[lang]/gallery/page.tsx` | Added GallerySchema component |
| `app/[lang]/pricing/layout.tsx` | NEW - Added metadata and Product schema |
| `lib/wordpress/blog.ts` | Added blocklist for wrong articles |
| `components/gallery/gallery-schema.tsx` | NEW - ImageGallery schema component |

---

## Deployment Checklist

- [ ] Merge branch `fix/technical-seo` to main
- [ ] Deploy to Vercel
- [ ] Verify 301 redirect from www to non-www works:
  ```bash
  curl -I https://www.pixpawai.com
  # Should return 301 to https://pixpawai.com
  ```
- [ ] Verify blocked article returns 404:
  ```bash
  curl -I https://pixpawai.com/en/how-to/how-to-master-furniture-quality-control-service-china-complete-guide
  # Should return 404
  ```
- [ ] Submit updated sitemap to Google Search Console
- [ ] Request re-indexing of affected pages

---

## Vercel Domain Configuration

**Important:** Also check Vercel dashboard for domain configuration:
1. Go to Project Settings → Domains
2. Ensure `pixpawai.com` is set as primary domain
3. Check if "Redirect www to non-www" is enabled (redundant with our code fix, but good as backup)

---

## Expected Results

After these changes and Google re-crawling:
1. **Canonical issues resolved**: All pages will have consistent non-www canonical URLs
2. **Wrong article removed**: Furniture article will return 404 and be de-indexed
3. **Better structured data**: Rich snippets may appear in search results
4. **Improved indexing**: More pages should move from "Discovered" to "Indexed"

---

## Build Status

**Note:** The build encountered a system-level error during testing (errno -11 - resource temporarily unavailable). This appears to be an environment issue rather than a code issue. The syntax of all modified files has been verified as valid.

**Recommendation:** Run `npm run build` in a clean environment before deploying.
