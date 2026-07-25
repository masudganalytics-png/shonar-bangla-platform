
ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS meter_type text,
  ADD COLUMN IF NOT EXISTS bill_year integer,
  ADD COLUMN IF NOT EXISTS bill_month integer,
  ADD COLUMN IF NOT EXISTS district text DEFAULT 'Cox''s Bazar',
  ADD COLUMN IF NOT EXISTS upazila text DEFAULT 'Ukhiya',
  ADD COLUMN IF NOT EXISTS union_name text,
  ADD COLUMN IF NOT EXISTS village text,
  ADD COLUMN IF NOT EXISTS family_members integer,
  ADD COLUMN IF NOT EXISTS bill_image_url text;

ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS bills_month_range_chk;
ALTER TABLE public.bills ADD CONSTRAINT bills_month_range_chk
  CHECK (bill_month IS NULL OR (bill_month BETWEEN 1 AND 12));

CREATE UNIQUE INDEX IF NOT EXISTS bills_unique_user_meter_period_idx
  ON public.bills (user_id, meter_no, bill_year, bill_month)
  WHERE bill_year IS NOT NULL AND bill_month IS NOT NULL;

DROP TRIGGER IF EXISTS bills_set_updated_at ON public.bills;
CREATE TRIGGER bills_set_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "bill_images_select_own" ON storage.objects;
DROP POLICY IF EXISTS "bill_images_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "bill_images_update_own" ON storage.objects;
DROP POLICY IF EXISTS "bill_images_delete_own" ON storage.objects;

CREATE POLICY "bill_images_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'bill-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "bill_images_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bill-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "bill_images_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'bill-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "bill_images_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'bill-images' AND auth.uid()::text = (storage.foldername(name))[1]);
