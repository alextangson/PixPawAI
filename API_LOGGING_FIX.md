# API Response Logging Fix

## Problem
The terminal crashed because the OpenRouter API responses contained massive Base64 strings that overwhelmed the console output.

## Solution Implemented

### 1. Safe Logging Function
Added a `createSafeLog()` helper that truncates strings longer than 100 characters:

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

### 2. Enhanced Response Parsing
Implemented a **multi-strategy approach** to handle different response formats from OpenRouter:

#### Strategy 1: `choices[0].message.images` (FLUX.2 format)
```typescript
if (data.choices?.[0]?.message?.images) {
  const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url
  return imageUrl
}
```

#### Strategy 2: `data.output` (some models)
```typescript
if (data.output && typeof data.output === 'string') {
  return data.output
}
```

#### Strategy 3: `data.data[0].url` (DALL-E format)
```typescript
if (data.data && Array.isArray(data.data) && data.data[0]?.url) {
  return data.data[0].url
}
```

#### Strategy 4: `message.content` (with Base64/URL parsing)
- Detects Base64 data URLs: `data:image/...`
- Extracts Markdown images: `![alt](url)`
- Extracts plain URLs

#### Strategy 5: `data.url` (top-level)
```typescript
if (data.url && typeof data.url === 'string') {
  return data.url
}
```

### 3. Error Handling
- Checks for errors in JSON response even with 200 status
- Logs response structure for debugging when no image is found
- Provides clear error messages with emoji indicators:
  - 🚀 API call started
  - 📡 Response status
  - ✅ Success paths
  - ❌ Error paths

### 4. Base64 Support
The existing `uploadGeneratedImage()` function in `lib/supabase/storage.ts` already handles Base64 images:

```typescript
if (imageUrl.startsWith('data:')) {
  const response = await fetch(imageUrl)
  blob = await response.blob()
}
```

## Benefits
1. **No more terminal crashes** - Long Base64 strings are truncated
2. **Better debugging** - Safe logs show response structure without overwhelming output
3. **More robust** - Handles multiple API response formats
4. **Clear feedback** - Emoji-based logging makes it easy to trace execution flow

## Testing
Try uploading a pet image and generating art. The console will now show:
- 🚀 Request initiation
- 📡 Response status
- ✅ Which strategy found the image
- Safe, truncated logs instead of multi-megabyte Base64 dumps

## Files Modified
- `app/api/generate/route.ts` - Complete refactor of response parsing
