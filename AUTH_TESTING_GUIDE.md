# 🧪 Authentication Testing Guide

## ✅ What's Implemented

### 1. **Supabase Client Setup**
- ✅ Browser Client (`lib/supabase/client.ts`)
- ✅ Server Client (`lib/supabase/server.ts`)
- ✅ Middleware (`lib/supabase/middleware.ts`)

### 2. **Authentication Components**
- ✅ `LoginButton` - Google OAuth + Email Magic Link
- ✅ `UserMenu` - User Avatar, Credits Display, Dropdown Menu

### 3. **Auth Actions** (`lib/auth/actions.ts`)
- ✅ `signInWithGoogle()` - Google OAuth
- ✅ `signInWithEmail()` - Email Magic Link
- ✅ `signOut()` - Sign out user
- ✅ `getUser()` - Get current user

### 4. **Auth Callback** (`app/auth/callback/route.ts`)
- ✅ Handles OAuth redirect
- ✅ Exchanges code for session
- ✅ Creates profile in database (via trigger)

### 5. **Navbar Integration**
- ✅ Shows "Log In" button for guests
- ✅ Shows Avatar + Credits for logged-in users
- ✅ Fetches credits from `profiles` table

---

## 🧪 Testing Checklist

### **Phase 1: Google OAuth Flow**

1. **Start Dev Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

2. **Test Login**
   - [ ] Click "Create Now" button in Navbar
   - [ ] Click "Continue with Google"
   - [ ] Select your Google account
   - [ ] Wait for redirect to homepage

3. **Verify User State**
   - [ ] **Navbar**: Should show your avatar (first letter of your name)
   - [ ] **Credits Badge**: Should show a yellow badge with "2" (default credits)
   - [ ] **Desktop Only**: Should show "Credits: 2" text next to avatar

4. **Test Dropdown Menu**
   - [ ] Click on your avatar
   - [ ] Verify dropdown opens with:
     - ✅ Your name and email
     - ✅ Credits display (yellow gradient box)
     - ✅ "My Profile" button
     - ✅ "Buy More Credits" button
     - ✅ "Settings" button
     - ✅ "Sign Out" button (red text)

5. **Test Sign Out**
   - [ ] Click "Sign Out"
   - [ ] Verify redirect to homepage
   - [ ] Verify Navbar shows "Log In" button again

---

### **Phase 2: Database Integration**

1. **Check Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **Table Editor** → **profiles**
   - [ ] Verify your user profile exists
   - [ ] Verify `credits = 2` (default from trigger)

2. **Test Credits Display**
   - [ ] Log in again
   - [ ] Open browser DevTools (F12)
   - [ ] Go to **Console** tab
   - [ ] Verify no errors about `profiles` table

3. **Verify RLS (Row Level Security)**
   - [ ] Open browser Network tab
   - [ ] Click on your avatar to open dropdown
   - [ ] Find the request to `/rest/v1/profiles`
   - [ ] Verify status is `200` (not `401` or `403`)

---

### **Phase 3: Email Magic Link (Optional)**

1. **Test Magic Link**
   - [ ] Click "Log In" button
   - [ ] Click "Or continue with email"
   - [ ] Enter your email address
   - [ ] Click "Send Magic Link"
   - [ ] Check your email inbox

2. **Verify Email**
   - [ ] Find email from "noreply@mail.app.supabase.io"
   - [ ] Click the magic link
   - [ ] Verify redirect to homepage
   - [ ] Verify you're logged in

---

### **Phase 4: UI/UX Testing**

1. **Desktop View (Large Screen)**
   - [ ] Avatar shows with credits badge (bottom-right corner)
   - [ ] "Credits: 2" text visible next to avatar
   - [ ] Dropdown menu opens correctly

2. **Tablet View (Medium Screen)**
   - [ ] Avatar shows with credits badge
   - [ ] "Credits: 2" text hidden (only badge visible)
   - [ ] Dropdown menu still works

