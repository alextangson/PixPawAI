# Content Moderation System - Testing Guide

## Overview

This document outlines the testing procedures for the content moderation system implemented in PixPaw AI.

## System Components

### 1. NSFW Image Detection (Layer 1)
- **Location**: `app/api/check-quality/route.ts`
- **Technology**: Qwen2.5-VL-72B vision model
- **Purpose**: Detect inappropriate images during upload

### 2. Sensitive Prompt Filtering (Layer 2)
- **Location**: `lib/moderation/keyword-filter.ts`
- **Technology**: Keyword blacklist/graylist
- **Purpose**: Filter inappropriate text in user prompts

### 3. User Reporting (Layer 3)
- **Location**: `app/api/report-generation/route.ts`, `components/report-button.tsx`
- **Purpose**: Community-driven content moderation

### 4. Progressive Penalties
- **Location**: `lib/moderation/violation-tracker.ts`
- **Database**: `moderation_logs`, `user_bans` tables
- **Purpose**: Escalating consequences for repeat offenders

---

## Testing Checklist

### ✅ Phase 1: Database Setup

**Run Migration:**
```bash
# Apply the moderation tables migration
psql -h [SUPABASE_HOST] -U postgres -d postgres -f supabase/migrations/20260119_create_moderation_tables.sql
```

**Verify Tables Created:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('moderation_logs', 'user_reports', 'user_bans');

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_violation_count', 'is_user_banned', 'log_violation');
```

---

### ✅ Phase 2: NSFW Image Detection Testing

**Test Cases:**

#### Test 2.1: Normal Pet Photos (Should PASS)
- [ ] Upload standard dog photo
- [ ] Upload standard cat photo
- [ ] Upload hairless cat (Sphynx) - **Critical: Should NOT be flagged**
- [ ] Upload pet with owner's hand visible
- [ ] Upload close-up of pet nose/paws

**Expected Result:**
```json
{
  "isSafe": true,
  "unsafeReason": "none",
  "hasPet": true,
  "quality": "good"
}
```

#### Test 2.2: Inappropriate Content (Should FAIL)
⚠️ **Note**: Use test datasets like NSFW-Detection-Dataset for ethical testing

- [ ] Test image with human nudity
- [ ] Test image with gore/violence
- [ ] Test image with hate symbols

**Expected Result:**
```json
{
  "isSafe": false,
  "unsafeReason": "nudity", // or "gore", "hate"
  "hasPet": false,
  "quality": "unusable"
}
```

**Testing Method:**
```bash
# Use curl to test the API directly
curl -X POST http://localhost:3000/api/check-quality \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/test-image.jpg"}'
```

---

### ✅ Phase 3: Sensitive Prompt Filtering

**Test Cases:**

#### Test 3.1: Safe Prompts (Should PASS)
```typescript
// Test in browser console or API
const testPrompts = [
  "my golden retriever playing in the park",
  "cute cat with blue eyes",
  "hamster eating a carrot",
  "parrot with colorful feathers"
]

