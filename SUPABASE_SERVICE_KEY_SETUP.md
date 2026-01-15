# Supabase Service Role Key Setup

## Issue
Storage uploads were failing with RLS (Row Level Security) policy error:
```
❌ Storage upload error: new row violates row-level security policy
```

## Root Cause
The API was using `NEXT_PUBLIC_SUPABASE_ANON_KEY` which is subject to RLS policies. Server-side operations like uploading generated images need to bypass RLS.

## Solution

### 1. Add Service Role Key to Environment
The Service Role Key has full admin access and bypasses RLS policies.

**Find your Service Role Key:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Find **Project API keys** section
5. Copy the **service_role** key (⚠️ Keep this secret!)

**Add to `.env.local`:**
```env
# Existing keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Add this (NEW):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

### 2. Restart Development Server
After adding the key:
```bash
# Stop the server (Ctrl+C or kill the process)
npm run dev
```

## Security Notes

⚠️ **CRITICAL SECURITY:**
- **NEVER** expose the service role key to the client
- **NEVER** commit `.env.local` to git
- Only use `createAdminClient()` in secure server-side code:
  - ✅ API Routes (`app/api/**/route.ts`)
  - ✅ Server Actions
  - ❌ Client Components
  - ❌ Frontend code

## Code Changes

### Created `createAdminClient()` in `lib/supabase/server.ts`
```typescript
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or Service Role Key')
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
```

### Updated `uploadBase64ToStorage()` in `app/api/generate/route.ts`
```typescript
async function uploadBase64ToStorage(...) {
  // Use admin client to bypass RLS
  const supabase = createAdminClient() // ✅ Changed from createClient()
  
  // Upload with full admin permissions
  const { data, error } = await supabase.storage
    .from('generated-results')
    .upload(filePath, buffer, {...})
  
  // ...
}
```

## Storage Structure

Files are now stored at:
```
Bucket: generated-results (public)
├── user-uuid-1/
│   ├── 1705325123456-gen-uuid-1.png
│   └── 1705325234567-gen-uuid-2.png
└── user-uuid-2/
    └── 1705325345678-gen-uuid-3.png
```

Path format: `{userId}/{timestamp}-{generationId}.png`

## Testing

After adding the service role key, test the upload:

1. Upload a pet image
2. Generate art

**Expected console output:**
```
✅ Base64 data URL found in message.images
📊 Received Base64 length: 1901940 chars
📦 Converted Base64 to Buffer: 1426455 bytes
✅ Uploaded to storage: https://xxx.supabase.co/storage/v1/object/public/generated-results/user-123/...
✅ Generation and upload completed
```

## Troubleshooting

### "Missing Supabase URL or Service Role Key"
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
- Restart the dev server after adding it

### Still getting RLS errors
- Verify you copied the **service_role** key (not anon key)
- Check the bucket `generated-results` exists and is public
- Verify the key starts with `eyJhbGc...`

### 403 Forbidden
- Ensure the bucket policy allows public read access
- Or use `getPublicUrl()` which works for public buckets

## Environment Variables Checklist

Required in `.env.local`:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (NEW)
- ✅ `OPENROUTER_API_KEY`

## Files Modified
- `lib/supabase/server.ts` - Added `createAdminClient()`
- `app/api/generate/route.ts` - Use admin client for uploads
