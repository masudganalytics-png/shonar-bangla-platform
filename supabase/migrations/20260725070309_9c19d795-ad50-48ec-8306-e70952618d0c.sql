
CREATE TABLE public.tariff_slabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'REB',
  meter_type text NOT NULL DEFAULT 'postpaid',
  slab_min integer NOT NULL,
  slab_max integer,
  rate_per_unit numeric(10,4) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tariff_slabs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tariff_slabs TO authenticated;
GRANT ALL ON public.tariff_slabs TO service_role;

ALTER TABLE public.tariff_slabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tariff_slabs_public_read ON public.tariff_slabs
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY tariff_slabs_admin_write ON public.tariff_slabs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tariff_slabs_set_updated_at
  BEFORE UPDATE ON public.tariff_slabs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed BREB residential postpaid slabs (approximate current rates in BDT/kWh)
INSERT INTO public.tariff_slabs (provider, meter_type, slab_min, slab_max, rate_per_unit, sort_order) VALUES
  ('REB','postpaid',   0,  75, 5.2600, 1),
  ('REB','postpaid',  76, 200, 7.2000, 2),
  ('REB','postpaid', 201, 300, 7.5900, 3),
  ('REB','postpaid', 301, 400, 8.0200, 4),
  ('REB','postpaid', 401, 600, 12.6700, 5),
  ('REB','postpaid', 601, NULL, 14.6100, 6),
  ('REB','prepaid',    0,  75, 4.6300, 1),
  ('REB','prepaid',   76, 200, 6.3400, 2),
  ('REB','prepaid',  201, 300, 6.6600, 3),
  ('REB','prepaid',  301, 400, 7.0800, 4),
  ('REB','prepaid',  401, 600, 11.0000, 5),
  ('REB','prepaid',  601, NULL, 12.9200, 6);
