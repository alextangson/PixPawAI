# 🚀 SEO Setup Guide - PixPaw AI

**Created:** 2026-01-20  
**Status:** ✅ All code changes completed

---

## ✅ Completed SEO Optimizations

### 1. Open Graph Images ✅
- **Gallery pages**: Now use Art Card (`share_card_url`) for social sharing
- **Homepage**: Replaced SVG with PNG logo (better social media compatibility)
- **Result**: Beautiful social media previews with branded Art Cards

### 2. Google Analytics 4 ✅
- **Component**: `components/analytics.tsx`
- **Integration**: Added to `app/[lang]/layout.tsx`
- **Features**: Page views, custom events, conversion tracking

### 3. Canonical URLs ✅
- **Gallery page**: `https://pixpawai.com/en/gallery`
- **Gallery items**: `https://pixpawai.com/en/gallery/[id]`
- **Prevents**: Duplicate content issues

### 4. Google Search Console Verification ✅
- **Location**: `app/[lang]/layout.tsx` metadata
- **Method**: HTML meta tag verification

### 5. Structured Data (Schema.org) ✅
- **Component**: `components/home-schema.tsx`
- **Schemas**:
  - Organization Schema (brand info)
  - WebSite Schema (search functionality)
  - Product Schema (pricing tiers)
  - FAQPage Schema (homepage FAQs)

### 6. Optimized Sitemap ✅
- **File**: `app/sitemap.ts`
- **Includes**:
  - Static pages (home, gallery, pricing, etc.)
  - Blog articles (from WordPress)
  - Top 100 gallery images (by views)
- **Revalidation**: Every hour

---

## 🔧 Required Environment Variables

Add these to your `.env.local` file:

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Search Console Verification
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code

# Site URL (should already exist)
NEXT_PUBLIC_SITE_URL=https://pixpawai.com
```

---

## 📋 Post-Launch Setup Checklist

### Step 1: Google Analytics Setup
1. Go to [Google Analytics](https://analytics.google.com)
2. Create a new GA4 property for `pixpawai.com`
3. Copy your Measurement ID (format: `G-XXXXXXXXXX`)
4. Add to `.env.local`: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`
5. Deploy and verify in GA4 Real-Time reports

### Step 2: Google Search Console Setup
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add Property" → "URL prefix" → `https://pixpawai.com`
3. Choose verification method: **HTML tag**
4. Copy the `content` value from the meta tag
5. Add to `.env.local`: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-code`
6. Deploy and click "Verify" in GSC

### Step 3: Submit Sitemap
1. In Google Search Console, go to "Sitemaps"
2. Enter: `https://pixpawai.com/sitemap.xml`
3. Click "Submit"
4. Wait 24-48 hours for indexing to begin

### Step 4: Test Social Sharing
Test your OG images on these platforms:

- **Facebook**: https://developers.facebook.com/tools/debug/
  - Enter: `https://pixpawai.com/en`
  - Should show PNG logo (256x256)
  
- **Twitter**: https://cards-dev.twitter.com/validator
  - Enter: `https://pixpawai.com/en/gallery/[any-id]`
  - Should show Art Card with branding

- **LinkedIn**: https://www.linkedin.com/post-inspector/
  - Test homepage and gallery links

### Step 5: Validate Structured Data
1. Go to [Rich Results Test](https://search.google.com/test/rich-results)
2. Test URL: `https://pixpawai.com/en`
3. Should detect:
   - Organization
   - WebSite
   - Product
   - FAQPage (if FAQs exist)

### Step 6: Performance Check
1. Go to [PageSpeed Insights](https://pagespeed.web.dev/)
2. Test: `https://pixpawai.com/en`
3. Target scores:
   - Performance: >90
   - Accessibility: >95
   - Best Practices: >95
   - SEO: 100

---

## 📊 Analytics Events to Track

The Analytics component supports custom event tracking. Add these in your code:

```typescript
import { trackEvent, trackConversion } from '@/components/analytics';

// Image generation
trackEvent('generate_image', { 
  style: 'Pixar 3D', 
  pet_type: 'dog' 
});

// Purchase
trackConversion('purchase', 19.99, 'USD');

// Share to gallery
trackEvent('share', { 
  generation_id: '123',
  has_art_card: true 
});

// Download
trackEvent('download', { 
  format: '4K',
  has_watermark: false 
});
```

---

## 🔍 SEO Monitoring Tools

### Weekly Checks
- **Google Search Console**: Impressions, clicks, CTR
- **Google Analytics**: Traffic sources, user behavior
- **PageSpeed Insights**: Core Web Vitals

### Monthly Reviews
- **Keyword rankings**: Track "AI pet portraits", "Pixar pet art"
- **Backlinks**: Monitor with Ahrefs or SEMrush
- **Competitor analysis**: Compare with similar services

---

## 🎯 Next Steps (Optional Enhancements)

### Priority: Medium
1. **Blog SEO**: Optimize existing WordPress articles
2. **Internal linking**: Add more cross-links between pages
3. **Image alt text**: Ensure all images have descriptive alt text

### Priority: Low
4. **Video content**: Add demo videos (YouTube SEO)
5. **Local SEO**: If targeting specific regions
6. **Multi-language**: Add hreflang when Chinese content is ready

---

## 📝 Files Modified

```
✅ app/[lang]/gallery/[id]/page.tsx - Art Card OG images
✅ app/layout.tsx - PNG logo for OG
✅ app/[lang]/layout.tsx - OG images, GSC verification, Analytics
✅ app/[lang]/page.tsx - Structured data integration
✅ app/[lang]/gallery/page.tsx - Canonical URL
✅ app/sitemap.ts - Dynamic gallery images
✅ components/analytics.tsx - NEW: GA4 component
✅ components/home-schema.tsx - NEW: Structured data
```

---

## 🆘 Troubleshooting

### Google Analytics not tracking?
- Check browser console for errors
- Verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
- Test in production (doesn't run in development)
- Use GA4 DebugView for real-time debugging

### Social sharing not showing images?
- Clear cache on social platforms (use debugger tools)
- Verify image URLs are publicly accessible
- Check image dimensions (OG images should be 1200x630 or larger)

### Sitemap not updating?
- Sitemap revalidates every hour
- Force revalidation: `https://pixpawai.com/sitemap.xml?revalidate=1`
- Check server logs for errors

### Structured data not detected?
- Wait 24-48 hours after deployment
- Use Rich Results Test to validate
- Check for JSON-LD syntax errors in browser console

---

## 📞 Support Resources

- **Next.js SEO**: https://nextjs.org/learn/seo/introduction-to-seo
- **Google Search Central**: https://developers.google.com/search
- **Schema.org**: https://schema.org/docs/gs.html
- **GA4 Documentation**: https://support.google.com/analytics/answer/9304153

---

**🎉 Congratulations! Your SEO foundation is ready for launch.**

Remember to monitor your analytics weekly and adjust your strategy based on real data.
