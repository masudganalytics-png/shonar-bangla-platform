
-- ============ enums ============
CREATE TYPE public.mosque_verification_status AS ENUM ('pending','verified','rejected');
CREATE TYPE public.mosque_committee_position AS ENUM ('president','vice_president','secretary','treasurer','member');
CREATE TYPE public.mosque_visibility AS ENUM ('public','private');
CREATE TYPE public.mosque_project_status AS ENUM ('planned','ongoing','completed','paused');
CREATE TYPE public.mosque_txn_type AS ENUM ('income','expense');
CREATE TYPE public.mosque_notice_priority AS ENUM ('normal','important','urgent');

-- ============ mosques ============
CREATE TABLE public.mosques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  name text NOT NULL,
  area text,
  union_name text,
  ward text,
  upazila text NOT NULL,
  district text NOT NULL,
  established_year integer,
  imam_name text,
  muazzin_name text,
  phone text,
  phone_visibility public.mosque_visibility NOT NULL DEFAULT 'public',
  map_url text,
  photo_url text,
  description text,
  finance_public boolean NOT NULL DEFAULT false,
  status public.mosque_verification_status NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  verified_by uuid,
  rejection_reason text,
  created_by uuid NOT NULL,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mosques TO authenticated;
GRANT ALL ON public.mosques TO service_role;
ALTER TABLE public.mosques ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.mosque_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mosque_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.mosque_managers TO authenticated;
GRANT ALL ON public.mosque_managers TO service_role;
ALTER TABLE public.mosque_managers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_mosque_manager(_mosque_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.mosques m WHERE m.id = _mosque_id AND m.created_by = _user_id)
    OR EXISTS (SELECT 1 FROM public.mosque_managers mm WHERE mm.mosque_id = _mosque_id AND mm.user_id = _user_id)
    OR public.has_role(_user_id, 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_mosque_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; candidate text; i int := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN RETURN NEW; END IF;
  base := lower(regexp_replace(coalesce(NEW.name,''), '[^a-zA-Z0-9\u0980-\u09FF\s-]', '', 'g'));
  base := regexp_replace(trim(base), '\s+', '-', 'g');
  IF base = '' THEN base := 'mosque'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.mosques WHERE slug = candidate AND id <> NEW.id) LOOP
    i := i + 1; candidate := base || '-' || i::text;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_mosques_slug BEFORE INSERT ON public.mosques FOR EACH ROW EXECUTE FUNCTION public.generate_mosque_slug();
CREATE TRIGGER trg_mosques_uat BEFORE UPDATE ON public.mosques FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- prevent self-verification by non-admins
CREATE OR REPLACE FUNCTION public.mosque_guard_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending'; NEW.verified_at := NULL; NEW.verified_by := NULL;
  ELSE
    NEW.status := OLD.status; NEW.verified_at := OLD.verified_at; NEW.verified_by := OLD.verified_by;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_mosques_guard BEFORE INSERT OR UPDATE ON public.mosques FOR EACH ROW EXECUTE FUNCTION public.mosque_guard_verification();

CREATE INDEX idx_mosques_district ON public.mosques (district);
CREATE INDEX idx_mosques_upazila ON public.mosques (upazila);
CREATE INDEX idx_mosques_union ON public.mosques (union_name);
CREATE INDEX idx_mosques_status ON public.mosques (status);
CREATE INDEX idx_mosques_name_trgm ON public.mosques (lower(name));
CREATE INDEX idx_mosques_area ON public.mosques (area);

CREATE POLICY "mosques_public_read_verified" ON public.mosques FOR SELECT TO authenticated
  USING (status = 'verified' OR public.is_mosque_manager(id, auth.uid()));
CREATE POLICY "mosques_insert_own" ON public.mosques FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "mosques_update_manager" ON public.mosques FOR UPDATE TO authenticated
  USING (public.is_mosque_manager(id, auth.uid())) WITH CHECK (public.is_mosque_manager(id, auth.uid()));
