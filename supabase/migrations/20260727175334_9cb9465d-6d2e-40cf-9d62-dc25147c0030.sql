
-- =========================
-- ENUMS
-- =========================
DO $$ BEGIN
  CREATE TYPE public.business_status AS ENUM ('pending','approved','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.business_day AS ENUM ('mon','tue','wed','thu','fri','sat','sun');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================
-- business_categories
-- =========================
CREATE TABLE IF NOT EXISTS public.business_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_bn text NOT NULL,
  slug text NOT NULL UNIQUE,
  group_bn text NOT NULL,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_categories TO anon, authenticated;
GRANT ALL ON public.business_categories TO service_role;
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cats_public_read" ON public.business_categories FOR SELECT USING (is_active = true);
CREATE POLICY "cats_admin_all" ON public.business_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_business_categories_uat BEFORE UPDATE ON public.business_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- businesses
-- =========================
CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE,
  category_id uuid REFERENCES public.business_categories(id) ON DELETE SET NULL,
  short_description text,
  full_description text,
  address text,
  union_name text,
  area text,
  upazila text NOT NULL DEFAULT 'Ukhiya',
  district text NOT NULL DEFAULT 'Cox''s Bazar',
  lat double precision,
  lng double precision,
  phone text NOT NULL,
  whatsapp text,
  facebook_url text,
  website_url text,
  email text,
  logo_url text,
  cover_url text,
  owner_photo_url text,
  established_year integer,
  products text[] NOT NULL DEFAULT '{}',
  status public.business_status NOT NULL DEFAULT 'pending',
  is_verified boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_sponsored boolean NOT NULL DEFAULT false,
  sponsor_until timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  avg_rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT SELECT ON public.businesses TO anon;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "biz_public_read_approved" ON public.businesses FOR SELECT
  USING (status = 'approved');
CREATE POLICY "biz_owner_read" ON public.businesses FOR SELECT TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "biz_admin_read" ON public.businesses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "biz_owner_insert" ON public.businesses FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "biz_owner_update" ON public.businesses FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND status <> 'suspended');
CREATE POLICY "biz_admin_all" ON public.businesses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS businesses_status_idx ON public.businesses(status);
CREATE INDEX IF NOT EXISTS businesses_category_idx ON public.businesses(category_id);
CREATE INDEX IF NOT EXISTS businesses_owner_idx ON public.businesses(owner_id);

CREATE TRIGGER trg_businesses_uat BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Slug generation
CREATE OR REPLACE FUNCTION public.generate_business_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base text;
  candidate text;
  suffix text;
  i int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  base := lower(regexp_replace(coalesce(NEW.name,''), '[^a-zA-Z0-9\s-]', '', 'g'));
  base := regexp_replace(trim(base), '\s+', '-', 'g');
  IF base = '' THEN base := 'business'; END IF;
  suffix := substr(replace(NEW.id::text,'-',''), 1, 6);
  candidate := base || '-' || suffix;
  WHILE EXISTS (SELECT 1 FROM public.businesses WHERE slug = candidate) AND i < 5 LOOP
    i := i + 1;
    candidate := base || '-' || suffix || '-' || i::text;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_businesses_slug BEFORE INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.generate_business_slug();

-- =========================
-- business_hours
-- =========================
CREATE TABLE IF NOT EXISTS public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  day public.business_day NOT NULL,
  is_closed boolean NOT NULL DEFAULT false,
  open_time time,
  close_time time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_hours TO authenticated;
GRANT SELECT ON public.business_hours TO anon;
GRANT ALL ON public.business_hours TO service_role;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hours_public_read" ON public.business_hours FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'approved'));
CREATE POLICY "hours_owner_manage" ON public.business_hours FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "hours_admin_all" ON public.business_hours FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_business_hours_uat BEFORE UPDATE ON public.business_hours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- business_gallery
-- =========================
CREATE TABLE IF NOT EXISTS public.business_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_gallery TO authenticated;
GRANT SELECT ON public.business_gallery TO anon;
GRANT ALL ON public.business_gallery TO service_role;
ALTER TABLE public.business_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_public_read" ON public.business_gallery FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'approved'));
CREATE POLICY "gallery_owner_manage" ON public.business_gallery FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "gallery_admin_all" ON public.business_gallery FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS gallery_business_idx ON public.business_gallery(business_id);

-- =========================
-- business_reviews
-- =========================
CREATE TABLE IF NOT EXISTS public.business_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_reviews TO authenticated;
GRANT SELECT ON public.business_reviews TO anon;
GRANT ALL ON public.business_reviews TO service_role;
ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rev_public_read" ON public.business_reviews FOR SELECT
  USING (is_hidden = false AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'approved'));
