/**
 * Supabase Cron Job Setup for Guest Uploads Cleanup
 * 
 * ⚠️ TODO: DO NOT RUN THIS YET (Phase 3 Feature)
 * 
 * Status: Deferred to growth stage
 * Reason: MVP costs too low to justify automation
 * Run when: Daily uploads > 100 OR monthly cost > $1
 * 
 * ---
 * 
 * This SQL script sets up a daily cron job to automatically delete
 * guest-uploaded files older than 24 hours from the guest-uploads bucket.
 * 
 * Prerequisites:
 * 1. Edge Function 'cleanup-guest-uploads' must be deployed
 * 2. Replace YOUR_PROJECT_REF with your Supabase project reference
 * 3. Replace YOUR_ANON_KEY with your anon/public API key
 * 
 * Run this in: Supabase Dashboard → SQL Editor
 */

-- Enable pg_cron extension (required for scheduling)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing schedule if it exists (for redeployment)
DO $$ 
BEGIN
  PERFORM cron.unschedule('cleanup-guest-uploads-daily');
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Schedule daily cleanup at 2:00 AM UTC
SELECT cron.schedule(
  'cleanup-guest-uploads-daily',           -- Job name
  '0 2 * * *',                             -- Cron expression: Daily at 2:00 AM
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

-- Verify the cron job was created successfully
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job 
WHERE jobname = 'cleanup-guest-uploads-daily';

-- Query to check recent executions (after first run)
-- SELECT 
--   jobid,
--   runid,
--   status,
--   start_time,
--   end_time,
--   return_message
-- FROM cron.job_run_details 
-- WHERE jobid = (
--   SELECT jobid FROM cron.job 
--   WHERE jobname = 'cleanup-guest-uploads-daily'
-- )
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- To manually unschedule (if needed):
-- SELECT cron.unschedule('cleanup-guest-uploads-daily');

-- To manually trigger the function for testing:
-- SELECT net.http_post(
--   url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-guest-uploads',
--   headers := jsonb_build_object(
--     'Authorization', 'Bearer YOUR_ANON_KEY',
--     'Content-Type', 'application/json'
--   )
-- );
