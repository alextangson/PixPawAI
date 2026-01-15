# 🌐 OpenRouter API Setup Guide

**Date**: 2026-01-15  
**Provider**: OpenRouter (Better for global users)  
**Status**: ✅ Code Updated, Ready for Configuration

---

## ✅ What Changed

### **Switched from Replicate to OpenRouter**

**Why OpenRouter?**
- ✅ Better global accessibility
- ✅ No payment issues
- ✅ Same FLUX model quality
- ✅ OpenAI-compatible API
- ✅ Competitive pricing

**Code Changes:**
- ✅ Removed Replicate SDK dependency
- ✅ Implemented direct `fetch` to OpenRouter API
- ✅ Updated to use `black-forest-labs/flux-1-schnell`
- ✅ Added proper headers (Authorization, HTTP-Referer, X-Title)

---

## 🚀 Setup Steps (5 Minutes)

### **Step 1: Get OpenRouter API Key**

1. **Visit**: https://openrouter.ai

2. **Sign up** or **Sign in**:
   - Use GitHub, Google, or Email

3. **Go to API Keys**:
   ```
   https://openrouter.ai/keys
   ```

4. **Create new key**:
   - Click **"Create Key"**
   - Name it: "PixPawAI Development"
   - Click **"Create"**

5. **Copy the key**:
   - Should start with `sk-or-v1-`
   - Example: `sk-or-v1-abc123def456...`

---

### **Step 2: Add Credits to OpenRouter Account**

1. **Go to Billing**:
   ```
   https://openrouter.ai/credits
   ```

2. **Add Credits**:
   - Click **"Purchase Credits"**
   - Recommended: **$5-10** (enough for testing)
   - Enter credit card info
   - Complete payment

**Pricing Info:**
- FLUX.1 Schnell: ~$0.003 per image
- $5 = ~1,600 images
- $10 = ~3,300 images

---

### **Step 3: Update .env.local**

1. **Open file**:
   ```
   /Users/jiaxintang/Desktop/PixPawAI/.env.local
   ```

2. **Add this line** (or replace old REPLICATE_API_TOKEN):
   ```env
   OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
   ```

3. **Full .env.local should look like**:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   # OpenRouter AI (NEW)
   OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE

   # Optional: Remove old Replicate token if you want
   # REPLICATE_API_TOKEN=r8_xxx
   ```

4. **Save the file**

---

### **Step 4: Restart Server**

```bash
# In terminal, press Ctrl+C to stop server
# Then restart:
npm run dev
```

---

## 🧪 Testing

### **Test 1: Basic Generation**

1. Open http://localhost:3000
2. Login to your account
3. Click "Try Now"
4. Upload a pet photo
5. Enter prompt: "a majestic portrait of my golden retriever"
6. Select style: "Johannes Vermeer" (or any other)
7. Click "Generate Portrait"
8. Wait 10-30 seconds
9. ✅ Should see generated image!

### **Expected Server Logs:**

```
Generation request: { userId: 'xxx', style: 'Johannes Vermeer' }
Final prompt: "a majestic portrait of my golden retriever, wearing a blue and yellow..."
Generation record created: xxx
Credits decremented, remaining: 999
Calling OpenRouter API...
OpenRouter response: { data: [{ url: 'https://...' }] }
AI generation completed: https://...
Uploading to storage...
Upload completed: https://xxx.supabase.co/storage/...
✅ Success!
```

---

## 🔧 API Details

### **OpenRouter Endpoint:**
```
POST https://openrouter.ai/api/v1/images/generations
```

### **Headers:**
```javascript
{
  'Authorization': 'Bearer sk-or-v1-xxx',
  'HTTP-Referer': 'http://localhost:3000',
  'X-Title': 'PixPawAI',
  'Content-Type': 'application/json'
}
```

### **Request Body:**
```json
{
  "model": "black-forest-labs/flux-1-schnell",
  "prompt": "a majestic portrait of my golden retriever, wearing a blue...",
  "n": 1,
  "size": "1024x1024"
}
```

### **Response Format:**
```json
{
  "data": [
    {
      "url": "https://image-url-from-openrouter.com/..."
    }
  ]
}
```

---

## 📊 OpenRouter vs Replicate

| Feature | OpenRouter | Replicate |
|---------|-----------|-----------|
| **Global Access** | ✅ Excellent | ⚠️ Limited |
| **Payment** | ✅ Easy | ⚠️ Issues |
| **Model** | FLUX.1 Schnell | Flux Schnell |
| **Speed** | ~10-20s | ~10-30s |
| **Price** | ~$0.003 | ~$0.003 |
| **API Format** | OpenAI-like | Custom SDK |
| **Setup** | ✅ Simple | ⚠️ Complex |

---

## 🐛 Troubleshooting

### **Error 1: "OPENROUTER_API_KEY is not configured"**

**Cause:** API key not in .env.local  
**Fix:** 
```bash
# Add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-your-key

# Restart server:
npm run dev
```

---

### **Error 2: "401 Unauthorized"**

**Cause:** Invalid API key  
**Fix:**
1. Go to https://openrouter.ai/keys
2. Create new key
3. Update .env.local
4. Restart server

---

### **Error 3: "402 Insufficient Credits"**

**Cause:** OpenRouter account has no credits  
**Fix:**
1. Go to https://openrouter.ai/credits
2. Purchase credits ($5-10)
3. Wait 2-5 minutes
4. Retry generation

---

### **Error 4: "Invalid response format"**

**Cause:** OpenRouter API returned unexpected format  
**Fix:**
- Check server logs for actual response
- Verify model name is correct
- Contact OpenRouter support if persistent

---

## 💡 Advanced Configuration

### **Use Different Models:**

OpenRouter supports many models. To switch:

```typescript
// In app/api/generate/route.ts
body: JSON.stringify({
  model: 'black-forest-labs/flux-1-schnell',  // Current
  // Or try:
  // model: 'black-forest-labs/flux-1-dev',   // Higher quality, slower
  // model: 'stability-ai/stable-diffusion-xl', // Alternative
  ...
})
```

### **Adjust Quality Settings:**

```typescript
body: JSON.stringify({
  model: 'black-forest-labs/flux-1-schnell',
  prompt: finalPrompt,
  n: 1,
  size: '1024x1024',
  // Optional parameters:
  // quality: 'hd',
  // style: 'vivid',
})
```

---

## 📋 Migration Checklist

- [ ] ✅ Code updated (app/api/generate/route.ts)
- [ ] ⏳ OpenRouter account created
- [ ] ⏳ API key generated
- [ ] ⏳ Credits added to OpenRouter account
- [ ] ⏳ OPENROUTER_API_KEY added to .env.local
- [ ] ⏳ Server restarted
- [ ] ⏳ Test generation successful

---

## 🎯 Quick Start Commands

```bash
# 1. Add API key to .env.local
echo "OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY" >> .env.local

# 2. Restart server
npm run dev

# 3. Test in browser
open http://localhost:3000
```

---

## 📞 Next Steps

1. **Sign up for OpenRouter**: https://openrouter.ai
2. **Get API key**: https://openrouter.ai/keys
3. **Add credits**: https://openrouter.ai/credits ($5-10)
4. **Update .env.local** with new key
5. **Tell me when ready**, I'll restart the server!

---

**OpenRouter is much better for global users!** 🌐

Once you have the API key and credits, generation should work perfectly. Let me know when you're ready to test!
