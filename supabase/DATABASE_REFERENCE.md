# 📚 Database Schema Reference

Quick reference for PixPaw AI database structure.

---

## 📋 Tables Overview

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `profiles` | User data & credits | Auto-created on signup, 2 free credits |
| `generations` | AI generation history | Tracks status, links to Replicate |
| `gallery_images` | Public showcase | Curated images, publicly viewable |

---

## 🗂️ Table: `profiles`

```typescript
interface Profile {
  id: string              // UUID, references auth.users
  email: string
  full_name?: string
  avatar_url?: string
  credits: number         // Default: 2
  tier: 'free' | 'starter' | 'pro'
  total_generations: number
  created_at: Date
  updated_at: Date
}
```

### Usage in Next.js

```typescript
// Get current user's profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()

// Update credits (use the function instead)
const { data: newCredits } = await supabase
  .rpc('decrement_credits', { user_uuid: userId })
```

---

## 🎨 Table: `generations`

```typescript
interface Generation {
  id: string
  user_id: string
  status: 'processing' | 'succeeded' | 'failed'
  input_url: string       // User's uploaded photo
  output_url?: string     // AI result
  prompt: string
  style: string
  error_message?: string
  replicate_id?: string   // For tracking Replicate API
  webhook_status?: string
  created_at: Date
  completed_at?: Date
}
```

### Usage in Next.js

```typescript
// Create a new generation
const { data: generation } = await supabase
  .from('generations')
  .insert({
    user_id: userId,
    status: 'processing',
    input_url: uploadedImageUrl,
    prompt: 'A cute dog in 3D Pixar style',
    style: '3D Movie',
    replicate_id: replicateResponse.id
  })
  .select()
  .single()

// Get user's generation history
const { data: history } = await supabase
  .from('generations')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20)

// Update generation status (from webhook)
await supabase
  .from('generations')
  .update({
    status: 'succeeded',
    output_url: resultUrl,
    completed_at: new Date().toISOString()
  })
  .eq('replicate_id', replicateId)
```

---

## 🖼️ Table: `gallery_images`

```typescript
interface GalleryImage {
  id: string
  image_url: string
  prompt_template: string // e.g., "A {species} in 3D style"
  style_category: string  // e.g., "3D Movie", "Royal"
  species: 'dog' | 'cat' | 'rabbit' | 'bird' | 'reptile' | 'small_pet' | 'farm' | 'other'
  tags: string[]          // e.g., ['Pixar', '3D', 'Cute']
  author_id?: string      // User who created it (nullable)
  is_featured: boolean
  view_count: number
  like_count: number
  created_at: Date
}
```

### Usage in Next.js

```typescript
// Get all gallery images (public)
const { data: images } = await supabase
  .from('gallery_images')
  .select('*')
  .order('created_at', { ascending: false })

// Filter by species
const { data: dogs } = await supabase
  .from('gallery_images')
  .select('*')
  .eq('species', 'dog')

// Search by tags
const { data: pixarImages } = await supabase
  .from('gallery_images')
  .select('*')
  .contains('tags', ['Pixar'])

// Add to gallery (admin only, use service role)
// This should be done server-side with service_role key
const { data: newImage } = await supabase
  .from('gallery_images')
  .insert({
    image_url: 'https://...',
    prompt_template: 'A {species} in 3D Pixar style',
    style_category: '3D Movie',
    species: 'dog',
    tags: ['Pixar', '3D', 'Animated'],
    is_featured: true
  })
```

---

## 🔐 RLS Policies Summary

### `profiles`
- ✅ Users can **view** their own profile
- ✅ Users can **update** their own profile
- ❌ Users cannot view other profiles
- ✅ Service role has full access

### `generations`
- ✅ Users can **view** their own generations
- ✅ Users can **insert** new generations
- ✅ Users can **update** their own generations
- ❌ Users cannot view other users' generations
- ✅ Service role has full access (for webhooks)

### `gallery_images`
- ✅ **Anyone** can view (public)
- ❌ Only **service role** can insert/update/delete
- This ensures gallery is curated

---

## 📦 Storage Buckets

### `user-uploads` (Private)

**Purpose**: User-uploaded photos (input images)

**RLS Policies**:
- Users can upload to their own folder: `{userId}/filename.jpg`
- Users can view/delete only their own files
- Files are private by default

**Usage**:
```typescript
// Upload
const { data, error } = await supabase.storage
  .from('user-uploads')
  .upload(`${userId}/${filename}`, file, {
    cacheControl: '3600',
    upsert: false
  })

// Get signed URL (private)
const { data: signedUrl } = await supabase.storage
  .from('user-uploads')
  .createSignedUrl(`${userId}/${filename}`, 3600) // 1 hour
```

### `generated-results` (Public)

**Purpose**: AI-generated results

**RLS Policies**:
- Anyone can **view** (public read)
- Only **service role** can insert/delete
- Use this for public sharing

