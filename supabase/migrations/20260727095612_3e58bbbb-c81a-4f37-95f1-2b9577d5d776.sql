-- 1) Restrict public read of sensitive columns on tuition_requests
REVOKE SELECT ON public.tuition_requests FROM anon;
GRANT SELECT (
  id, submitted_by, district, upazila, area, student_class, subject,
  preferred_gender, budget, days_per_week, preferred_time, mode, notes,
  status, matched_tutor_id, created_at, updated_at
) ON public.tuition_requests TO anon;

-- authenticated retains full column access; RLS still restricts rows
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tuition_requests TO authenticated;

-- 2) Storage upload policies: require auth + owner-scoped path
DROP POLICY IF EXISTS teacher_images_public_insert ON storage.objects;
DROP POLICY IF EXISTS worker_images_public_insert ON storage.objects;

CREATE POLICY teacher_images_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'teacher-images'
    AND (
      name LIKE ('submissions/' || auth.uid()::text || '/%')
      OR (public.has_role(auth.uid(), 'admin') AND name LIKE 'admin/%')
    )
  );

CREATE POLICY worker_images_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'worker-images'
    AND (
      name LIKE ('submissions/' || auth.uid()::text || '/%')
      OR (public.has_role(auth.uid(), 'admin') AND name LIKE 'admin/%')
    )
  );