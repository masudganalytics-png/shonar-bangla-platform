-- KHIJIRION Match: request -> verification -> browse -> interest -> controlled contact

CREATE TYPE public.match_looking_for AS ENUM ('groom', 'bride');
CREATE TYPE public.match_created_for AS ENUM ('self', 'guardian');
CREATE TYPE public.match_marital_status AS ENUM ('unmarried', 'divorced', 'widowed');
CREATE TYPE public.match_request_status AS ENUM ('pending', 'approved', 'rejected', 'hidden');
CREATE TYPE public.match_interest_status AS ENUM ('pending', 'accepted', 'declined', 'withdrawn');

CREATE TABLE public.match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_for public.match_created_for NOT NULL DEFAULT 'self',
  looking_for public.match_looking_for NOT NULL,
  display_name TEXT NOT NULL,
  age_min INTEGER NOT NULL DEFAULT 18,
  age_max INTEGER NOT NULL DEFAULT 40,
  area TEXT NOT NULL,
  education TEXT,
  profession TEXT,
  marital_status public.match_marital_status NOT NULL DEFAULT 'unmarried',
  height_cm INTEGER,
  family_info TEXT,
  expectations TEXT,
  photo_url TEXT,
  contact_name TEXT,
  contact_phone TEXT NOT NULL,
  status public.match_request_status NOT NULL DEFAULT 'pending',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_requests_status ON public.match_requests (status, created_at DESC);
CREATE INDEX idx_match_requests_user ON public.match_requests (user_id);

-- Contact columns are never granted to anon/authenticated; released only via server functions.
GRANT SELECT (id, user_id, created_for, looking_for, display_name, age_min, age_max, area,
  education, profession, marital_status, height_cm, family_info, expectations, photo_url,
  status, is_verified, created_at, updated_at) ON public.match_requests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.match_requests TO authenticated;
GRANT ALL ON public.match_requests TO service_role;

ALTER TABLE public.match_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved match requests are public"
  ON public.match_requests FOR SELECT TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Owners read own match requests"
  ON public.match_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all match requests"
  ON public.match_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own match requests"
  ON public.match_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update own match requests"
  ON public.match_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners delete own match requests"
  ON public.match_requests FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.match_requests_guard_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.is_verified := false;
    NEW.admin_note := NULL;
    RETURN NEW;
  END IF;

  NEW.admin_note := OLD.admin_note;
  NEW.user_id := OLD.user_id;
  IF NEW.display_name IS DISTINCT FROM OLD.display_name
     OR NEW.looking_for IS DISTINCT FROM OLD.looking_for
     OR NEW.area IS DISTINCT FROM OLD.area
     OR NEW.education IS DISTINCT FROM OLD.education
     OR NEW.profession IS DISTINCT FROM OLD.profession
     OR NEW.family_info IS DISTINCT FROM OLD.family_info
     OR NEW.expectations IS DISTINCT FROM OLD.expectations
     OR NEW.photo_url IS DISTINCT FROM OLD.photo_url THEN
    NEW.status := 'pending';
    NEW.is_verified := false;
  ELSE
    NEW.status := OLD.status;
    NEW.is_verified := OLD.is_verified;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_match_requests_guard
  BEFORE INSERT OR UPDATE ON public.match_requests
  FOR EACH ROW EXECUTE FUNCTION public.match_requests_guard_moderation();

CREATE TRIGGER trg_match_requests_uat
  BEFORE UPDATE ON public.match_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------- interests

CREATE OR REPLACE FUNCTION public.owns_match_request(_request_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.match_requests r WHERE r.id = _request_id AND r.user_id = _user_id);
$$;

CREATE TABLE public.match_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.match_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  message TEXT,
  status public.match_interest_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, sender_id)
);

CREATE INDEX idx_match_interests_request ON public.match_interests (request_id);
CREATE INDEX idx_match_interests_sender ON public.match_interests (sender_id);

GRANT SELECT (id, request_id, sender_id, sender_name, message, status, created_at, updated_at)
  ON public.match_interests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.match_interests TO authenticated;
GRANT ALL ON public.match_interests TO service_role;

ALTER TABLE public.match_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Senders read own interests"
  ON public.match_interests FOR SELECT TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Request owners read interests"
  ON public.match_interests FOR SELECT TO authenticated
  USING (public.owns_match_request(request_id, auth.uid()));

CREATE POLICY "Admins read all interests"
  ON public.match_interests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users send own interests"
  ON public.match_interests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND NOT public.owns_match_request(request_id, auth.uid()));

CREATE POLICY "Parties update interests"
  ON public.match_interests FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR public.owns_match_request(request_id, auth.uid()))
  WITH CHECK (auth.uid() = sender_id OR public.owns_match_request(request_id, auth.uid()));

CREATE POLICY "Senders delete own interests"
  ON public.match_interests FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

CREATE TRIGGER trg_match_interests_uat
  BEFORE UPDATE ON public.match_interests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------- shortlists

CREATE TABLE public.match_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_id UUID NOT NULL REFERENCES public.match_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, request_id)
);

GRANT SELECT, INSERT, DELETE ON public.match_shortlists TO authenticated;
GRANT ALL ON public.match_shortlists TO service_role;

ALTER TABLE public.match_shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shortlist"
  ON public.match_shortlists FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
