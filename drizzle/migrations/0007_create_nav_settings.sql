CREATE TABLE public.nav_settings (
  item_key TEXT PRIMARY KEY,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.nav_settings TO anon, authenticated;
GRANT ALL ON public.nav_settings TO service_role;

ALTER TABLE public.nav_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nav settings are public" ON public.nav_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE TRIGGER trg_nav_settings_uat
  BEFORE UPDATE ON public.nav_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
