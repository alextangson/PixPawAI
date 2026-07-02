-- Allow guest (not-signed-in) generations: user_id becomes nullable.
-- Guest rows have user_id = NULL; the guest IP lives in metadata->>'guestIp'
-- and metadata->>'isGuest' = 'true'. Guest inserts/updates go through the
-- service-role client (RLS insert policy requires auth.uid() = user_id,
-- which guests can never satisfy).

ALTER TABLE public.generations
  ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN public.generations.user_id IS
  'Owner profile id. NULL for guest generations (see metadata.guestIp).';
