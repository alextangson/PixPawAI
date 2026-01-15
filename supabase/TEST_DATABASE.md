# 🧪 Database Testing Guide

## ✅ Step 1: Run the Schema

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL Editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. Wait for success message: ✅ "Success. No rows returned"

---

## ✅ Step 2: Verify Tables

Run this query to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'generations', 'gallery_images');
```

**Expected Result**: 3 rows (profiles, generations, gallery_images)

---

## ✅ Step 3: Test Auto-Profile Creation

### 3a. Sign up a test user

1. Go to your app: `http://localhost:3001`
2. Click "Log In"
3. Enter a test email (e.g., `test@example.com`)
4. Check email for magic link
5. Click the link to sign in

### 3b. Verify profile was auto-created

Run this query in SQL Editor:

```sql
SELECT id, email, credits, tier, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result**: Your test user appears with:
- `credits` = 2
- `tier` = 'free'

---

## ✅ Step 4: Test RLS Policies

### 4a. Test as authenticated user (in SQL Editor)

```sql
-- This should return YOUR profile
SELECT * FROM public.profiles
WHERE id = auth.uid();

-- This should return empty (you can't see other users)
SELECT * FROM public.profiles
WHERE id != auth.uid();
```

**Expected Result**: Only your own profile is visible

### 4b. Test gallery public access

```sql
-- This should work even without auth
SELECT * FROM public.gallery_images
LIMIT 5;
```

**Expected Result**: All gallery images visible

---

## ✅ Step 5: Test Credit System

### 5a. Check current credits

```sql
SELECT id, email, credits 
FROM public.profiles 
WHERE id = auth.uid();
```

### 5b. Decrement credits (simulate a generation)

```sql
SELECT public.decrement_credits(auth.uid());
```

**Expected Result**: Returns new credit count (should be 1 if starting from 2)

### 5c. Verify credits updated

```sql
SELECT credits FROM public.profiles WHERE id = auth.uid();
```

**Expected Result**: `credits` = 1

---

## ✅ Step 6: Test Generations Table

### Insert a test generation

```sql
INSERT INTO public.generations (
  user_id,
  status,
  input_url,
  prompt,
  style
) VALUES (
  auth.uid(),
  'processing',
  'https://example.com/test-input.jpg',
  'A cute dog in 3D Pixar style',
  '3D Movie'
);
```

**Expected Result**: Success

### Verify you can see it

```sql
SELECT * FROM public.generations
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

**Expected Result**: Your test generation appears

---

## ✅ Step 7: Test Storage Buckets

### 7a. Verify buckets exist

Go to **Supabase Dashboard** → **Storage**

You should see:
- ✅ `user-uploads` (Private)
- ✅ `generated-results` (Public)

### 7b. Test upload (via Next.js app)

In your Next.js code:

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const userId = (await supabase.auth.getUser()).data.user?.id

// Upload to user-uploads bucket
const { data, error } = await supabase.storage
  .from('user-uploads')
  .upload(`${userId}/test-image.jpg`, file)
```

**Expected Result**: Upload succeeds

### 7c. Verify file is private

Try to access the file URL without auth → Should fail (403)

---

## ✅ Step 8: Test Gallery Query (Frontend)

### Sample query for gallery page:

```sql
-- Get all gallery images filtered by species
SELECT 
  id,
  image_url,
  prompt_template,
  style_category,
  species,
  tags,
  view_count
FROM public.gallery_images
WHERE species = 'dog'
AND 'Pixar' = ANY(tags)
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🐛 Troubleshooting

### Issue: "permission denied for table profiles"
**Solution**: Run the schema again. RLS policies may not have applied.

### Issue: "function public.handle_new_user() does not exist"
**Solution**: Check the Functions section in Supabase Dashboard. The trigger should exist.

### Issue: New user signup doesn't create profile
**Solution**: 
1. Go to **Database** → **Triggers**
2. Verify `on_auth_user_created` exists
3. If not, re-run the schema

### Issue: Can't upload to storage
**Solution**: 
1. Check storage policies in **Storage** → **Policies**
2. Ensure user is authenticated
3. Check file path format: `{userId}/filename.jpg`

---

## 📊 Useful Admin Queries

### View all users and their credits

```sql
SELECT 
  email,
  credits,
  tier,
  total_generations,
  created_at
FROM public.profiles
ORDER BY created_at DESC;
```

### View recent generations

```sql
SELECT 
  p.email,
  g.status,
  g.style,
  g.created_at
FROM public.generations g
JOIN public.profiles p ON g.user_id = p.id
ORDER BY g.created_at DESC
LIMIT 20;
```

### View user stats

```sql
SELECT * FROM public.user_stats
ORDER BY total_generations DESC;
```

### Add credits to a user (admin only)

```sql
UPDATE public.profiles
SET credits = credits + 10
WHERE email = 'user@example.com';
```

---

## ✅ Success Checklist

- [ ] Schema runs without errors
- [ ] All 3 tables exist (profiles, generations, gallery_images)
- [ ] New user signup auto-creates profile with 2 credits
- [ ] RLS policies work (can only see own data)
- [ ] Credit decrement function works
- [ ] Storage buckets exist
- [ ] Can upload to user-uploads bucket
- [ ] Gallery images are publicly readable

---

## 🎯 Next Steps

Once all tests pass:

1. **Frontend Integration**: Update Next.js to use these tables
2. **AI Integration**: Connect Replicate API to generations table
3. **Payment Integration**: Add Stripe webhooks to add credits
4. **Admin Dashboard**: Build interface to manage gallery_images

---

**Database is ready for production! 🚀**