3. **Mobile View (Small Screen)**
   - [ ] Avatar visible in hamburger menu
   - [ ] Credits badge still visible
   - [ ] Dropdown works when tapped

---

## 🎯 What to Test Next

### **Immediate Next Steps:**

1. **Upload Flow** (High Priority)
   - Implement file upload to Supabase Storage
   - Create `user-uploads` bucket
   - Test image upload from `UploadModal`

2. **Credit Deduction** (High Priority)
   - When user generates an image, deduct 1 credit
   - Update `profiles.credits` in database
   - Refresh credits display in Navbar

3. **AI Generation** (Core Feature)
   - Connect to Replicate API
   - Send uploaded image + style prompt
   - Save result to `generated-results` bucket
   - Create row in `generations` table

4. **Payment Integration** (Monetization)
   - Add Stripe/LemonSqueezy
   - Allow users to buy credit packs
   - Update `profiles.credits` after purchase

---

## 🐛 Common Issues & Fixes

### **Issue 1: "Invalid login credentials" error**
**Fix:** Check that Google OAuth is enabled in Supabase:
- Dashboard → Authentication → Providers → Google → Enable

### **Issue 2: Credits show as `null` or `0`**
**Fix:** Run the database trigger manually:
```sql
-- Go to Supabase SQL Editor and run:
SELECT * FROM profiles WHERE id = 'your-user-id';
```
If profile doesn't exist, create it:
```sql
INSERT INTO profiles (id, email, credits)
VALUES ('your-user-id', 'your-email@example.com', 2);
```

### **Issue 3: Redirect loop after Google login**
**Fix:** Check your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
Make sure there are NO quotes around the values.

### **Issue 4: "Cannot read property 'credits' of null"**
**Fix:** The trigger didn't fire. Manually insert a profile:
- Go to Supabase Table Editor
- Click "profiles" table
- Click "Insert row"
- Fill in: `id` (your user ID), `email`, `credits` (2)

---

## 📊 Expected User Flow

```
┌─────────────────┐
│  User visits    │
│  pixpawai.com   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Clicks "Create  │
│    Now" CTA     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Login Modal     │
│ Opens (Dialog)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Clicks "Google" │
│     Button      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Google OAuth    │
│  Redirect Page  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ /auth/callback  │
│ (Exchange code) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database       │
│  Trigger fires  │
│ (Create profile)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Redirect to "/"  │
│ (Homepage)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Navbar shows:   │
│ Avatar + Credits│
└─────────────────┘
```

---

## 🚀 Ready for Testing!

**Commands to Run:**
```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000

# Watch console for errors
# (Open DevTools with F12)
```

**What Success Looks Like:**
1. ✅ "Log In" button visible for guests
2. ✅ Click button → Dialog opens
3. ✅ Click "Google" → OAuth flow starts
4. ✅ After login → Navbar shows avatar + credits
5. ✅ Click avatar → Dropdown shows user info
6. ✅ Click "Sign Out" → Returns to guest state

---

## 📝 Next Steps After Auth Testing

Once authentication is fully tested and working:

1. **Storage Setup**
   - Create `user-uploads` bucket (private)
   - Create `generated-results` bucket (public)
   - Set up RLS policies

2. **Upload Modal**
   - Connect to Supabase Storage
   - Upload image files
   - Validate file types and sizes

3. **AI Integration**
   - Set up Replicate API
   - Create `/api/generate` endpoint
   - Send image + prompt to AI

4. **Credits System**
   - Deduct credits on generation
   - Block users with 0 credits
   - Show "Buy Credits" modal

5. **Payment**
   - Stripe/LemonSqueezy integration
   - Credit pack purchase flow
   - Webhook to update database

---

**Need Help?**
- Check Supabase Logs: Dashboard → Logs → API
- Check Browser Console: F12 → Console
- Check Network Tab: F12 → Network → Filter by "supabase"

Good luck! 🚀
