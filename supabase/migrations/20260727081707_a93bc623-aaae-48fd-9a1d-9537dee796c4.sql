
CREATE POLICY "education_media_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'education-media');
CREATE POLICY "education_media_admin_write" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'education-media' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'education-media' AND public.has_role(auth.uid(),'admin'));