testPrompts.forEach(async (prompt) => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl: 'https://valid-pet-image.jpg',
      style: 'pixar-3d',
      prompt: prompt
    })
  })
  console.log(prompt, response.status) // Should be 200
})
```

#### Test 3.2: Blacklist Words (Should BLOCK)
- [ ] Prompt with explicit sexual terms → **400 error**
- [ ] Prompt with violence terms → **400 error**
- [ ] Prompt with hate speech → **400 error**

**Expected Response:**
```json
{
  "error": "Inappropriate content detected",
  "message": "Your input contains inappropriate language. Please revise and try again."
}
```

#### Test 3.3: Graylist Words (Should SANITIZE)
- [ ] Prompt: "my pet belly fur" → Sanitized to "my pet fur"
- [ ] Prompt: "aggressive dog playing" → Sanitized to "dog playing"

**Verification:**
Check database `moderation_logs` table for logged violations.

---

### ✅ Phase 4: Progressive Penalties

**Test Cases:**

#### Test 4.1: First Violation (Warning)
1. Create test user account
2. Upload inappropriate image or use blacklisted prompt
3. Check `moderation_logs` table:
   ```sql
   SELECT * FROM moderation_logs WHERE user_id = '[TEST_USER_ID]';
   ```
4. Verify `user_bans` table has warning entry:
   ```sql
   SELECT * FROM user_bans WHERE user_id = '[TEST_USER_ID]';
   ```

**Expected:** User receives warning but can still generate

#### Test 4.2: Third Violation (24h Cooldown)
1. Repeat violation 3 times with same test user
2. Attempt to generate again
3. **Expected Response:**
   ```json
   {
     "error": "Account in cooldown",
     "message": "Your account is in cooldown. Please wait 24 hours.",
     "cooldownSeconds": 86400
   }
   ```

#### Test 4.3: Sixth Violation (Permanent Ban)
1. Repeat violation 6 times
2. Attempt to generate
3. **Expected Response:**
   ```json
   {
     "error": "Account suspended",
     "message": "Your account has been suspended for violating our content policy."
   }
   ```

---

### ✅ Phase 5: User Reporting System

**Test Cases:**

#### Test 5.1: Submit Report
1. Login as User A
2. Generate and share a public image
3. Login as User B
4. View User A's image in gallery
5. Click "Report" button
6. Fill in reason (min 10 chars)
7. Submit report

**Verification:**
```sql
SELECT * FROM user_reports 
WHERE generation_id = '[GENERATION_ID]' 
ORDER BY created_at DESC;
```

#### Test 5.2: Duplicate Report Prevention
1. Try to report same image again with User B
2. **Expected:** Error "You have already reported this content"

#### Test 5.3: Self-Report Prevention
1. Try to report own image
2. **Expected:** Report button not visible

#### Test 5.4: Rate Limiting
1. Submit 10 reports within 1 hour
2. Try to submit 11th report
3. **Expected:** Error "Rate limit exceeded"

---

### ✅ Phase 6: Admin Dashboard

**Test Cases:**

#### Test 6.1: View Reports
1. Login as admin user
2. Navigate to `/admin/reports`
3. Verify pending reports are displayed
4. Check stats cards show correct counts

#### Test 6.2: Dismiss Report
1. Select a report
2. Click "Dismiss"
3. Add admin notes
4. Verify report status changes to "dismissed"

#### Test 6.3: Delete Content
1. Select a report
2. Click "Delete Content"
3. Verify:
   - Generation `is_public` set to `false`
   - Violation logged in `moderation_logs`
   - Report status updated

#### Test 6.4: Ban User
1. Select a report
2. Click "Ban User"
3. Verify:
   - Entry created in `user_bans` table
   - All user's public content hidden
   - User cannot generate new content

---

## Performance Testing

### Response Time Benchmarks

| Operation | Target | Acceptable |
|-----------|--------|------------|
| NSFW Image Check | < 2s | < 5s |
| Keyword Filter | < 50ms | < 200ms |
| Violation Check | < 100ms | < 500ms |
| Report Submission | < 500ms | < 2s |

**Testing Method:**
```javascript
// Browser console
console.time('nsfw-check')
await fetch('/api/check-quality', { 
  method: 'POST', 
  body: JSON.stringify({ imageUrl: 'test.jpg' }) 
})
console.timeEnd('nsfw-check')
```

---

## Edge Cases to Test

### 1. Hairless Pets (Critical)
- [ ] Sphynx cat (no fur, pink skin)
- [ ] Chinese Crested dog (mostly hairless)
- [ ] Hairless guinea pig

**Why Critical:** These are legitimate pets but may trigger false positives due to exposed skin.

### 2. Pet + Human in Frame
- [ ] Owner holding pet
- [ ] Hand petting pet
- [ ] Multiple people with pet

**Expected:** Should pass if pet is primary subject.

### 3. Ambiguous Animals
- [ ] Snake (no fur, scales)
- [ ] Lizard/reptile
- [ ] Fish in tank
- [ ] Exotic pets (hedgehog, ferret)

### 4. Prompt Edge Cases
- [ ] Breed names containing sensitive substrings (e.g., "cockatiel", "titmouse")
- [ ] Medical terms (e.g., "my pet has a tumor") - should allow
- [ ] Multiple languages (Chinese, Spanish prompts)

---

## Monitoring & Analytics

### Key Metrics to Track

1. **False Positive Rate**
   ```sql
   -- Check dismissed reports (potential false positives)
   SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_reports) as dismiss_rate
   FROM user_reports WHERE status = 'dismissed';
   ```

2. **Violation Distribution**
   ```sql
   SELECT violation_type, COUNT(*) as count
   FROM moderation_logs
   GROUP BY violation_type
   ORDER BY count DESC;
   ```

3. **Repeat Offenders**
   ```sql
   SELECT user_id, COUNT(*) as violations
   FROM moderation_logs
   WHERE created_at >= NOW() - INTERVAL '30 days'
   GROUP BY user_id
   HAVING COUNT(*) >= 3
   ORDER BY violations DESC;
   ```

---

## Rollback Plan

If moderation system causes issues:

### 1. Disable NSFW Check (Emergency)
```typescript
// app/api/check-quality/route.ts
// Comment out safety check, return safe by default
return {
  isSafe: true,
  unsafeReason: 'none',
  // ... rest of quality check
}
```

### 2. Disable Keyword Filter
```typescript
// app/api/generate/route.ts
// Comment out lines 515-570 (moderation section)
```

### 3. Remove Report Button
```typescript
// Hide report button in gallery
// components/gallery/gallery-grid-client.tsx
// Don't render <ReportButton />
```

---

## Production Deployment Checklist

- [ ] Run database migration on production
- [ ] Test with real user account (not admin)
- [ ] Verify Qwen API key is configured
- [ ] Test one full flow: upload → filter → generate
- [ ] Monitor error logs for 24 hours
- [ ] Check false positive rate after 1 week
- [ ] Review admin dashboard with real reports

---

## Support & Troubleshooting

### Common Issues

**Issue:** Qwen API returns 500 error
- **Solution:** Check `SILICONFLOW_API_KEY` environment variable

**Issue:** All images flagged as unsafe
- **Solution:** Verify Qwen prompt is correct, check API response format

**Issue:** Keyword filter too aggressive
- **Solution:** Review blacklist, move words to graylist

**Issue:** Reports not showing in admin panel
- **Solution:** Check RLS policies on `user_reports` table

---

## Testing Complete ✅

Once all tests pass:
1. Document any false positives encountered
2. Adjust keyword lists if needed
3. Train team on admin dashboard
4. Set up monitoring alerts
5. Deploy to production

**Estimated Testing Time:** 4-6 hours
**Recommended Tester:** QA engineer + Product manager
