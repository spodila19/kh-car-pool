-- Run this in Supabase SQL Editor for existing projects
-- Adds 'withdrawn' status and allows requesters to update their own request (for withdraw)

-- Add withdrawn to status check (drop and recreate constraint)
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

-- Allow requester to update their own request (for withdraw)
DROP POLICY IF EXISTS "Requests update own withdraw" ON public.ride_requests;
CREATE POLICY "Requests update own withdraw" ON public.ride_requests 
  FOR UPDATE USING (auth.uid() = user_id);
