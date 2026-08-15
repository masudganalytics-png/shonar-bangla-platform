-- 1. Remove direct read access to private contact columns; keep everything else readable.
REVOKE SELECT ON public.govt_workers FROM anon, authenticated;
GRANT SELECT (id, user_id, full_name, photo_url, designation, organization, department, job_category, current_workplace, current_district, current_upazila, ukhiya_area, joining_year, bio, phone_visibility, consent_given, status, is_verified, verified_at, verified_by, admin_note, created_at, updated_at, tips_for_younger) ON public.govt_workers TO anon, authenticated;

REVOKE SELECT ON public.mosque_committee_members FROM anon, authenticated;
GRANT SELECT (id, mosque_id, full_name, photo_url, "position", custom_title, phone_visibility, bio, sort_order, created_by, updated_by, created_at, updated_at) ON public.mosque_committee_members TO anon, authenticated;

REVOKE SELECT ON public.society_leaders FROM anon, authenticated;
GRANT SELECT (id, mosque_id, full_name, photo_url, role_title, phone_visibility, description, sort_order, created_by, updated_by, created_at, updated_at) ON public.society_leaders TO anon, authenticated;

REVOKE SELECT ON public.society_members FROM anon, authenticated;
GRANT SELECT (id, mosque_id, full_name, photo_url, family_name, phone_visibility, description, sort_order, created_by, updated_by, created_at, updated_at) ON public.society_members TO anon, authenticated;

-- 2. SECURITY DEFINER helpers should not be callable by signed-out visitors.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_view_member_phone(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_community_manager(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_community_member(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_mosque_manager(uuid, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_member_phone(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_community_manager(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_community_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_mosque_manager(uuid, uuid) TO authenticated, service_role;
-- is_public_community is required by an anon-facing policy, keep it executable.
GRANT EXECUTE ON FUNCTION public.is_public_community(uuid) TO anon, authenticated, service_role;