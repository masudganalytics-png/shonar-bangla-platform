
-- ============ ENUMS ============
CREATE TYPE public.community_kind AS ENUM ('community', 'club', 'group');
CREATE TYPE public.community_group_type AS ENUM ('school_batch','college_batch','university_batch','friends','sports_team','neighborhood','other');
CREATE TYPE public.community_member_role AS ENUM ('owner','admin','member');
CREATE TYPE public.community_event_category AS ENUM ('walima','akika','milad','iftar','khela','mela','social','other');
CREATE TYPE public.community_visibility AS ENUM ('public','members');
CREATE TYPE public.community_target_type AS ENUM ('post','event');
CREATE TYPE public.community_reaction_kind AS ENUM ('like','report');

-- ============ COMMUNITIES ============
CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.community_kind NOT NULL DEFAULT 'community',
  group_type public.community_group_type,
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  area text,
  logo_url text,
  cover_url text,
  created_by uuid NOT NULL,
  member_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT SELECT ON public.communities TO anon;
GRANT ALL ON public.communities TO service_role;

-- ============ MEMBERS ============
CREATE TABLE public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.community_member_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_members TO authenticated;
GRANT SELECT ON public.community_members TO anon;
GRANT ALL ON public.community_members TO service_role;

-- ============ POSTS ============
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  like_count integer NOT NULL DEFAULT 0,
  report_count integer NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT SELECT ON public.community_posts TO anon;
GRANT ALL ON public.community_posts TO service_role;

-- ============ EVENTS ============
CREATE TABLE public.community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL,
  title text NOT NULL,
  category public.community_event_category NOT NULL DEFAULT 'other',
  area text,
  description text,
  event_date date NOT NULL,
  event_time text,
  cover_url text,
  visibility public.community_visibility NOT NULL DEFAULT 'public',
  like_count integer NOT NULL DEFAULT 0,
  report_count integer NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_events TO authenticated;
GRANT SELECT ON public.community_events TO anon;
GRANT ALL ON public.community_events TO service_role;

-- ============ LIKES / REPORTS ============
CREATE TABLE public.community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type public.community_target_type NOT NULL,
  target_id uuid NOT NULL,
  kind public.community_reaction_kind NOT NULL DEFAULT 'like',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id, kind)
);
GRANT SELECT, INSERT, DELETE ON public.community_likes TO authenticated;
GRANT ALL ON public.community_likes TO service_role;

-- ============ INDEXES ============
CREATE INDEX idx_communities_kind ON public.communities(kind) WHERE is_active;
CREATE INDEX idx_community_members_user ON public.community_members(user_id);
CREATE INDEX idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_community ON public.community_posts(community_id);
CREATE INDEX idx_community_events_date ON public.community_events(event_date);
CREATE INDEX idx_community_events_community ON public.community_events(community_id);
CREATE INDEX idx_community_likes_target ON public.community_likes(target_type, target_id, kind);

