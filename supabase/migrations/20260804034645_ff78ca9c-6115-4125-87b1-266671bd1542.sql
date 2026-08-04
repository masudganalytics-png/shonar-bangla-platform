CREATE TYPE public.probashi_status AS ENUM ('pending','approved','rejected','suspended');

CREATE TABLE public.probashi_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  slug text UNIQUE,
  full_name text NOT NULL,
  photo_url text,
  birth_date date,
  country text NOT NULL,
  country_code text,
  city text,
  village text,
  profession text,
  moved_abroad_date date,
  expected_return_date date,
  phone text,
  whatsapp text,
  facebook_url text,
  community_message text,
  show_contact boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  status public.probashi_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT probashi_message_len CHECK (community_message IS NULL OR char_length(community_message) <= 120),
  CONSTRAINT probashi_name_len CHECK (char_length(full_name) BETWEEN 2 AND 120)
);

CREATE UNIQUE INDEX probashi_profiles_user_unique ON public.probashi_profiles (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX probashi_profiles_status_idx ON public.probashi_profiles (status, created_at DESC);
CREATE INDEX probashi_profiles_country_idx ON public.probashi_profiles (country) WHERE status = 'approved';
CREATE INDEX probashi_profiles_city_idx ON public.probashi_profiles (city) WHERE status = 'approved';
CREATE INDEX probashi_profiles_return_idx ON public.probashi_profiles (expected_return_date) WHERE status = 'approved';
CREATE INDEX probashi_profiles_birthday_idx ON public.probashi_profiles ((EXTRACT(MONTH FROM birth_date)), (EXTRACT(DAY FROM birth_date))) WHERE status = 'approved';

GRANT SELECT (
  id, slug, full_name, photo_url, birth_date, country, country_code, city, village,
  profession, moved_abroad_date, expected_return_date, facebook_url, community_message,
  show_contact, is_verified, status, created_at, updated_at
) ON public.probashi_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.probashi_profiles TO authenticated;
GRANT ALL ON public.probashi_profiles TO service_role;

ALTER TABLE public.probashi_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "probashi_public_read_approved" ON public.probashi_profiles
  FOR SELECT TO anon, authenticated USING (status = 'approved');

CREATE POLICY "probashi_read_own" ON public.probashi_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "probashi_insert_own" ON public.probashi_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "probashi_update_own" ON public.probashi_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "probashi_delete_own" ON public.probashi_profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "probashi_admin_all" ON public.probashi_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.probashi_guard_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.is_verified := false;
  ELSE
    NEW.is_verified := OLD.is_verified;
    IF OLD.status = 'suspended' THEN
      NEW.status := OLD.status;
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER probashi_guard_moderation_trg
  BEFORE INSERT OR UPDATE ON public.probashi_profiles
  FOR EACH ROW EXECUTE FUNCTION public.probashi_guard_moderation();

CREATE TRIGGER probashi_assign_slug
  BEFORE INSERT OR UPDATE ON public.probashi_profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_profile_slug();

CREATE TRIGGER probashi_set_updated_at
  BEFORE UPDATE ON public.probashi_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.probashi_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.probashi_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  sent_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, kind, sent_on)
);

GRANT ALL ON public.probashi_notification_log TO service_role;
ALTER TABLE public.probashi_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "probashi_log_admin_read" ON public.probashi_notification_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));