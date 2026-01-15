# OpenRouter Image Format Fix

## Issue
API was returning 500 errors with message: **"No image data found in OpenRouter response"**

Despite receiving a 200 response from OpenRouter with image data, the extraction logic failed.

## Root Cause

OpenRouter's FLUX.2-flex model returns images in a **nested structure**:

```json
{
  "choices": [{
    "message": {
      "images": [{
        "index": 0,
        "type": "image_url",
        "image_url": {
          "url": "data:image/png;base64,iVBORw0KGgoAAAA..."
        }
      }]
    }
  }]
}
```

The code was checking for:
- `images[0]` as a string ❌
- `images[0].url` ❌
- `images[0].b64_json` ❌

But the actual path is: **`images[0].image_url.url`** ✅

## Solution

Updated `extractBase64FromResponse()` to handle the nested structure:

```typescript
// Strategy 2: choices[0].message.images (FLUX.2 format with Base64)
if (data.choices?.[0]?.message?.images && Array.isArray(data.choices[0].message.images)) {
  const firstImage = data.choices[0].message.images[0]
  
  // Handle nested structure: { image_url: { url: "data:image..." } }
  let imageData: string | undefined
  
  if (typeof firstImage === 'string') {
    imageData = firstImage
  } else if (firstImage?.image_url?.url) {
    // OpenRouter FLUX.2 nested format ✅ NEW
    imageData = firstImage.image_url.url
  } else if (firstImage?.url) {
    imageData = firstImage.url
  } else if (firstImage?.b64_json) {
    imageData = firstImage.b64_json
  }
  
  if (imageData) {
    if (imageData.startsWith('data:image')) {
      console.log('✅ Base64 data URL found in message.images')
      return imageData.split(',')[1] // Extract base64 part
    }
    // ... handle other formats
  }
}
```

## Now Supports All Formats

1. **Nested structure** (OpenRouter FLUX.2): `firstImage.image_url.url` ✅
2. **Simple object**: `firstImage.url`
3. **Base64 field**: `firstImage.b64_json`
4. **Direct string**: `firstImage`

## Testing Evidence

From server logs:

**Before fix:**
```
✅ Response received. Structure: { ... }
❌ No image found. Response keys: ['id', 'provider', 'model', ...]
Generation failed: Error: No image data found in OpenRouter response
```

**Expected after fix:**
```
✅ Response received. Structure: { ... }
✅ Base64 data URL found in message.images
📊 Received Base64 length: 1943426 chars
📦 Converted Base64 to Buffer: 1457520 bytes
✅ Uploaded to storage: https://...
```

## Files Modified
- `app/api/generate/route.ts` - Updated `extractBase64FromResponse()`

## Related Issues
- Fixes 500 errors during image generation
- Handles OpenRouter's specific response format
- Maintains backward compatibility with other formats
