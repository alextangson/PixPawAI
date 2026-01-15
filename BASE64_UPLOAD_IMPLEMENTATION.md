# Base64 Image Upload Implementation

## Problem Statement
OpenRouter was returning **Base64-encoded images** (`b64_json`) instead of URLs, causing:
1. **Terminal crashes** - Logging massive Base64 strings (100K+ chars) froze the console
2. **500 errors** - Vercel payload limits were exceeded when returning Base64 to frontend
3. **Poor performance** - Transferring large Base64 strings through JSON responses

## Solution Architecture

### Flow Overview
```
OpenRouter API → Extract Base64 → Convert to Buffer → Upload to Supabase → Return Public URL
```

### Key Components

#### 1. Safe Logging (`createSafeLog`)
Prevents terminal crashes by truncating long strings:
```typescript
function createSafeLog(data: any): string {
  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...[TRUNCATED ' + value.length + ' chars]'
    }
    return value
  }, 2)
}
```

**Result:** Console shows "...TRUNCATED 150000 chars" instead of crashing.

#### 2. Base64 Extraction (`extractBase64FromResponse`)
Multi-strategy parser that finds Base64 in various response formats:

**Strategy 1:** `data.data[0].b64_json` (DALL-E format)
```json
{
  "data": [
    { "b64_json": "iVBORw0KGgo..." }
  ]
}
```

**Strategy 2:** `choices[0].message.images` (FLUX.2 with Base64)
```json
{
  "choices": [{
    "message": {
      "images": ["data:image/png;base64,iVBORw0KGgo..."]
    }
  }]
}
```

**Strategy 3:** `choices[0].message.content` (Chat format)
```json
{
  "choices": [{
    "message": {
      "content": "data:image/png;base64,iVBORw0KGgo..."
    }
  }]
}
```

**Strategy 4:** `data.output` (Replicate format)
```json
{
  "output": "iVBORw0KGgo..."
}
```

**Strategy 5:** Top-level `b64_json`
```json
{
  "b64_json": "iVBORw0KGgo..."
}
```

#### 3. Direct Upload (`uploadBase64ToStorage`)
Uploads Base64 directly to Supabase without going through frontend:

```typescript
async function uploadBase64ToStorage(
  base64Data: string,
  userId: string,
  generationId: string
): Promise<string> {
  // 1. Convert Base64 → Buffer
  const buffer = Buffer.from(base64Data, 'base64')
  
  // 2. Upload to Supabase Storage
  const filePath = `public/${userId}/${timestamp}-${generationId}.png`
  await supabase.storage
    .from('generated-results')
    .upload(filePath, buffer, {
      contentType: 'image/png',
      cacheControl: '31536000', // 1 year
    })
  
  // 3. Get public URL
  const publicUrl = supabase.storage
    .from('generated-results')
    .getPublicUrl(filePath)
  
  return publicUrl
}
```

#### 4. Updated Main Function
```typescript
async function generateWithOpenRouter(
  finalPrompt: string,
  userId: string,      // NEW: for storage path
  generationId: string // NEW: for unique filename
): Promise<string> {
  // 1. Call OpenRouter API
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {...})
  const data = await response.json()
  
  // 2. Safe logging (NEVER log full Base64)
  console.log('Response:', createSafeLog(data))
  
  // 3. Extract Base64
  const base64Data = extractBase64FromResponse(data)
  
  if (base64Data) {
    console.log('Base64 length:', base64Data.length, 'chars')
    
    // 4. Upload to Supabase Storage
    const publicUrl = await uploadBase64ToStorage(base64Data, userId, generationId)
    
    // 5. Return public URL (not Base64!)
    return publicUrl
  }
  
  // Fallback: handle direct URLs
  // ...
}
```

## Benefits

### 1. No More Terminal Crashes ✅
- Base64 strings are **never logged in full**
- Console shows: `"Base64 length: 150000 chars"` instead of actual data

### 2. No Payload Limit Issues ✅
- Base64 never goes to frontend
- API returns small JSON: `{ outputUrl: "https://..." }`
- Response size: ~200 bytes instead of ~150KB

### 3. Better Performance ✅
- Single upload operation (backend → Supabase)
- No frontend processing of large Base64 strings
- Images stored permanently with CDN caching

### 4. Cleaner Code ✅
- Removed redundant `uploadGeneratedImage` call in POST handler
- All image handling in one place
- Clear separation of concerns

## Storage Structure

```
Supabase Storage Bucket: generated-results
├── public/
│   ├── user-uuid-1/
│   │   ├── 1705325123456-gen-uuid-1.png
│   │   └── 1705325234567-gen-uuid-2.png
│   └── user-uuid-2/
│       └── 1705325345678-gen-uuid-3.png
```

**File naming:** `{timestamp}-{generationId}.png`
- Unique per generation
- Easy to debug
- Chronologically sortable

## Database Updates

The `generations` table now stores **only the public URL**:

```sql
UPDATE generations 
SET 
  status = 'succeeded',
  output_image = 'https://xxx.supabase.co/storage/v1/object/public/generated-results/public/user-123/1705325123456-gen-456.png'
WHERE id = 'gen-456';
```

## Testing

### Expected Console Output
```
🚀 Calling OpenRouter API with FLUX.2-flex...
📝 Prompt: A golden retriever in Pixar style
📡 Response Status: 200
✅ Response received. Structure: {
  "choices": [
    {
      "message": {
        "images": [
          "data:image/png;base64,iVBORw0KGgo...[TRUNCATED 150000 chars]"
        ]
      }
    }
  ]
}
✅ Base64 data URL found in message.images
📊 Received Base64 length: 150000 chars
📦 Converted Base64 to Buffer: 112500 bytes
✅ Uploaded to storage: https://xxx.supabase.co/storage/v1/object/public/...
✅ Generation and upload completed
```

### Error Handling
If Base64 extraction fails, the function:
1. Logs response structure safely
2. Checks for direct URL fallbacks
3. Throws descriptive error with response keys

## Migration Notes

### Changed Function Signatures
**Before:**
```typescript
generateWithOpenRouter(prompt: string): Promise<string>
```

**After:**
```typescript
generateWithOpenRouter(prompt: string, userId: string, generationId: string): Promise<string>
```

### Removed Dependencies
- ❌ `uploadGeneratedImage` from `lib/supabase/storage`
- Upload logic now integrated into `generateWithOpenRouter`

### Environment Variables Required
```env
OPENROUTER_API_KEY=sk-or-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## Files Modified
- `app/api/generate/route.ts` - Complete rewrite of image handling

## Production Considerations

### Supabase Storage Limits
- Free tier: 1GB storage
- Image size: ~100KB per generation
- Capacity: ~10,000 generations on free tier

### CDN & Caching
- Files are cached for 1 year (`cacheControl: '31536000'`)
- Supabase serves via CDN
- Fast global delivery

### Cost Optimization
- Consider implementing cleanup for old generations
- Add RLS policies to prevent unauthorized access
- Monitor storage usage

## Next Steps

1. ✅ Test with actual OpenRouter API calls
2. ✅ Verify images upload correctly
3. ✅ Confirm frontend receives public URLs
4. ⏳ Add storage cleanup for old images
5. ⏳ Implement image compression if needed
