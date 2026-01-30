-- Security Advisor fix: enable RLS on merch_waitlist
-- See Supabase Security Advisor: table was exposed via PostgREST without RLS

ALTER TABLE public.merch_waitlist ENABLE ROW LEVEL SECURITY;

-- Only service_role can insert (used by POST /api/merch-waitlist)
CREATE POLICY "Service role can insert merch waitlist"
  ON public.merch_waitlist
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service_role to select (for admin/scripts)
CREATE POLICY "Service role can select merch waitlist"
  ON public.merch_waitlist
  FOR SELECT
  TO service_role
  USING (true);
