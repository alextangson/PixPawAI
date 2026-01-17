# Cleanup Guest Uploads Edge Function

> ⚠️ **TODO: NOT YET DEPLOYED (Phase 3 Feature)**
> 
> **Status**: Code complete, deployment deferred
> 
> **Reason**: MVP stage storage costs are minimal (~$0.01-0.03/month)
> 
> **Deploy when**: 
> - Daily guest uploads exceed 100
> - Monthly storage costs exceed $1
> - Or after 3 months if forgotten to manually clean
> 
> **Manual cleanup**: See SQL query at bottom of this README

---

## 📋 Purpose

Automatically delete guest-uploaded files from the `guest-uploads` bucket that are older than 24 hours. This prevents storage costs from accumulating due to temporary files.

## 🚀 Deployment

### 1. Deploy Edge Function

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy cleanup-guest-uploads
```

### 2. Set Environment Variables

Go to Supabase Dashboard → Edge Functions → `cleanup-guest-uploads` → Settings:

- `SUPABASE_URL`: Your project URL (auto-populated)
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (from Settings → API)

### 3. Configure Cron Job

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 2:00 AM UTC
SELECT cron.schedule(
  'cleanup-guest-uploads-daily',
  '0 2 * * *',  -- Every day at 2:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-guest-uploads',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'Content-Type', 'application/json'
    )
  ) AS request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'cleanup-guest-uploads-daily';
```

**Replace**:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_ANON_KEY` with your anon/public key (from Settings → API)

## 🧪 Manual Testing

### Test via cURL

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-guest-uploads' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Test via Supabase Dashboard

1. Go to Edge Functions → `cleanup-guest-uploads`
2. Click "Invoke Function"
3. Check logs for results

### Expected Response

```json
{
  "success": true,
  "message": "Cleanup completed: 15 files deleted",
  "result": {
    "totalFiles": 42,
    "expiredFiles": 15,
    "deletedFiles": 15,
    "errors": [],
    "deletedPaths": [
      "guest-1768639511355/file1.jpg",
      "guest-1768639511355/file2.png"
    ]
  },
  "timestamp": "2026-01-17T10:30:00.000Z"
}
```

## 📊 Monitoring

### View Cron Job Logs

```sql
-- Check recent executions
SELECT * FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'cleanup-guest-uploads-daily'
)
ORDER BY start_time DESC 
LIMIT 10;
```

### View Edge Function Logs

1. Go to Supabase Dashboard
2. Navigate to Edge Functions → `cleanup-guest-uploads`
3. Click "Logs" tab

## 🔧 Configuration

### Change Retention Period

Edit `index.ts`:

```typescript
const RETENTION_HOURS = 24 // Change to 12, 48, etc.
```

### Change Cron Schedule

Common schedules:
- Every hour: `'0 * * * *'`
- Every 6 hours: `'0 */6 * * *'`
- Daily at midnight: `'0 0 * * *'`
- Weekly on Sunday: `'0 2 * * 0'`

Update the cron schedule:

```sql
-- Delete old schedule
SELECT cron.unschedule('cleanup-guest-uploads-daily');

-- Create new schedule
SELECT cron.schedule(
  'cleanup-guest-uploads-hourly',
  '0 * * * *',  -- New schedule
  $$ ... $$
);
```

## 🐛 Troubleshooting

### Function not executing

1. Check if cron job exists:
   ```sql
   SELECT * FROM cron.job WHERE jobname LIKE 'cleanup-guest%';
   ```

2. Check execution history:
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
   ```

3. Verify environment variables in Dashboard

### Files not being deleted

1. Check file timestamps:
   ```sql
   SELECT name, created_at 
   FROM storage.objects 
   WHERE bucket_id = 'guest-uploads'
   ORDER BY created_at DESC;
   ```

2. Check bucket permissions (RLS policies)

3. Verify service role key has storage access

## 💰 Cost Impact

**Before cleanup**: ~$0.021/GB/month × accumulated files
**After cleanup**: ~$0.021/GB/month × current 24h files only

**Example savings**:
- 1,000 guest uploads/day × 2MB = 2GB/day
- Without cleanup: 60GB/month = **~$1.26/month**
- With cleanup: 2GB constant = **~$0.04/month**
- **Savings: ~$1.22/month** (97% reduction)

## 🔐 Security

- Function uses service role key (full access)
- Only accessible via authenticated requests
- Cron job runs server-side
- No sensitive data exposed in logs

---

## 🖐️ Manual Cleanup (MVP Alternative)

If not deploying automated cleanup yet, run this SQL periodically in Supabase SQL Editor:

```sql
-- Delete guest uploads older than 7 days
DELETE FROM storage.objects 
WHERE bucket_id = 'guest-uploads' 
AND created_at < NOW() - INTERVAL '7 days';

-- Check how much will be deleted (dry run)
SELECT 
  COUNT(*) as file_count,
  pg_size_pretty(SUM(octet_length(metadata))) as estimated_size
FROM storage.objects 
WHERE bucket_id = 'guest-uploads' 
AND created_at < NOW() - INTERVAL '7 days';
```

**Recommended frequency**: Weekly or monthly during MVP stage
