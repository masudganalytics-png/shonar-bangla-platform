ALTER TABLE public.govt_workers ADD COLUMN IF NOT EXISTS date_of_birth date NULL;

-- date_of_birth is private: it is NOT added to the public column grant.
REVOKE SELECT (date_of_birth) ON public.govt_workers FROM anon, authenticated;
GRANT UPDATE (date_of_birth), INSERT (date_of_birth) ON public.govt_workers TO authenticated;
GRANT ALL ON public.govt_workers TO service_role;