CREATE POLICY "mosques_delete_admin" ON public.mosques FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "mosque_managers_read" ON public.mosque_managers FOR SELECT TO authenticated
  USING (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "mosque_managers_write" ON public.mosque_managers FOR INSERT TO authenticated
  WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "mosque_managers_delete" ON public.mosque_managers FOR DELETE TO authenticated
  USING (public.is_mosque_manager(mosque_id, auth.uid()));

-- ============ committee ============
CREATE TABLE public.mosque_committee_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  photo_url text,
  position public.mosque_committee_position NOT NULL DEFAULT 'member',
  custom_title text,
  phone text,
  phone_visibility public.mosque_visibility NOT NULL DEFAULT 'private',
  bio text,
  sort_order integer NOT NULL DEFAULT 100,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mosque_committee_members TO authenticated;
GRANT ALL ON public.mosque_committee_members TO service_role;
ALTER TABLE public.mosque_committee_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_committee_mosque ON public.mosque_committee_members (mosque_id);
CREATE TRIGGER trg_committee_uat BEFORE UPDATE ON public.mosque_committee_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "committee_read" ON public.mosque_committee_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "committee_write" ON public.mosque_committee_members FOR INSERT TO authenticated WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "committee_update" ON public.mosque_committee_members FOR UPDATE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid())) WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "committee_delete" ON public.mosque_committee_members FOR DELETE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid()));

-- ============ society leaders ============
CREATE TABLE public.society_leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  photo_url text,
  role_title text,
  phone text,
  phone_visibility public.mosque_visibility NOT NULL DEFAULT 'private',
  description text,
  sort_order integer NOT NULL DEFAULT 100,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.society_leaders TO authenticated;
GRANT ALL ON public.society_leaders TO service_role;
ALTER TABLE public.society_leaders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_society_leaders_mosque ON public.society_leaders (mosque_id);
CREATE INDEX idx_society_leaders_name ON public.society_leaders (lower(full_name));
CREATE TRIGGER trg_society_leaders_uat BEFORE UPDATE ON public.society_leaders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "society_leaders_read" ON public.society_leaders FOR SELECT TO authenticated USING (true);
CREATE POLICY "society_leaders_write" ON public.society_leaders FOR INSERT TO authenticated WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "society_leaders_update" ON public.society_leaders FOR UPDATE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid())) WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "society_leaders_delete" ON public.society_leaders FOR DELETE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid()));

-- ============ society members ============
CREATE TABLE public.society_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  photo_url text,
  family_name text,
  phone text,
  phone_visibility public.mosque_visibility NOT NULL DEFAULT 'private',
  description text,
  sort_order integer NOT NULL DEFAULT 100,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.society_members TO authenticated;
GRANT ALL ON public.society_members TO service_role;
ALTER TABLE public.society_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_society_members_mosque ON public.society_members (mosque_id);
CREATE TRIGGER trg_society_members_uat BEFORE UPDATE ON public.society_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "society_members_read" ON public.society_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "society_members_write" ON public.society_members FOR INSERT TO authenticated WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "society_members_update" ON public.society_members FOR UPDATE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid())) WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "society_members_delete" ON public.society_members FOR DELETE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid()));

-- ============ donors ============
CREATE TABLE public.mosque_donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  project_id uuid,
  full_name text NOT NULL,
  photo_url text,
  location text,
  purpose text,
  amount numeric(14,2) CHECK (amount IS NULL OR amount >= 0),
  donated_on date,
  is_anonymous boolean NOT NULL DEFAULT false,
  amount_visibility public.mosque_visibility NOT NULL DEFAULT 'public',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mosque_donors TO authenticated;
GRANT ALL ON public.mosque_donors TO service_role;
ALTER TABLE public.mosque_donors ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_donors_mosque ON public.mosque_donors (mosque_id);
CREATE TRIGGER trg_donors_uat BEFORE UPDATE ON public.mosque_donors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "donors_read_manager" ON public.mosque_donors FOR SELECT TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "donors_write" ON public.mosque_donors FOR INSERT TO authenticated WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "donors_update" ON public.mosque_donors FOR UPDATE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid())) WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "donors_delete" ON public.mosque_donors FOR DELETE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid()));

-- ============ development projects ============
CREATE TABLE public.development_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  target_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
  collected_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (collected_amount >= 0),
  spent_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (spent_amount >= 0),
  start_date date,
  expected_completion_date date,
  status public.mosque_project_status NOT NULL DEFAULT 'planned',
  photos text[] NOT NULL DEFAULT '{}',
  updates text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.development_projects TO authenticated;
