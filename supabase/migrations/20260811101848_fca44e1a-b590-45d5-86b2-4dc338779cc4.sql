DROP POLICY IF EXISTS communities_delete ON public.communities;
CREATE POLICY communities_delete ON public.communities FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));