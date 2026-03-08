-- ============================================================
-- Kanha Car Pool - Run this in Supabase SQL Editor
-- ============================================================
-- For EXISTING projects: run the blocks below (1, 2, 3)
-- For NEW projects: run supabase/schema.sql first, then skip to block 3 if needed
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add show_phone to profiles (for "Show my mobile number" toggle)
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT true;


-- ------------------------------------------------------------
-- 2. Add withdrawn status (for "Withdraw request" feature)
-- ------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT conname FROM pg_constraint WHERE conrelid = 'public.ride_requests'::regclass AND contype = 'c')
  LOOP
    EXECUTE format('ALTER TABLE public.ride_requests DROP CONSTRAINT %I', r.conname);
  END LOOP;
  ALTER TABLE public.ride_requests ADD CONSTRAINT ride_requests_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn'));
END $$;

DROP POLICY IF EXISTS "Requests update own withdraw" ON public.ride_requests;
CREATE POLICY "Requests update own withdraw" ON public.ride_requests 
  FOR UPDATE USING (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 3. Add seats_total (for "X of Y seats remaining" display)
-- ------------------------------------------------------------
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS seats_total int;

UPDATE public.rides r
SET seats_total = r.seats_available + COALESCE((
  SELECT COUNT(*)::int FROM public.ride_requests rr 
  WHERE rr.ride_id = r.id AND rr.status = 'approved'
), 0)
WHERE r.seats_total IS NULL;

ALTER TABLE public.rides ALTER COLUMN seats_total SET DEFAULT 3;
ALTER TABLE public.rides ALTER COLUMN seats_total SET NOT NULL;

ALTER TABLE public.rides DROP CONSTRAINT IF EXISTS rides_seats_available_check;
ALTER TABLE public.rides ADD CONSTRAINT rides_seats_available_check CHECK (seats_available >= 0);
