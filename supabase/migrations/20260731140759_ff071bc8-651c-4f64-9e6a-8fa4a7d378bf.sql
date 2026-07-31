
REVOKE EXECUTE ON FUNCTION public.sync_community_member_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_community_reaction_counts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_community_owner_member() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_community_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_view_member_phone(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_community_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_community_manager(uuid, uuid) FROM PUBLIC, anon;
