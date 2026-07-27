
-- business-media bucket policies (path pattern: {owner_id}/...)
CREATE POLICY "biz_media_public_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'business-media'
  AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.status = 'approved'
      AND b.owner_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "biz_media_owner_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'business-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "biz_media_owner_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'business-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "biz_media_owner_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'business-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "biz_media_owner_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'business-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "biz_media_admin_all"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'business-media' AND public.has_role(auth.uid(),'admin'))
WITH CHECK (bucket_id = 'business-media' AND public.has_role(auth.uid(),'admin'));