GRANT ALL ON public.development_projects TO service_role;
ALTER TABLE public.development_projects ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_projects_mosque ON public.development_projects (mosque_id);
CREATE TRIGGER trg_projects_uat BEFORE UPDATE ON public.development_projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "projects_read" ON public.development_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_write" ON public.development_projects FOR INSERT TO authenticated WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "projects_update" ON public.development_projects FOR UPDATE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid())) WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "projects_delete" ON public.development_projects FOR DELETE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid()));

ALTER TABLE public.mosque_donors ADD CONSTRAINT mosque_donors_project_fk FOREIGN KEY (project_id) REFERENCES public.development_projects(id) ON DELETE SET NULL;

-- ============ financial transactions ============
CREATE TABLE public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.development_projects(id) ON DELETE SET NULL,
  txn_type public.mosque_txn_type NOT NULL,
  txn_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  description text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT ALL ON public.financial_transactions TO service_role;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_txn_mosque_date ON public.financial_transactions (mosque_id, txn_date DESC);
CREATE TRIGGER trg_txn_uat BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "txn_read_manager" ON public.financial_transactions FOR SELECT TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "txn_write" ON public.financial_transactions FOR INSERT TO authenticated WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "txn_update" ON public.financial_transactions FOR UPDATE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid())) WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "txn_delete" ON public.financial_transactions FOR DELETE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid()));

-- ============ notices ============
CREATE TABLE public.community_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  notice_date date NOT NULL DEFAULT CURRENT_DATE,
  image_url text,
  priority public.mosque_notice_priority NOT NULL DEFAULT 'normal',
  published_by uuid,
  is_hidden boolean NOT NULL DEFAULT false,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_notices TO authenticated;
GRANT ALL ON public.community_notices TO service_role;
ALTER TABLE public.community_notices ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notices_mosque ON public.community_notices (mosque_id, notice_date DESC);
CREATE TRIGGER trg_notices_uat BEFORE UPDATE ON public.community_notices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "notices_read" ON public.community_notices FOR SELECT TO authenticated USING (is_hidden = false OR public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "notices_write" ON public.community_notices FOR INSERT TO authenticated WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "notices_update" ON public.community_notices FOR UPDATE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid())) WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "notices_delete" ON public.community_notices FOR DELETE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid()));

-- ============ activities ============
CREATE TABLE public.community_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  name text NOT NULL,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  location text,
  description text,
  organizer text,
  photos text[] NOT NULL DEFAULT '{}',
  is_hidden boolean NOT NULL DEFAULT false,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_activities TO authenticated;
GRANT ALL ON public.community_activities TO service_role;
ALTER TABLE public.community_activities ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activities_mosque ON public.community_activities (mosque_id, activity_date DESC);
CREATE TRIGGER trg_activities_uat BEFORE UPDATE ON public.community_activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "activities_read" ON public.community_activities FOR SELECT TO authenticated USING (is_hidden = false OR public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "activities_write" ON public.community_activities FOR INSERT TO authenticated WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "activities_update" ON public.community_activities FOR UPDATE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid())) WITH CHECK (public.is_mosque_manager(mosque_id, auth.uid()));
CREATE POLICY "activities_delete" ON public.community_activities FOR DELETE TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid()));

-- ============ verification / report records ============
CREATE TABLE public.verification_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  action text NOT NULL,
  note text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.verification_records TO authenticated;
GRANT ALL ON public.verification_records TO service_role;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_verification_mosque ON public.verification_records (mosque_id, created_at DESC);
CREATE POLICY "verification_read" ON public.verification_records FOR SELECT TO authenticated USING (public.is_mosque_manager(mosque_id, auth.uid()));

CREATE TABLE public.mosque_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  target_kind text NOT NULL DEFAULT 'profile',
  target_id uuid,
  reason text NOT NULL,
  contact text,
  reporter_id uuid,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mosque_reports TO authenticated;
GRANT ALL ON public.mosque_reports TO service_role;
ALTER TABLE public.mosque_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mosque_reports_status ON public.mosque_reports (status, created_at DESC);
CREATE TRIGGER trg_mosque_reports_uat BEFORE UPDATE ON public.mosque_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "mosque_reports_insert" ON public.mosque_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "mosque_reports_read_admin" ON public.mosque_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
