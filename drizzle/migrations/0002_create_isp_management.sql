CREATE TABLE public.isps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  note text NOT NULL DEFAULT '',
  phones text[] NOT NULL DEFAULT '{}',
  is_btrc_approved boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.isps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.isps TO authenticated;
GRANT ALL ON public.isps TO service_role;

ALTER TABLE public.isps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active isps" ON public.isps
  FOR SELECT TO anon, authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage isps" ON public.isps
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.isp_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  isp_id uuid NOT NULL REFERENCES public.isps(id) ON DELETE CASCADE,
  area_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (isp_id, area_key)
);

GRANT SELECT ON public.isp_areas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.isp_areas TO authenticated;
GRANT ALL ON public.isp_areas TO service_role;

ALTER TABLE public.isp_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view isp areas" ON public.isp_areas
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage isp areas" ON public.isp_areas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.isp_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  isp_id uuid NOT NULL REFERENCES public.isps(id) ON DELETE CASCADE,
  name text NOT NULL,
  speed_mbps integer,
  price numeric(10,2),
  note text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.isp_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.isp_packages TO authenticated;
GRANT ALL ON public.isp_packages TO service_role;

ALTER TABLE public.isp_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active isp packages" ON public.isp_packages
  FOR SELECT TO anon, authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage isp packages" ON public.isp_packages
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_isp_areas_area_key ON public.isp_areas(area_key);
CREATE INDEX idx_isp_packages_isp ON public.isp_packages(isp_id);

CREATE TRIGGER trg_isps_uat BEFORE UPDATE ON public.isps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_isp_packages_uat BEFORE UPDATE ON public.isp_packages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.isps (id, name, note, phones, is_btrc_approved, sort_order) VALUES
  ('11111111-1111-4111-8111-111111111101', 'Hello IT', 'লোকাল ISP', ARRAY['+8801719-322533'], false, 10),
  ('11111111-1111-4111-8111-111111111102', 'Orange Communication', 'ন্যাশনওয়াইড ISP', ARRAY['01817-648888','01815-647777'], false, 20),
  ('11111111-1111-4111-8111-111111111103', 'Mim Online', 'লোকাল ISP', ARRAY['01835-401111'], false, 30),
  ('11111111-1111-4111-8111-111111111104', 'STAR NET Internet & Service', 'BTRC অনুমোদিত', ARRAY['01817-969696','01846-868686'], true, 40);

INSERT INTO public.isp_areas (isp_id, area_key) VALUES
  ('11111111-1111-4111-8111-111111111101', 'coxsbazar'),
  ('11111111-1111-4111-8111-111111111102', 'courtbazar'),
  ('11111111-1111-4111-8111-111111111103', 'ukhiya'),
  ('11111111-1111-4111-8111-111111111104', 'ukhiya'),
  ('11111111-1111-4111-8111-111111111104', 'kutupalong');