# 🚀 Quick Start: Enable Supabase Auth (5 Minutes)

## ✅ What's Already Done
- ✅ All code is written and working
- ✅ Production build passing
- ✅ UI/UX complete
- ✅ Mobile responsive

## ⏭️ What You Need To Do

### Step 1: Create Supabase Project (2 minutes)

1. Go to **https://app.supabase.com**
2. Click **"New Project"**
3. Fill in:
   - **Name**: `pixpaw-ai-dev` (or any name)
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

### Step 2: Get API Keys (1 minute)

1. In your Supabase project, go to **Settings** → **API**
2. Copy these 2 keys:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

### Step 3: Create `.env.local` (1 minute)

Create a file named `.env.local` in the **PixPawAI root directory**:

```bash
# Copy-paste these and replace with YOUR keys from Step 2
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

⚠️ **Important**: Replace `your-project-ref` and `your-key-here` with YOUR actual values!

### Step 4: Configure Redirect URLs (1 minute)

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add this to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   ```
3. Click **"Save"**

### Step 5: Enable Google OAuth (Optional, 5 minutes)

**Skip this if you only want to test Magic Link first**

1. Go to **Authentication** → **Providers**
2. Find **Google** and click **Edit**
3. Toggle **"Google enabled"** to ON
4. Follow [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google) to:
   - Create Google Cloud project
   - Get Client ID & Client Secret
   - Paste them in Supabase
5. Click **Save**

### Step 6: Test It! (30 seconds)

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Open **http://localhost:3000**

3. Click **"Log In"** in the top right

4. Try Magic Link:
   - Enter your email
   - Click "Send Magic Link"
   - Check your email
   - Click the link
   - 🎉 You're logged in!

5. Verify:
   - Your avatar appears in the top right
   - Click avatar → dropdown opens
   - Click "Sign Out" → you're logged out

---

## 🐛 Troubleshooting

### Issue: "Invalid login credentials"
- Check that your `.env.local` has the correct keys
- Restart the dev server after creating `.env.local`

### Issue: Magic Link not received
- Check your spam folder
- Use a real email (Gmail, Outlook, etc.)
- Check Supabase email limits (free tier has daily limits)

### Issue: OAuth redirect fails
- Check that you added `http://localhost:3000/auth/callback` to Redirect URLs
- Check that `NEXT_PUBLIC_SITE_URL` in `.env.local` is correct

### Issue: "Port 3000 in use"
- Server will automatically use port 3001
- Update redirect URL in Supabase to `http://localhost:3001/auth/callback`

---

## 📄 Need More Help?

- **Full Setup Guide**: Read `SUPABASE_AUTH_SETUP.md`
- **Environment Variables**: Read `ENV_SETUP.md`
- **Supabase Docs**: https://supabase.com/docs/guides/auth

---

## ✅ What Works Right Now

Without any additional setup (just `.env.local`):
- ✅ Email Magic Link authentication
- ✅ User sessions (stays logged in)
- ✅ Sign out
- ✅ User avatar in Navbar
- ✅ Mobile responsive
- ✅ Error handling

With Google OAuth setup:
- ✅ "Continue with Google" button works
- ✅ One-click sign up/login

---

## 🎯 Next Steps (After Auth Works)

1. **Phase 2**: Set up Database tables
2. **Phase 3**: Connect AI generation (Replicate API)
3. **Phase 4**: Add payment system (Stripe)
4. **Phase 5**: Deploy to production (Vercel)

---

**Estimated Total Time**: 5-10 minutes  
**Difficulty**: Easy (just copy-paste)

🚀 **You're almost there!**