**Usage**:
```typescript
// Get public URL
const { data: publicUrl } = supabase.storage
  .from('generated-results')
  .getPublicUrl(filename)

// Upload (server-side only, use service role)
const { data, error } = await supabaseAdmin.storage
  .from('generated-results')
  .upload(filename, buffer)
```

---

## ⚡ Helper Functions

### `decrement_credits(user_uuid UUID)`

**Purpose**: Safely decrement user credits (atomic operation)

**Returns**: New credit count

**Usage**:
```typescript
const { data: newCredits, error } = await supabase
  .rpc('decrement_credits', { user_uuid: userId })

if (error) {
  // User has insufficient credits or doesn't exist
  throw new Error('Insufficient credits')
}
```

### `increment_generation_count()`

**Purpose**: Auto-increment `total_generations` when status = 'succeeded'

**Trigger**: Runs automatically on INSERT/UPDATE to `generations`

**No manual action needed**

---

## 🔄 Automatic Triggers

### 1. Auto-Create Profile on Signup

**Trigger**: `on_auth_user_created`

**What it does**: When a new user signs up via Supabase Auth, automatically creates a row in `public.profiles` with:
- `id` = user's auth ID
- `email` = user's email
- `credits` = 2 (free trial)
- `tier` = 'free'

**No manual action needed**

### 2. Update `updated_at` on Profile Changes

**Trigger**: `on_profile_updated`

**What it does**: Automatically sets `updated_at = NOW()` whenever a profile is updated

**No manual action needed**

### 3. Increment Generation Count

**Trigger**: `on_generation_succeeded`

**What it does**: Increments `total_generations` in profiles table when a generation succeeds

**No manual action needed**

---

## 📊 Useful Views

### `user_stats`

**Purpose**: Aggregated statistics for admin dashboard

```sql
SELECT * FROM public.user_stats
WHERE email = 'user@example.com';
```

**Returns**:
- `successful_generations`
- `failed_generations`
- `pending_generations`
- `last_generation_at`

---

## 🧪 Sample Queries

### Get user's credit balance
```typescript
const { data } = await supabase
  .from('profiles')
  .select('credits')
  .eq('id', userId)
  .single()
```

### Check if user has credits
```typescript
const { data } = await supabase
  .from('profiles')
  .select('credits')
  .eq('id', userId)
  .gte('credits', 1)
  .single()

if (!data) {
  // Insufficient credits
}
```

### Get generation by Replicate ID (webhook)
```typescript
const { data } = await supabase
  .from('generations')
  .select('*')
  .eq('replicate_id', replicateId)
  .single()
```

### Get pending generations
```typescript
const { data } = await supabase
  .from('generations')
  .select('*')
  .eq('status', 'processing')
  .order('created_at', { ascending: true })
```

---

## 🚨 Common Patterns

### Before AI Generation (check credits)
```typescript
// 1. Check credits
const { data: profile } = await supabase
  .from('profiles')
  .select('credits')
  .eq('id', userId)
  .single()

if (!profile || profile.credits < 1) {
  throw new Error('Insufficient credits')
}

// 2. Decrement credits
const { data: newCredits } = await supabase
  .rpc('decrement_credits', { user_uuid: userId })

// 3. Create generation record
const { data: generation } = await supabase
  .from('generations')
  .insert({
    user_id: userId,
    status: 'processing',
    input_url: uploadedUrl,
    prompt: prompt,
    style: style,
    replicate_id: replicateId
  })
  .select()
  .single()
```

### On Replicate Webhook (update status)
```typescript
// 1. Find generation by Replicate ID
const { data: generation } = await supabase
  .from('generations')
  .select('*')
  .eq('replicate_id', replicateId)
  .single()

// 2. Update status
await supabase
  .from('generations')
  .update({
    status: webhookData.status === 'succeeded' ? 'succeeded' : 'failed',
    output_url: webhookData.output?.[0],
    error_message: webhookData.error,
    completed_at: new Date().toISOString()
  })
  .eq('id', generation.id)

// Note: total_generations will auto-increment via trigger
```

---

## 🔑 Environment Variables Needed

Make sure these are in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service role, server-side only)
```

---

## 📝 TypeScript Types

Create `types/database.ts`:

```typescript
export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  credits: number
  tier: 'free' | 'starter' | 'pro'
  total_generations: number
  created_at: string
  updated_at: string
}

export type Generation = {
  id: string
  user_id: string
  status: 'processing' | 'succeeded' | 'failed'
  input_url: string
  output_url: string | null
  prompt: string
  style: string
  error_message: string | null
  replicate_id: string | null
  webhook_status: string | null
  created_at: string
  completed_at: string | null
}

export type GalleryImage = {
  id: string
  image_url: string
  prompt_template: string
  style_category: string
  species: 'dog' | 'cat' | 'rabbit' | 'bird' | 'reptile' | 'small_pet' | 'farm' | 'other'
  tags: string[]
  author_id: string | null
  is_featured: boolean
  view_count: number
  like_count: number
  created_at: string
}
```

---

**Quick Reference Complete! 📚**
