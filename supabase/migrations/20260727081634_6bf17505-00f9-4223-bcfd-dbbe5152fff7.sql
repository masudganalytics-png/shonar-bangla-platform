
-- Enums
DO $$ BEGIN CREATE TYPE public.tutor_gender AS ENUM ('male','female','any'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tuition_status AS ENUM ('pending','approved','rejected','matched','filled','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tuition_app_status AS ENUM ('pending','accepted','rejected','withdrawn'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tuition_mode AS ENUM ('online','offline','both'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.resource_type AS ENUM ('website','gdrive','youtube','pdf','link'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend teachers
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS gender public.tutor_gender,
  ADD COLUMN IF NOT EXISTS student_class text,
  ADD COLUMN IF NOT EXISTS bio text;

-- ================= TUITION REQUESTS =================
CREATE TABLE IF NOT EXISTS public.tuition_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid,
  parent_name text NOT NULL,
  phone text NOT NULL,
  district text NOT NULL DEFAULT 'Cox''s Bazar',
  upazila text NOT NULL DEFAULT 'Ukhiya',
  area text,
  student_class text NOT NULL,
  subject text NOT NULL,
  preferred_gender public.tutor_gender NOT NULL DEFAULT 'any',
  budget numeric,
  days_per_week integer,
  preferred_time text,
  mode public.tuition_mode NOT NULL DEFAULT 'offline',
  notes text,
  status public.tuition_status NOT NULL DEFAULT 'pending',
  matched_tutor_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tuition_requests TO authenticated;
GRANT SELECT, INSERT ON public.tuition_requests TO anon;
GRANT ALL ON public.tuition_requests TO service_role;
ALTER TABLE public.tuition_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY tr_public_insert ON public.tuition_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');
CREATE POLICY tr_admin_all ON public.tuition_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY tr_owner_read ON public.tuition_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = submitted_by);

-- Public safe view (no phone / parent_name)
CREATE OR REPLACE VIEW public.public_tuition_requests
WITH (security_invoker = true) AS
SELECT id, district, upazila, area, student_class, subject, preferred_gender,
       budget, days_per_week, preferred_time, mode, notes, status, created_at
FROM public.tuition_requests
WHERE status IN ('approved','matched');
GRANT SELECT ON public.public_tuition_requests TO anon, authenticated;
-- underlying SELECT policy for anon on approved rows (needed by view via security_invoker)
CREATE POLICY tr_public_read_approved ON public.tuition_requests
  FOR SELECT TO anon, authenticated
  USING (status IN ('approved','matched'));

CREATE TRIGGER tuition_requests_set_updated_at BEFORE UPDATE ON public.tuition_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================= TUITION APPLICATIONS =================
CREATE TABLE IF NOT EXISTS public.tuition_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.tuition_requests(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  applied_by uuid NOT NULL,
  message text,
  status public.tuition_app_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, tutor_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tuition_applications TO authenticated;
GRANT ALL ON public.tuition_applications TO service_role;
ALTER TABLE public.tuition_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY ta_admin_all ON public.tuition_applications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY ta_owner_read ON public.tuition_applications
  FOR SELECT TO authenticated
  USING (auth.uid() = applied_by);
CREATE POLICY ta_tutor_insert ON public.tuition_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = applied_by
    AND EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = tutor_id AND t.submitted_by = auth.uid() AND t.status = 'approved'
    )
    AND EXISTS (
      SELECT 1 FROM public.tuition_requests r
      WHERE r.id = request_id AND r.status IN ('approved','matched')
    )
  );
CREATE POLICY ta_owner_update ON public.tuition_applications
  FOR UPDATE TO authenticated
  USING (auth.uid() = applied_by)
  WITH CHECK (auth.uid() = applied_by AND status = 'withdrawn');

CREATE TRIGGER tuition_applications_set_updated_at BEFORE UPDATE ON public.tuition_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================= EDUCATION NEWS =================
CREATE TABLE IF NOT EXISTS public.education_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  cover_image_url text,
  category text,
  content text NOT NULL,
  excerpt text,
  publish_date timestamptz NOT NULL DEFAULT now(),
  is_published boolean NOT NULL DEFAULT false,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.education_news TO anon, authenticated;
GRANT ALL ON public.education_news TO service_role;
ALTER TABLE public.education_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY en_public_read ON public.education_news
  FOR SELECT TO anon, authenticated
  USING (is_published = true);
CREATE POLICY en_admin_all ON public.education_news
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER education_news_set_updated_at BEFORE UPDATE ON public.education_news
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================= STUDENT ACHIEVEMENTS =================
CREATE TABLE IF NOT EXISTS public.student_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  photo_url text,
  institution text,
  area text,
  achievement text NOT NULL,
  story text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.student_achievements TO anon, authenticated;
GRANT ALL ON public.student_achievements TO service_role;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY sa_public_read ON public.student_achievements
  FOR SELECT TO anon, authenticated
  USING (is_published = true);
CREATE POLICY sa_admin_all ON public.student_achievements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER student_achievements_set_updated_at BEFORE UPDATE ON public.student_achievements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================= STUDY RESOURCES =================
CREATE TABLE IF NOT EXISTS public.study_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  student_class text,
  subject text,
  category text,
  thumbnail_url text,
  resource_type public.resource_type NOT NULL DEFAULT 'link',
  external_url text NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.study_resources TO anon, authenticated;
GRANT ALL ON public.study_resources TO service_role;
ALTER TABLE public.study_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY sr_public_read ON public.study_resources
  FOR SELECT TO anon, authenticated
  USING (is_published = true);
CREATE POLICY sr_admin_all ON public.study_resources
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER study_resources_set_updated_at BEFORE UPDATE ON public.study_resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
