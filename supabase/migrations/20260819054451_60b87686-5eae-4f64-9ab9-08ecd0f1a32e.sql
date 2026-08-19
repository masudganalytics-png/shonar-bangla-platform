
DROP POLICY IF EXISTS projects_read ON public.development_projects;
CREATE POLICY projects_read ON public.development_projects
  FOR SELECT TO authenticated
  USING (public.is_mosque_manager(mosque_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.development_projects FROM anon, authenticated;
GRANT SELECT (id, mosque_id, name, description, status, start_date, expected_completion_date, photos, created_at, updated_at) ON public.development_projects TO authenticated;

DROP POLICY IF EXISTS committee_read ON public.mosque_committee_members;
CREATE POLICY committee_read ON public.mosque_committee_members
  FOR SELECT TO authenticated
  USING (
    public.is_mosque_manager(mosque_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.mosques m WHERE m.id = mosque_id AND m.status = 'verified')
  );
REVOKE SELECT (phone) ON public.mosque_committee_members FROM anon, authenticated;

DROP POLICY IF EXISTS society_leaders_read ON public.society_leaders;
CREATE POLICY society_leaders_read ON public.society_leaders
  FOR SELECT TO authenticated
  USING (
    public.is_mosque_manager(mosque_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.mosques m WHERE m.id = mosque_id AND m.status = 'verified')
  );
REVOKE SELECT (phone) ON public.society_leaders FROM anon, authenticated;

DROP POLICY IF EXISTS society_members_read ON public.society_members;
CREATE POLICY society_members_read ON public.society_members
  FOR SELECT TO authenticated
  USING (
    public.is_mosque_manager(mosque_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.mosques m WHERE m.id = mosque_id AND m.status = 'verified')
  );
REVOKE SELECT (phone) ON public.society_members FROM anon, authenticated;

REVOKE SELECT (phone, whatsapp, official_email, date_of_birth) ON public.govt_workers FROM anon, authenticated;
