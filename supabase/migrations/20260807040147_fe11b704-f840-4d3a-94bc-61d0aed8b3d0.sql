-- 1) Probashi: remove column-level read access to contact fields
REVOKE SELECT ON public.probashi_profiles FROM anon, authenticated;
GRANT SELECT (
  id, user_id, slug, full_name, photo_url, birth_date, country, country_code,
  city, village, profession, moved_abroad_date, expected_return_date,
  community_message, show_contact, is_verified, status, created_at, updated_at
) ON public.probashi_profiles TO anon, authenticated;

-- 2) Community members: scope public roster reads
CREATE OR REPLACE FUNCTION public.is_public_community(_community_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.communities
    WHERE id = _community_id AND kind IN ('community','club')
  );
$$;

DROP POLICY IF EXISTS community_members_read ON public.community_members;

CREATE POLICY community_members_read_public
  ON public.community_members FOR SELECT
  TO anon, authenticated
  USING (public.is_public_community(community_id));

CREATE POLICY community_members_read_own_group
  ON public.community_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_community_member(community_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );