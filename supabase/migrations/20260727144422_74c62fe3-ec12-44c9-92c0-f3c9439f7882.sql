
-- Helper: match stored path with either bare name or bucket-prefixed name
DROP POLICY IF EXISTS teacher_images_public_read ON storage.objects;
CREATE POLICY teacher_images_public_read ON storage.objects
FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'teacher-images'
  AND (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.status = 'approved'
        AND (t.photo_url = storage.objects.name
             OR t.photo_url = 'teacher-images/' || storage.objects.name)
    )
    OR (auth.uid() IS NOT NULL AND owner = auth.uid())
  )
);

DROP POLICY IF EXISTS worker_images_public_read ON storage.objects;
CREATE POLICY worker_images_public_read ON storage.objects
FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'worker-images'
  AND (
    EXISTS (
      SELECT 1 FROM public.workers w
      WHERE w.status = 'approved'
        AND (w.photo_url = storage.objects.name
             OR w.photo_url = 'worker-images/' || storage.objects.name)
    )
    OR EXISTS (
      SELECT 1 FROM public.worker_gallery g
      JOIN public.workers w ON w.id = g.worker_id
      WHERE w.status = 'approved'
        AND (g.image_url = storage.objects.name
             OR g.image_url = 'worker-images/' || storage.objects.name)
    )
    OR (auth.uid() IS NOT NULL AND owner = auth.uid())
  )
);

DROP POLICY IF EXISTS education_media_public_read ON storage.objects;
CREATE POLICY education_media_public_read ON storage.objects
FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'education-media'
  AND (
    EXISTS (
      SELECT 1 FROM public.education_news n
      WHERE n.is_published = true
        AND (n.cover_image_url = storage.objects.name
             OR n.cover_image_url = 'education-media/' || storage.objects.name)
    )
    OR EXISTS (
      SELECT 1 FROM public.study_resources r
      WHERE r.is_published = true
        AND (r.thumbnail_url = storage.objects.name
             OR r.thumbnail_url = 'education-media/' || storage.objects.name)
    )
    OR EXISTS (
      SELECT 1 FROM public.student_achievements a
      WHERE a.is_published = true
        AND (a.photo_url = storage.objects.name
             OR a.photo_url = 'education-media/' || storage.objects.name)
    )
    OR (auth.uid() IS NOT NULL AND owner = auth.uid())
    OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
  )
);
