ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS owner_designation text,
  ADD COLUMN IF NOT EXISTS owner_verified boolean NOT NULL DEFAULT false;