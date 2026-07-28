-- Generic slug generator for person-named tables
CREATE OR REPLACE FUNCTION public.slugify_name(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  s text;
BEGIN
  IF input IS NULL THEN RETURN ''; END IF;
  s := lower(input);
  -- keep ascii letters, digits, spaces, hyphens
  s := regexp_replace(s, '[^a-z0-9\s-]', '', 'g');
  s := regexp_replace(s, '[\s-]+', '-', 'g');
  s := trim(both '-' from s);
  RETURN s;
END;
$$;

-- Reusable slug assignment for workers/teachers/advocates using full_name
CREATE OR REPLACE FUNCTION public.assign_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 1;
  tbl text := TG_TABLE_NAME;
  exists_row boolean;
BEGIN
  IF NEW.slug IS NOT NULL AND length(NEW.slug) > 0 THEN
    RETURN NEW;
  END IF;
  base := public.slugify_name(NEW.full_name);
  IF base = '' OR base IS NULL THEN
    base := 'profile-' || substr(replace(NEW.id::text, '-', ''), 1, 8);
  END IF;
  candidate := base;
  LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE slug = $1 AND id <> $2)', tbl)
      INTO exists_row USING candidate, NEW.id;
    EXIT WHEN NOT exists_row;
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

-- workers
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS workers_slug_unique_idx ON public.workers (slug) WHERE slug IS NOT NULL;
DROP TRIGGER IF EXISTS workers_assign_slug ON public.workers;
CREATE TRIGGER workers_assign_slug
BEFORE INSERT OR UPDATE OF full_name, slug ON public.workers
FOR EACH ROW EXECUTE FUNCTION public.assign_profile_slug();

-- teachers
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS teachers_slug_unique_idx ON public.teachers (slug) WHERE slug IS NOT NULL;
DROP TRIGGER IF EXISTS teachers_assign_slug ON public.teachers;
CREATE TRIGGER teachers_assign_slug
BEFORE INSERT OR UPDATE OF full_name, slug ON public.teachers
FOR EACH ROW EXECUTE FUNCTION public.assign_profile_slug();

-- advocates
ALTER TABLE public.advocates ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS advocates_slug_unique_idx ON public.advocates (slug) WHERE slug IS NOT NULL;
DROP TRIGGER IF EXISTS advocates_assign_slug ON public.advocates;
CREATE TRIGGER advocates_assign_slug
BEFORE INSERT OR UPDATE OF full_name, slug ON public.advocates
FOR EACH ROW EXECUTE FUNCTION public.assign_profile_slug();

-- Backfill existing rows: trigger fires because slug is NULL and update sets it
UPDATE public.workers SET slug = NULL WHERE slug IS NULL;
UPDATE public.teachers SET slug = NULL WHERE slug IS NULL;
UPDATE public.advocates SET slug = NULL WHERE slug IS NULL;
-- Force trigger to run by touching full_name to itself
UPDATE public.workers SET full_name = full_name WHERE slug IS NULL;
UPDATE public.teachers SET full_name = full_name WHERE slug IS NULL;
UPDATE public.advocates SET full_name = full_name WHERE slug IS NULL;