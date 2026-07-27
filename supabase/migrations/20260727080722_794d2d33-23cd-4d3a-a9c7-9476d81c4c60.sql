-- Teacher Directory module tables

-- Categories
CREATE TABLE public.teacher_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_bn text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teacher_categories TO anon, authenticated;
GRANT ALL ON public.teacher_categories TO service_role;
ALTER TABLE public.teacher_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY teacher_categories_public_read ON public.teacher_categories FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY teacher_categories_admin_all ON public.teacher_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_teacher_categories_updated BEFORE UPDATE ON public.teacher_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Teacher status enum
CREATE TYPE teacher_status AS ENUM ('pending', 'approved', 'rejected', 'inactive');

-- Teachers
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  email text,
  category_id uuid REFERENCES public.teacher_categories(id) ON DELETE SET NULL,
  subjects text,
  qualification text,
  experience_years integer DEFAULT 0,
  district text NOT NULL DEFAULT 'Cox''s Bazar',
  upazila text NOT NULL DEFAULT 'Ukhiya',
  area text,
  photo_url text,
  description text,
  is_available boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  status teacher_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.teachers TO anon, authenticated;
GRANT UPDATE, DELETE ON public.teachers TO authenticated;
GRANT ALL ON public.teachers TO service_role;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY teachers_public_read_approved ON public.teachers FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY teachers_owner_read ON public.teachers FOR SELECT TO authenticated USING (auth.uid() = submitted_by);
CREATE POLICY teachers_admin_read ON public.teachers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY teachers_public_insert ON public.teachers FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
CREATE POLICY teachers_admin_update ON public.teachers FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY teachers_admin_delete ON public.teachers FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_teachers_updated BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_teachers_status ON public.teachers(status);
CREATE INDEX idx_teachers_category ON public.teachers(category_id);
CREATE INDEX idx_teachers_area ON public.teachers(upazila, area);

-- Gallery
CREATE TABLE public.teacher_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.teacher_gallery TO anon, authenticated;
GRANT ALL ON public.teacher_gallery TO service_role;
ALTER TABLE public.teacher_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY teacher_gallery_public_read ON public.teacher_gallery FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.status = 'approved'));
CREATE POLICY teacher_gallery_admin_all ON public.teacher_gallery FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY teacher_gallery_public_insert ON public.teacher_gallery FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Storage policies for teacher-images bucket
CREATE POLICY teacher_images_public_read ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'teacher-images');
CREATE POLICY teacher_images_public_insert ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'teacher-images');
CREATE POLICY teacher_images_admin_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'teacher-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Seed initial categories
INSERT INTO public.teacher_categories (name_bn, slug, sort_order) VALUES
  ('বাংলা', 'bangla', 1),
  ('ইংরেজি', 'english', 2),
  ('গণিত', 'math', 3),
  ('পদার্থবিজ্ঞান', 'physics', 4),
  ('রসায়ন', 'chemistry', 5),
  ('জীববিজ্ঞান', 'biology', 6),
  ('সাধারণ বিজ্ঞান', 'general-science', 7),
  ('আইসিটি', 'ict', 8),
  ('আরবি', 'arabic', 9),
  ('কুরআন তাজবিদ', 'quran', 10),
  ('সমাজসেবা / এনজিও', 'social-work', 11),
  ('ব্যাংক জব প্রিপারেশন', 'bank-jobs', 12),
  ('বিসিএস প্রিপারেশন', 'bcs', 13),
  ('ইংরেজি স্পিকিং', 'english-speaking', 14),
  ('আবৃত্তি ও সংগীত', 'recitation-music', 15),
  ('চিত্রাংকন', 'drawing', 16),
  ('অন্যান্য', 'other', 99);
