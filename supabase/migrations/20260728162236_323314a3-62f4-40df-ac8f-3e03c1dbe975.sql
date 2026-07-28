
-- ENUM types
DO $$ BEGIN
  CREATE TYPE public.blood_group AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.donor_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.blood_request_status AS ENUM ('pending','approved','fulfilled','closed','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.donor_gender AS ENUM ('male','female','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- blood_donors
CREATE TABLE IF NOT EXISTS public.blood_donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  blood_group public.blood_group NOT NULL,
  phone text NOT NULL UNIQUE,
  whatsapp text,
  gender public.donor_gender,
  age integer CHECK (age IS NULL OR (age >= 16 AND age <= 80)),
  union_name text,
  village text,
  address text,
  last_donation_date date,
  available boolean NOT NULL DEFAULT true,
  photo_url text,
  notes text,
  status public.donor_status NOT NULL DEFAULT 'pending',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_donors TO authenticated;
GRANT SELECT, INSERT ON public.blood_donors TO anon;
GRANT ALL ON public.blood_donors TO service_role;

ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blood_donors_public_read"
  ON public.blood_donors FOR SELECT
  USING (status = 'approved' AND is_active = true);

CREATE POLICY "blood_donors_owner_read"
  ON public.blood_donors FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "blood_donors_admin_read"
  ON public.blood_donors FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "blood_donors_public_insert"
  ON public.blood_donors FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "blood_donors_owner_update"
  ON public.blood_donors FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "blood_donors_admin_all"
  ON public.blood_donors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_blood_donors_status ON public.blood_donors(status);
CREATE INDEX IF NOT EXISTS idx_blood_donors_group ON public.blood_donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_donors_available ON public.blood_donors(available) WHERE available = true;
CREATE INDEX IF NOT EXISTS idx_blood_donors_union ON public.blood_donors(union_name);
CREATE INDEX IF NOT EXISTS idx_blood_donors_user ON public.blood_donors(user_id);

CREATE TRIGGER trg_blood_donors_updated
  BEFORE UPDATE ON public.blood_donors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- blood_requests
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_name text NOT NULL,
  blood_group public.blood_group NOT NULL,
  bags_needed integer NOT NULL DEFAULT 1 CHECK (bags_needed >= 1 AND bags_needed <= 20),
  hospital_name text NOT NULL,
  hospital_location text,
  required_date date NOT NULL,
  required_time text,
  contact_person text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  notes text,
  status public.blood_request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_requests TO authenticated;
GRANT SELECT, INSERT ON public.blood_requests TO anon;
GRANT ALL ON public.blood_requests TO service_role;

ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blood_requests_public_read"
  ON public.blood_requests FOR SELECT
  USING (status = 'approved');

CREATE POLICY "blood_requests_owner_read"
  ON public.blood_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid());

CREATE POLICY "blood_requests_admin_read"
  ON public.blood_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "blood_requests_public_insert"
  ON public.blood_requests FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND (requester_id IS NULL OR requester_id = auth.uid())
  );

CREATE POLICY "blood_requests_owner_update"
  ON public.blood_requests FOR UPDATE TO authenticated
  USING (requester_id = auth.uid())
  WITH CHECK (requester_id = auth.uid() AND status IN ('pending','closed'));

CREATE POLICY "blood_requests_admin_all"
  ON public.blood_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON public.blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_group ON public.blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_requests_date ON public.blood_requests(required_date);
CREATE INDEX IF NOT EXISTS idx_blood_requests_requester ON public.blood_requests(requester_id);

CREATE TRIGGER trg_blood_requests_updated
  BEFORE UPDATE ON public.blood_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
