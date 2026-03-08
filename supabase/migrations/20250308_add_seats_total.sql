-- Run this in Supabase SQL Editor for existing projects
-- Adds seats_total for "X of Y seats" display

ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS seats_total int;

-- Backfill: seats_total = seats_available + approved count
UPDATE public.rides r
SET seats_total = r.seats_available + COALESCE((
  SELECT COUNT(*)::int FROM public.ride_requests rr 
  WHERE rr.ride_id = r.id AND rr.status = 'approved'
), 0)
WHERE r.seats_total IS NULL;

-- Set default for new rows and ensure not null
ALTER TABLE public.rides ALTER COLUMN seats_total SET DEFAULT 3;
ALTER TABLE public.rides ALTER COLUMN seats_total SET NOT NULL;

-- Allow seats_available to be 0 when all seats are filled
ALTER TABLE public.rides DROP CONSTRAINT IF EXISTS rides_seats_available_check;
ALTER TABLE public.rides ADD CONSTRAINT rides_seats_available_check CHECK (seats_available >= 0);
