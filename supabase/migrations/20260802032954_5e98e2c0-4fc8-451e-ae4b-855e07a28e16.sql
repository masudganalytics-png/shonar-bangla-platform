-- Enums
DO $$ BEGIN
  CREATE TYPE public.community_phone_visibility AS ENUM ('public','members','managers','hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.community_member_status AS ENUM ('active','inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.community_badge AS ENUM ('founder','lifetime','executive','advisor','volunteer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Positions
CREATE TABLE IF NOT EXISTS public.community_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name_bn text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, name_bn)
);

GRANT SELECT ON public.community_positions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_positions TO authenticated;
GRANT ALL ON public.community_positions TO service_role;

ALTER TABLE public.community_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_positions_read ON public.community_positions;
CREATE POLICY community_positions_read ON public.community_positions FOR SELECT USING (true);

DROP POLICY IF EXISTS community_positions_write ON public.community_positions;
CREATE POLICY community_positions_write ON public.community_positions FOR ALL TO authenticated
  USING (public.is_community_manager(community_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_community_manager(community_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_community_positions_community ON public.community_positions(community_id, sort_order);

DROP TRIGGER IF EXISTS trg_community_positions_updated_at ON public.community_positions;
CREATE TRIGGER trg_community_positions_updated_at BEFORE UPDATE ON public.community_positions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Member badges
CREATE TABLE IF NOT EXISTS public.community_member_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  badge public.community_badge NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, user_id, badge)
);

GRANT SELECT ON public.community_member_badges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_member_badges TO authenticated;
GRANT ALL ON public.community_member_badges TO service_role;

ALTER TABLE public.community_member_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_member_badges_read ON public.community_member_badges;
CREATE POLICY community_member_badges_read ON public.community_member_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS community_member_badges_write ON public.community_member_badges;
CREATE POLICY community_member_badges_write ON public.community_member_badges FOR ALL TO authenticated
  USING (public.is_community_manager(community_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_community_manager(community_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_community_member_badges_lookup ON public.community_member_badges(community_id, user_id);

-- Extend members
ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS position_id uuid REFERENCES public.community_positions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS custom_title text,
  ADD COLUMN IF NOT EXISTS status public.community_member_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS phone_visibility public.community_phone_visibility NOT NULL DEFAULT 'managers';

CREATE INDEX IF NOT EXISTS idx_community_members_position ON public.community_members(position_id);

-- Seed default positions for every community + future ones
CREATE OR REPLACE FUNCTION public.seed_default_community_positions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  names text[] := ARRAY[
    'সভাপতি','সহ-সভাপতি','সাধারণ সম্পাদক','যুগ্ম সাধারণ সম্পাদক','সাংগঠনিক সম্পাদক',
    'সহ-সাংগঠনিক সম্পাদক','কোষাধ্যক্ষ','দপ্তর সম্পাদক','প্রচার সম্পাদক','ক্রীড়া সম্পাদক',
    'সাংস্কৃতিক সম্পাদক','ধর্ম বিষয়ক সম্পাদক','সমাজকল্যাণ সম্পাদক','সদস্য'
  ];
  i int;
BEGIN
  FOR i IN 1..array_length(names, 1) LOOP
    INSERT INTO public.community_positions (community_id, name_bn, sort_order)
    VALUES (NEW.id, names[i], i * 10)
    ON CONFLICT (community_id, name_bn) DO NOTHING;
  END LOOP;
  RETURN NULL;
END $function$;

DROP TRIGGER IF EXISTS trg_seed_default_community_positions ON public.communities;
CREATE TRIGGER trg_seed_default_community_positions AFTER INSERT ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_community_positions();

INSERT INTO public.community_positions (community_id, name_bn, sort_order)
SELECT c.id, x.name_bn, x.ord * 10
FROM public.communities c
CROSS JOIN (
  VALUES
    ('সভাপতি',1),('সহ-সভাপতি',2),('সাধারণ সম্পাদক',3),('যুগ্ম সাধারণ সম্পাদক',4),
    ('সাংগঠনিক সম্পাদক',5),('সহ-সাংগঠনিক সম্পাদক',6),('কোষাধ্যক্ষ',7),('দপ্তর সম্পাদক',8),
    ('প্রচার সম্পাদক',9),('ক্রীড়া সম্পাদক',10),('সাংস্কৃতিক সম্পাদক',11),
    ('ধর্ম বিষয়ক সম্পাদক',12),('সমাজকল্যাণ সম্পাদক',13),('সদস্য',14)
) AS x(name_bn, ord)
ON CONFLICT (community_id, name_bn) DO NOTHING;