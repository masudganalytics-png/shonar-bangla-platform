
CREATE POLICY worker_images_public_read ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'worker-images');
CREATE POLICY worker_images_public_insert ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'worker-images');
CREATE POLICY worker_images_admin_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'worker-images' AND has_role(auth.uid(), 'admin'::app_role));
