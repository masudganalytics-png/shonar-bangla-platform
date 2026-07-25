
DO $$ BEGIN
  CREATE TYPE public.announcement_category AS ENUM ('notice','outage','tariff','general');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS category public.announcement_category NOT NULL DEFAULT 'notice',
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

CREATE INDEX IF NOT EXISTS announcements_category_idx ON public.announcements (category);
CREATE INDEX IF NOT EXISTS announcements_published_idx ON public.announcements (is_published, published_at DESC);
