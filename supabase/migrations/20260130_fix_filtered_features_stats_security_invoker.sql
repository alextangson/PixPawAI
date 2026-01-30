-- Security Advisor fix: use SECURITY INVOKER so the view respects RLS
-- See Supabase Security Advisor: filtered_features_stats was running as DEFINER

ALTER VIEW public.filtered_features_stats SET (security_invoker = on);
