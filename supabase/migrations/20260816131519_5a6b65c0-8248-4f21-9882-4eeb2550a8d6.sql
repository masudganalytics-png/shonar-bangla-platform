-- 1. Mosque phone: remove column-level read for anon/authenticated
REVOKE SELECT ON public.mosques FROM anon, authenticated;
GRANT SELECT (id, slug, name, area, union_name, ward, upazila, district, established_year, imam_name, muazzin_name, phone_visibility, map_url, photo_url, description, finance_public, status, verified_at, verified_by, rejection_reason, created_by, updated_by, created_at, updated_at) ON public.mosques TO anon, authenticated;
GRANT ALL ON public.mosques TO service_role;

-- 2. Trigger-only SECURITY DEFINER functions must not be directly callable
REVOKE ALL ON FUNCTION public.govt_workers_guard_moderation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mosque_guard_verification() FROM PUBLIC, anon, authenticated;

-- 3. is_public_community: signed-in only
REVOKE ALL ON FUNCTION public.is_public_community(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_public_community(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS community_members_read_public ON public.community_members;
CREATE POLICY community_members_read_public ON public.community_members
  FOR SELECT TO authenticated
  USING (public.is_public_community(community_id));