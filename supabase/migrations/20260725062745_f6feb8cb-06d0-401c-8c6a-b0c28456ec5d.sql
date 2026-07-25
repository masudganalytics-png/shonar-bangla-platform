
-- 1) complaint reason enum + columns
DO $$ BEGIN
  CREATE TYPE public.complaint_reason AS ENUM ('high_bill','wrong_reading','wrong_tariff','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reason public.complaint_reason NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS image_url text;

-- 2) notification triggers (SECURITY DEFINER bypasses RLS on notifications insert)
CREATE OR REPLACE FUNCTION public.notify_report_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.admin_response IS DISTINCT FROM OLD.admin_response THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.user_id,
      'অভিযোগ আপডেট: ' || NEW.title,
      COALESCE(NULLIF(NEW.admin_response, ''), 'নতুন স্ট্যাটাস: ' || NEW.status::text),
      '/reports'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reports_notify ON public.reports;
CREATE TRIGGER trg_reports_notify
  AFTER UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_report_update();

CREATE OR REPLACE FUNCTION public.notify_bill_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.user_id,
      'বিলের স্ট্যাটাস আপডেট',
      'মিটার ' || NEW.meter_no || ' — নতুন স্ট্যাটাস: ' || NEW.status::text,
      '/bills'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bills_notify ON public.bills;
CREATE TRIGGER trg_bills_notify
  AFTER UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.notify_bill_update();

-- 3) updated_at trigger for reports (if not present)
DROP TRIGGER IF EXISTS trg_reports_updated_at ON public.reports;
CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) storage.objects policies for complaint-images
DROP POLICY IF EXISTS "complaint_images_select_own_or_admin" ON storage.objects;
DROP POLICY IF EXISTS "complaint_images_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "complaint_images_update_own" ON storage.objects;
DROP POLICY IF EXISTS "complaint_images_delete_own" ON storage.objects;

CREATE POLICY "complaint_images_select_own_or_admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'complaint-images'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "complaint_images_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'complaint-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "complaint_images_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'complaint-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "complaint_images_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'complaint-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
