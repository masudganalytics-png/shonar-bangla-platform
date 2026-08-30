-- Public RLS policies (e.g. public.reviews SELECT, storage education-media read)
-- evaluate public.has_role(), so anonymous readers need EXECUTE.
-- The function is SECURITY DEFINER and returns false for a NULL/unknown uid.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;