-- ============ HELPER FUNCTIONS (security definer, avoid RLS recursion) ============
CREATE OR REPLACE FUNCTION public.is_community_member(_community_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_members WHERE community_id = _community_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_community_manager(_community_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = _community_id AND user_id = _user_id AND role IN ('owner','admin')
  );
$$;

-- Phone visibility: website admin, self, or owner/admin of a community the target joined
CREATE OR REPLACE FUNCTION public.can_view_member_phone(_viewer uuid, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _viewer = _target
      OR public.has_role(_viewer, 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.community_members target_m
        JOIN public.community_members viewer_m
          ON viewer_m.community_id = target_m.community_id
        WHERE target_m.user_id = _target
          AND viewer_m.user_id = _viewer
          AND viewer_m.role IN ('owner','admin')
      );
$$;

-- ============ COUNTER TRIGGERS ============
CREATE OR REPLACE FUNCTION public.sync_community_member_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid;
BEGIN
  target := COALESCE(NEW.community_id, OLD.community_id);
  UPDATE public.communities c
     SET member_count = (SELECT count(*) FROM public.community_members WHERE community_id = target)
   WHERE c.id = target;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_community_member_count
AFTER INSERT OR DELETE ON public.community_members
FOR EACH ROW EXECUTE FUNCTION public.sync_community_member_count();

CREATE OR REPLACE FUNCTION public.sync_community_reaction_counts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.community_target_type;
  tid uuid;
  k public.community_reaction_kind;
  n integer;
BEGIN
  t := COALESCE(NEW.target_type, OLD.target_type);
  tid := COALESCE(NEW.target_id, OLD.target_id);
  k := COALESCE(NEW.kind, OLD.kind);
  SELECT count(*) INTO n FROM public.community_likes
    WHERE target_type = t AND target_id = tid AND kind = k;
  IF t = 'post' THEN
    IF k = 'like' THEN UPDATE public.community_posts SET like_count = n WHERE id = tid;
    ELSE UPDATE public.community_posts SET report_count = n WHERE id = tid; END IF;
  ELSE
    IF k = 'like' THEN UPDATE public.community_events SET like_count = n WHERE id = tid;
    ELSE UPDATE public.community_events SET report_count = n WHERE id = tid; END IF;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_community_reaction_counts
AFTER INSERT OR DELETE ON public.community_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_community_reaction_counts();

-- Owner membership auto-created
CREATE OR REPLACE FUNCTION public.add_community_owner_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT (community_id, user_id) DO NOTHING;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_community_owner_member
AFTER INSERT ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.add_community_owner_member();

-- Slug generation
CREATE OR REPLACE FUNCTION public.generate_community_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; candidate text; i int := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN RETURN NEW; END IF;
  base := lower(regexp_replace(coalesce(NEW.name,''), '[^a-zA-Z0-9\u0980-\u09FF\s-]', '', 'g'));
  base := regexp_replace(trim(base), '\s+', '-', 'g');
  IF base = '' THEN base := NEW.kind::text; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.communities WHERE slug = candidate AND id <> NEW.id) LOOP
    i := i + 1;
    candidate := base || '-' || i::text;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_community_slug BEFORE INSERT ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.generate_community_slug();

CREATE TRIGGER trg_communities_updated_at BEFORE UPDATE ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_community_posts_updated_at BEFORE UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_community_events_updated_at BEFORE UPDATE ON public.community_events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RLS ============
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

-- communities
CREATE POLICY communities_public_read ON public.communities
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY communities_owner_read ON public.communities
  FOR SELECT TO authenticated USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY communities_insert ON public.communities
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY communities_update ON public.communities
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_community_manager(id, auth.uid()) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.is_community_manager(id, auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY communities_delete ON public.communities
  FOR DELETE TO authenticated USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- members
CREATE POLICY community_members_read ON public.community_members
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY community_members_join ON public.community_members
  FOR INSERT TO authenticated
  WITH CHECK ((user_id = auth.uid() AND role = 'member') OR public.is_community_manager(community_id, auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY community_members_update ON public.community_members
  FOR UPDATE TO authenticated
  USING (public.is_community_manager(community_id, auth.uid()) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_community_manager(community_id, auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY community_members_leave ON public.community_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_community_manager(community_id, auth.uid()) OR has_role(auth.uid(), 'admin'));

-- posts
CREATE POLICY community_posts_public_read ON public.community_posts
  FOR SELECT TO anon, authenticated USING (is_hidden = false);
CREATE POLICY community_posts_owner_read ON public.community_posts
  FOR SELECT TO authenticated USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY community_posts_insert ON public.community_posts
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND (community_id IS NULL OR public.is_community_member(community_id, auth.uid())));
CREATE POLICY community_posts_update ON public.community_posts
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR (community_id IS NOT NULL AND public.is_community_manager(community_id, auth.uid())) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (author_id = auth.uid() OR (community_id IS NOT NULL AND public.is_community_manager(community_id, auth.uid())) OR has_role(auth.uid(), 'admin'));
CREATE POLICY community_posts_delete ON public.community_posts
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR (community_id IS NOT NULL AND public.is_community_manager(community_id, auth.uid())) OR has_role(auth.uid(), 'admin'));

-- events
CREATE POLICY community_events_public_read ON public.community_events
  FOR SELECT TO anon, authenticated USING (is_hidden = false AND visibility = 'public');
CREATE POLICY community_events_member_read ON public.community_events
  FOR SELECT TO authenticated
  USING (is_hidden = false AND (organizer_id = auth.uid() OR (community_id IS NOT NULL AND public.is_community_member(community_id, auth.uid())) OR has_role(auth.uid(), 'admin')));
CREATE POLICY community_events_insert ON public.community_events
  FOR INSERT TO authenticated
  WITH CHECK (organizer_id = auth.uid() AND (community_id IS NULL OR public.is_community_member(community_id, auth.uid())));
CREATE POLICY community_events_update ON public.community_events
  FOR UPDATE TO authenticated
  USING (organizer_id = auth.uid() OR (community_id IS NOT NULL AND public.is_community_manager(community_id, auth.uid())) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (organizer_id = auth.uid() OR (community_id IS NOT NULL AND public.is_community_manager(community_id, auth.uid())) OR has_role(auth.uid(), 'admin'));
CREATE POLICY community_events_delete ON public.community_events
  FOR DELETE TO authenticated
  USING (organizer_id = auth.uid() OR (community_id IS NOT NULL AND public.is_community_manager(community_id, auth.uid())) OR has_role(auth.uid(), 'admin'));

-- likes / reports
CREATE POLICY community_likes_read_own ON public.community_likes
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY community_likes_insert ON public.community_likes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY community_likes_delete ON public.community_likes
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
