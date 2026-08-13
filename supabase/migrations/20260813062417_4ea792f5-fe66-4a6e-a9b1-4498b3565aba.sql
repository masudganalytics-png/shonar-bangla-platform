ALTER TABLE public.govt_workers ADD COLUMN IF NOT EXISTS tips_for_younger text;

GRANT SELECT (tips_for_younger) ON public.govt_workers TO anon, authenticated;
GRANT INSERT (tips_for_younger), UPDATE (tips_for_younger) ON public.govt_workers TO authenticated;
GRANT ALL ON public.govt_workers TO service_role;