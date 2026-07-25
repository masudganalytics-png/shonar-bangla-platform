
REVOKE ALL ON FUNCTION public.notify_report_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_bill_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
