
DROP POLICY IF EXISTS worker_gallery_public_insert ON public.worker_gallery;
CREATE POLICY worker_gallery_public_insert ON public.worker_gallery FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.workers w WHERE w.id = worker_id));
