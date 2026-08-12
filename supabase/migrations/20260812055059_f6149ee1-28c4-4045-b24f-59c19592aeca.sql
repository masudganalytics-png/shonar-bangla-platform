-- Enums
CREATE TYPE public.govt_worker_status AS ENUM ('pending', 'approved', 'rejected', 'hidden');
CREATE TYPE public.govt_phone_visibility AS ENUM ('public', 'members', 'hidden');
CREATE TYPE public.govt_report_status AS ENUM ('open', 'reviewed', 'dismissed');

-- Main table
CREATE TABLE public.govt_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  photo_url text,
  designation text NOT NULL,
  organization text NOT NULL,
  department text NOT NULL,
  job_category text,
  current_workplace text,
  current_district text NOT NULL,
  current_upazila text,
  ukhiya_area text NOT NULL,
  joining_year integer,
  bio text,
  phone text,
  whatsapp text,
  official_email text,
  phone_visibility public.govt_phone_visibility NOT NULL DEFAULT 'hidden',
  consent_given boolean NOT NULL DEFAULT false,
  status public.govt_worker_status NOT NULL DEFAULT 'pending',
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  verified_by uuid,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Column-scoped grants: phone / whatsapp / official_email / admin_note are NEVER
-- readable through the Data API. They are released only by server functions
-- (service role) after honouring phone_visibility.
GRANT SELECT (
  id, user_id, full_name, photo_url, designation, organization, department,
  job_category, current_workplace, current_district, current_upazila, ukhiya_area,
  joining_year, bio, phone_visibility, consent_given, status, is_verified,
  verified_at, created_at, updated_at
) ON public.govt_workers TO anon, authenticated;

GRANT INSERT (
  user_id, full_name, photo_url, designation, organization, department,
  job_category, current_workplace, current_district, current_upazila, ukhiya_area,
  joining_year, bio, phone, whatsapp, official_email, phone_visibility, consent_given
) ON public.govt_workers TO authenticated;

GRANT UPDATE (
  full_name, photo_url, designation, organization, department,
  job_category, current_workplace, current_district, current_upazila, ukhiya_area,
  joining_year, bio, phone, whatsapp, official_email, phone_visibility, consent_given
) ON public.govt_workers TO authenticated;

GRANT DELETE ON public.govt_workers TO authenticated;
GRANT ALL ON public.govt_workers TO service_role;

ALTER TABLE public.govt_workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "govt_workers_public_read_verified"
  ON public.govt_workers FOR SELECT TO anon, authenticated
  USING (status = 'approved' AND is_verified = true);

CREATE POLICY "govt_workers_read_own"
  ON public.govt_workers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "govt_workers_admin_read_all"
  ON public.govt_workers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "govt_workers_insert_own"
  ON public.govt_workers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND consent_given = true);

CREATE POLICY "govt_workers_update_own"
  ON public.govt_workers FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "govt_workers_admin_write"
  ON public.govt_workers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "govt_workers_delete_own"
  ON public.govt_workers FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Guard: non-admins can never set moderation fields; edits to key facts reset review.
CREATE OR REPLACE FUNCTION public.govt_workers_guard_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.is_verified := false;
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
    NEW.admin_note := NULL;
    RETURN NEW;
  END IF;

  NEW.verified_by := OLD.verified_by;
  NEW.admin_note := OLD.admin_note;

  IF NEW.full_name IS DISTINCT FROM OLD.full_name
     OR NEW.designation IS DISTINCT FROM OLD.designation
     OR NEW.organization IS DISTINCT FROM OLD.organization
     OR NEW.department IS DISTINCT FROM OLD.department
     OR NEW.current_workplace IS DISTINCT FROM OLD.current_workplace
     OR NEW.current_district IS DISTINCT FROM OLD.current_district
     OR NEW.ukhiya_area IS DISTINCT FROM OLD.ukhiya_area THEN
    NEW.status := 'pending';
    NEW.is_verified := false;
    NEW.verified_at := NULL;
  ELSE
    NEW.status := OLD.status;
    NEW.is_verified := OLD.is_verified;
    NEW.verified_at := OLD.verified_at;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_govt_workers_guard
  BEFORE INSERT OR UPDATE ON public.govt_workers
  FOR EACH ROW EXECUTE FUNCTION public.govt_workers_guard_moderation();

CREATE TRIGGER trg_govt_workers_uat
  BEFORE UPDATE ON public.govt_workers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_govt_workers_public ON public.govt_workers (status, is_verified, created_at DESC);
CREATE INDEX idx_govt_workers_department ON public.govt_workers (department);
CREATE INDEX idx_govt_workers_district ON public.govt_workers (current_district);
CREATE INDEX idx_govt_workers_search ON public.govt_workers
  USING gin (to_tsvector('simple',
    coalesce(full_name,'') || ' ' || coalesce(designation,'') || ' ' ||
    coalesce(organization,'') || ' ' || coalesce(department,'') || ' ' ||
    coalesce(current_workplace,'') || ' ' || coalesce(ukhiya_area,'')));

-- Reports
CREATE TABLE public.govt_worker_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.govt_workers(id) ON DELETE CASCADE,
  reporter_id uuid,
  reason text NOT NULL,
  details text,
  status public.govt_report_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT (worker_id, reporter_id, reason, details) ON public.govt_worker_reports TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.govt_worker_reports TO authenticated;
GRANT ALL ON public.govt_worker_reports TO service_role;

ALTER TABLE public.govt_worker_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "govt_reports_insert_anyone"
  ON public.govt_worker_reports FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "govt_reports_admin_manage"
  ON public.govt_worker_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_govt_worker_reports_uat
  BEFORE UPDATE ON public.govt_worker_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_govt_worker_reports_worker ON public.govt_worker_reports (worker_id, created_at DESC);