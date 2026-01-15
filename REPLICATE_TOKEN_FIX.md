# 🔑 Replicate Token Issue - Fix Required

**Problem**: Invalid Replicate API Token  
**Error**: `401 Unauthorized: "You did not pass a valid authentication token"`  
**Status**: ⚠️ Action Required

---

## 🐛 What Went Wrong

### Current Token (Invalid):
```
r8_8vTTVLhxYNZIaiJ6Mhpcejb1pWrxFB633B423
```

### Why It's Failing:
- ❌ Token is invalid, expired, or revoked
- ❌ Replicate API rejects it with 401 Unauthorized
- ❌ Cannot generate images without valid token

---

## 🔧 How to Fix (3 Steps)

### **Step 1: Get New Token from Replicate**

1. **Open browser** and go to:
   ```
   https://replicate.com/account/api-tokens
   ```

2. **Sign in** if needed (or create account if you don't have one)

3. **Create new token**:
   - Click **"Create token"** button
   - Name it: "PixPaw AI Development"
   - Click **"Create"**

4. **Copy the token**:
   - Should start with `r8_`
   - Should be **40+ characters long**
   - Example format: `r8_aBcDeF1234567890aBcDeF1234567890aBcDeF12`

---

### **Step 2: Update .env.local File**

1. **Open file** in your editor:
   ```
   /Users/jiaxintang/Desktop/PixPawAI/.env.local
   ```

2. **Find this line**:
   ```env
   REPLICATE_API_TOKEN=r8_8vTTVLhxYNZIaiJ6Mhpcejb1pWrxFB633B423
   ```

3. **Replace with your new token**:
   ```env
   REPLICATE_API_TOKEN=r8_YOUR_NEW_TOKEN_HERE
   ```

4. **Save the file** (Cmd+S / Ctrl+S)

**Important Notes:**
- ✅ No quotes around the token
- ✅ No spaces before or after
- ✅ Must start with `r8_`
- ✅ Should be one long line

**Example of correct format:**
```env
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Replicate AI (UPDATE THIS)
REPLICATE_API_TOKEN=r8_aBcDeF1234567890aBcDeF1234567890aBcDeF12
```

---

### **Step 3: Restart Development Server**

**Option A: Terminal Command**
```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
cd /Users/jiaxintang/Desktop/PixPawAI
npm run dev
```

**Option B: Quick Script**

I can restart it for you - just tell me when you've updated the token!

---

## ✅ Verification

After restarting, you should see in terminal:
```
✓ Ready in 2.6s
- Environments: .env.local   ✅ (confirms .env.local loaded)
```

Then test generation:
1. Upload a photo
2. Enter prompt
3. Select style
4. Click "Generate"

**Expected result:**
```
Generation request: { userId: 'xxx', style: 'Johannes Vermeer' }
Credits decremented, remaining: 0
Starting AI generation...
AI generation completed: https://replicate.delivery/...
✅ Success!
```

---

## 🆘 If You Don't Have a Replicate Account

### Create One (Free):

1. **Go to**: https://replicate.com/signup

2. **Sign up with**:
   - GitHub account (recommended)
   - Or email

3. **Verify email** (if using email signup)

4. **Get token**:
   - After signup, go to: https://replicate.com/account/api-tokens
   - Create new token
   - Copy it

### Pricing Info:
- ✅ **Free tier** includes some credits
- ✅ **Pay-as-you-go** after that
- ✅ **Flux Schnell** costs ~$0.003 per generation (very cheap!)

---

## 🔍 Common Issues

### Issue 1: "Token still invalid after update"

**Causes:**
- Typo in token
- Extra spaces in .env.local
- Server not restarted

**Fix:**
```bash
# 1. Double-check token in .env.local
# 2. Make sure no spaces or quotes
# 3. Restart server:
npm run dev
```

### Issue 2: "Token works but different error"

**Example errors:**
- "Insufficient credits" → Add credits to Replicate account
- "Model not found" → Check model name in code
- "Timeout" → Wait longer, API might be slow

### Issue 3: "Can't find API tokens page"

**Direct links:**
- API Tokens: https://replicate.com/account/api-tokens
- Billing: https://replicate.com/account/billing
- Docs: https://replicate.com/docs

---

## 📊 Expected Behavior After Fix

### Successful Generation Flow:

```
1. User uploads photo
   ↓
2. Enters prompt: "a majestic portrait of my golden retriever"
   ↓
3. Selects style: "Johannes Vermeer"
   ↓
4. Clicks "Generate Portrait"
   ↓
5. Server logs:
   - Generation request received ✓
   - Credits decremented ✓
   - Starting AI generation... ✓
   - Calling Replicate API ✓
   - Response: 200 OK ✓
   - AI generation completed ✓
   - Upload to storage ✓
   ↓
6. User sees generated image 🎉
```

---

## 🎯 Action Items

**Right now:**
- [ ] Go to https://replicate.com/account/api-tokens
- [ ] Create new token
- [ ] Copy the token
- [ ] Update .env.local
- [ ] Tell me when done (I'll restart server for you)

**After server restart:**
- [ ] Test generation
- [ ] Verify it works
- [ ] Check credits decrement

---

## 💡 Pro Tips

1. **Save your token securely**
   - Don't commit .env.local to git
   - Add to password manager

2. **Monitor usage**
   - Check: https://replicate.com/account/billing
   - Set up alerts for spending

3. **Multiple tokens**
   - Create separate tokens for dev/prod
   - Easier to revoke if needed

---

## 🚀 Next Steps After Fix

Once token is working:

1. **Test all styles**
   - Johannes Vermeer ✓
   - Anime
   - Watercolor
   - etc.

2. **Try different prompts**
   - Portrait styles
   - Action scenes
   - Fantasy settings

3. **Check credits**
   - Monitor remaining credits
   - Should decrement after each generation

4. **Configure Storage**
   - Make sure Supabase Storage is set up
   - Follow STORAGE_SETUP_GUIDE.md if not

---

**Please get your new token and let me know when you've updated .env.local!** 

I'll restart the server for you and we'll test it together. 🚀
