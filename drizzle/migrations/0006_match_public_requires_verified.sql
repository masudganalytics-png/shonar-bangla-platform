DROP POLICY IF EXISTS "Approved match requests are public" ON public.match_requests;

CREATE POLICY "Approved verified match requests are public"
  ON public.match_requests FOR SELECT TO anon, authenticated
  USING (status = 'approved' AND is_verified = true);
