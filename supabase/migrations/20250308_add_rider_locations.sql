-- Run in Supabase SQL Editor
-- Adds rider_locations so riders can share their location with the host

CREATE TABLE IF NOT EXISTS public.rider_locations (
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ride_id, user_id)
);

ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rider locations read driver" ON public.rider_locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_id AND r.driver_id = auth.uid())
);

CREATE POLICY "Rider locations upsert own" ON public.rider_locations FOR ALL USING (
  auth.uid() = user_id
) WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_locations;
