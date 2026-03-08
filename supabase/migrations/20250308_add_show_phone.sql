-- Run this in Supabase SQL Editor if your project was created before show_phone was added
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT true;
