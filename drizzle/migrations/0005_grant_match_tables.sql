-- Data API grants for KHIJIRION Match.
-- Contact columns (contact_phone, contact_name, admin_note) get NO grant at all,
-- so they can never leave the database through PostgREST.
GRANT SELECT (
  id, user_id, display_name, looking_for, created_for, age_min, age_max, area,
  education, profession, marital_status, height_cm, family_info, expectations,
  photo_url, status, is_verified, created_at, updated_at
) ON public.match_requests TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.match_requests TO authenticated;
GRANT ALL ON public.match_requests TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_interests TO authenticated;
GRANT ALL ON public.match_interests TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_shortlists TO authenticated;
GRANT ALL ON public.match_shortlists TO service_role;
