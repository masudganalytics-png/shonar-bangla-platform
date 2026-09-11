CREATE TABLE public.reuse_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_type text NOT NULL DEFAULT 'sale' CHECK (listing_type IN ('sale','donation')),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  condition text NOT NULL,
  price numeric,
  location text NOT NULL,
  area text,
  phone text,
  whatsapp text,
  image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','sold','donated','hidden')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reuse_listings_public ON public.reuse_listings (status, created_at DESC);
CREATE INDEX idx_reuse_listings_user ON public.reuse_listings (user_id, created_at DESC);

CREATE TABLE public.reuse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.reuse_listings(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Public columns only: phone / whatsapp / admin_note have no anon/authenticated grant.
GRANT SELECT (id, user_id, listing_type, title, description, category, condition, price, location, area, image_url, status, created_at, updated_at)
  ON public.reuse_listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reuse_listings TO authenticated;
GRANT ALL ON public.reuse_listings TO service_role;

GRANT INSERT ON public.reuse_reports TO authenticated;
GRANT ALL ON public.reuse_reports TO service_role;

ALTER TABLE public.reuse_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reuse_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved reuse listings are public"
  ON public.reuse_listings FOR SELECT TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Owners read own reuse listings"
  ON public.reuse_listings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all reuse listings"
  ON public.reuse_listings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own reuse listings"
  ON public.reuse_listings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reuse listings"
  ON public.reuse_listings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own reuse listings"
  ON public.reuse_listings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage reuse listings"
  ON public.reuse_listings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users report reuse listings"
  ON public.reuse_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins manage reuse reports"
  ON public.reuse_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Moderation guard: non-admins can never approve/reject their own listings.
CREATE OR REPLACE FUNCTION public.reuse_listings_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT is_admin THEN
      NEW.status := 'pending';
      NEW.admin_note := NULL;
    END IF;
    IF NEW.listing_type = 'donation' THEN NEW.price := NULL; END IF;
    RETURN NEW;
  END IF;

  IF NOT is_admin THEN
    NEW.user_id := OLD.user_id;
    NEW.admin_note := OLD.admin_note;
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status NOT IN ('sold','donated','hidden','pending') THEN
      NEW.status := OLD.status;
    END IF;
    -- Editing content of an approved listing sends it back for review.
    IF OLD.status = 'approved' AND NEW.status = 'approved' AND (
         NEW.title IS DISTINCT FROM OLD.title OR
         NEW.description IS DISTINCT FROM OLD.description OR
         NEW.category IS DISTINCT FROM OLD.category OR
         NEW.price IS DISTINCT FROM OLD.price OR
         NEW.image_url IS DISTINCT FROM OLD.image_url
       ) THEN
      NEW.status := 'pending';
    END IF;
  END IF;

  IF NEW.listing_type = 'donation' THEN NEW.price := NULL; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reuse_listings_guard
BEFORE INSERT OR UPDATE ON public.reuse_listings
FOR EACH ROW EXECUTE FUNCTION public.reuse_listings_guard();