
-- Worker Directory module tables

-- Categories
CREATE TABLE public.worker_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_bn text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.worker_categories TO anon, authenticated;
GRANT ALL ON public.worker_categories TO service_role;
ALTER TABLE public.worker_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY worker_categories_public_read ON public.worker_categories FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY worker_categories_admin_all ON public.worker_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_worker_categories_updated BEFORE UPDATE ON public.worker_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Worker status enum
CREATE TYPE worker_status AS ENUM ('pending', 'approved', 'rejected', 'inactive');

-- Workers
CREATE TABLE public.workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  category_id uuid REFERENCES public.worker_categories(id) ON DELETE SET NULL,
  skills text,
  experience_years integer DEFAULT 0,
  district text NOT NULL DEFAULT 'Cox''s Bazar',
  upazila text NOT NULL DEFAULT 'Ukhiya',
  area text,
  photo_url text,
  description text,
  is_available boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  status worker_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.workers TO anon, authenticated;
GRANT UPDATE, DELETE ON public.workers TO authenticated;
GRANT ALL ON public.workers TO service_role;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY workers_public_read_approved ON public.workers FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY workers_owner_read ON public.workers FOR SELECT TO authenticated USING (auth.uid() = submitted_by);
CREATE POLICY workers_admin_read ON public.workers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY workers_public_insert ON public.workers FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
CREATE POLICY workers_admin_update ON public.workers FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY workers_admin_delete ON public.workers FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_workers_updated BEFORE UPDATE ON public.workers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_workers_status ON public.workers(status);
CREATE INDEX idx_workers_category ON public.workers(category_id);
CREATE INDEX idx_workers_area ON public.workers(upazila, area);

-- Gallery
CREATE TABLE public.worker_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.worker_gallery TO anon, authenticated;
GRANT ALL ON public.worker_gallery TO service_role;
ALTER TABLE public.worker_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY worker_gallery_public_read ON public.worker_gallery FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.workers w WHERE w.id = worker_id AND w.status = 'approved'));
CREATE POLICY worker_gallery_admin_all ON public.worker_gallery FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY worker_gallery_public_insert ON public.worker_gallery FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Seed initial categories
INSERT INTO public.worker_categories (name_bn, slug, sort_order) VALUES
  ('ইলেকট্রিশিয়ান', 'electrician', 1),
  ('প্লাম্বার', 'plumber', 2),
  ('রাজমিস্ত্রি', 'mason', 3),
  ('রংমিস্ত্রি', 'painter', 4),
  ('কাঠমিস্ত্রি', 'carpenter', 5),
  ('টাইলস মিস্ত্রি', 'tiles', 6),
  ('ওয়েল্ডিং মিস্ত্রি', 'welder', 7),
  ('এসি টেকনিশিয়ান', 'ac-technician', 8),
  ('ফ্রিজ টেকনিশিয়ান', 'fridge-technician', 9),
  ('টিভি মেরামত', 'tv-repair', 10),
  ('মোবাইল মেরামত', 'mobile-repair', 11),
  ('কম্পিউটার টেকনিশিয়ান', 'computer-technician', 12),
  ('গৃহকর্মী', 'housekeeper', 13),
  ('বেবি কেয়ার', 'baby-care', 14),
  ('বৃদ্ধ সেবাদানকারী', 'elderly-care', 15),
  ('ড্রাইভার', 'driver', 16),
  ('মালী', 'gardener', 17),
  ('পরিষ্কার-পরিচ্ছন্নতা কর্মী', 'cleaner', 18),
  ('দর্জি', 'tailor', 19),
  ('অন্যান্য', 'other', 99);
