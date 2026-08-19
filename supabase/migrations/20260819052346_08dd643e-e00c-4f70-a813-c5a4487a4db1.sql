REVOKE ALL ON FUNCTION public.is_ukhiya_go_driver_owner(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_ukhiya_go_driver_owner(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_ukhiya_go_driver_owner(uuid, uuid) TO authenticated, service_role;