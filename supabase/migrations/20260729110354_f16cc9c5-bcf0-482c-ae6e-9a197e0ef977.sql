ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS plus_code text,
  ADD COLUMN IF NOT EXISTS location_confirmed boolean NOT NULL DEFAULT false;