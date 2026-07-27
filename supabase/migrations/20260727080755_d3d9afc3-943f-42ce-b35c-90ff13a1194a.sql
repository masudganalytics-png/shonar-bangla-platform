-- Security fix: remove unused teacher_gallery table and permissive policy
DROP POLICY IF EXISTS teacher_gallery_public_insert ON public.teacher_gallery;
DROP POLICY IF EXISTS teacher_gallery_public_read ON public.teacher_gallery;
DROP POLICY IF EXISTS teacher_gallery_admin_all ON public.teacher_gallery;
DROP TABLE IF EXISTS public.teacher_gallery;
