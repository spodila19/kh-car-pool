-- Run in Supabase SQL Editor
-- Adds boarded_at for "Mark as boarded" feature

ALTER TABLE public.ride_requests
  ADD COLUMN IF NOT EXISTS boarded_at timestamptz;