CREATE POLICY "rev_owner_read_own" ON public.business_reviews FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "rev_insert_own" ON public.business_reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "rev_update_own" ON public.business_reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "rev_delete_own" ON public.business_reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "rev_admin_all" ON public.business_reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS rev_business_idx ON public.business_reviews(business_id);

CREATE TRIGGER trg_business_reviews_uat BEFORE UPDATE ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Rating aggregation
CREATE OR REPLACE FUNCTION public.recompute_business_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target uuid;
BEGIN
  target := COALESCE(NEW.business_id, OLD.business_id);
  UPDATE public.businesses b
    SET avg_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.business_reviews WHERE business_id = target AND is_hidden = false), 0),
        review_count = (SELECT COUNT(*) FROM public.business_reviews WHERE business_id = target AND is_hidden = false)
    WHERE b.id = target;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_rev_agg AFTER INSERT OR UPDATE OR DELETE ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_business_rating();

-- =========================
-- Category seed
-- =========================
INSERT INTO public.business_categories (name_bn, slug, group_bn, icon, sort_order) VALUES
  -- Retail
  ('মুদি দোকান','grocery','খুচরা','🛒',10),
  ('পোশাকের দোকান','clothing','খুচরা','👕',11),
  ('কসমেটিক্স','cosmetics','খুচরা','💄',12),
  ('মোবাইল শপ','mobile-shop','খুচরা','📱',13),
  ('ইলেকট্রনিক্স','electronics','খুচরা','🔌',14),
  ('বই ঘর','book-store','খুচরা','📚',15),
  ('ফার্নিচার','furniture','খুচরা','🛋️',16),
  ('হার্ডওয়্যার','hardware','খুচরা','🔧',17),
  -- Food
  ('রেস্টুরেন্ট','restaurant','খাবার ও ডাইনিং','🍽️',20),
  ('ফাস্ট ফুড','fast-food','খাবার ও ডাইনিং','🍔',21),
  ('বেকারি','bakery','খাবার ও ডাইনিং','🥖',22),
  ('ক্যাফে','cafe','খাবার ও ডাইনিং','☕',23),
  ('মিষ্টির দোকান','sweet-shop','খাবার ও ডাইনিং','🍬',24),
  -- Health
  ('ফার্মেসি','pharmacy','স্বাস্থ্য','💊',30),
  ('ক্লিনিক','clinic','স্বাস্থ্য','🏥',31),
  ('ডায়াগনস্টিক সেন্টার','diagnostic-center','স্বাস্থ্য','🔬',32),
  ('ডেন্টাল ক্লিনিক','dental-clinic','স্বাস্থ্য','🦷',33),
  ('অপটিক্যাল শপ','optical-shop','স্বাস্থ্য','👓',34),
  -- Financial
  ('বিকাশ এজেন্ট','bkash-agent','আর্থিক সেবা','💳',40),
  ('নগদ এজেন্ট','nagad-agent','আর্থিক সেবা','💳',41),
  ('রকেট এজেন্ট','rocket-agent','আর্থিক সেবা','💳',42),
  ('ব্যাংক','bank','আর্থিক সেবা','🏦',43),
  ('এনজিও','ngo','আর্থিক সেবা','🤝',44),
  -- Hospitality
  ('হোটেল','hotel','হসপিটালিটি','🏨',50),
  ('গেস্ট হাউস','guest-house','হসপিটালিটি','🛏️',51),
  ('রিসোর্ট','resort','হসপিটালিটি','🌴',52),
  -- Online
  ('ফেসবুক শপ','facebook-shop','অনলাইন ব্যবসা','📘',60),
  ('হোম বিজনেস','home-business','অনলাইন ব্যবসা','🏠',61),
  ('ই-কমার্স সেলার','ecommerce-seller','অনলাইন ব্যবসা','🛒',62),
  ('ডিজিটাল প্রোডাক্ট','digital-products','অনলাইন ব্যবসা','💾',63),
  -- Agriculture
  ('কৃষি দোকান','agriculture-shop','কৃষি','🌾',70),
  ('নার্সারি','nursery','কৃষি','🌱',71),
  ('মৎস্য খামার','fish-farm','কৃষি','🐟',72),
  ('বীজ ও সার','seeds-fertilizer','কৃষি','🌰',73),
  ('পশু খাদ্য','animal-feed','কৃষি','🐄',74)
ON CONFLICT (slug) DO NOTHING;
