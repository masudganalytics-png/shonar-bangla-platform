
-- Enum
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'closed');

-- ADVOCATES
CREATE TABLE public.advocates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  photo_url text,
  practice_areas text[] NOT NULL DEFAULT '{}',
  chamber_address text,
  experience_years integer,
  languages text[] NOT NULL DEFAULT '{}',
  availability text,
  phone text,
  whatsapp text NOT NULL,
  email text,
  bio text,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.advocates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.advocates TO authenticated;
GRANT ALL ON public.advocates TO service_role;

ALTER TABLE public.advocates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advocates_public_read_active" ON public.advocates
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "advocates_admin_read_all" ON public.advocates
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "advocates_admin_insert" ON public.advocates
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "advocates_admin_update" ON public.advocates
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "advocates_admin_delete" ON public.advocates
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER advocates_set_updated_at
  BEFORE UPDATE ON public.advocates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- LEGAL LEADS
CREATE TABLE public.legal_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advocate_id uuid REFERENCES public.advocates(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  category text NOT NULL,
  description text,
  status public.lead_status NOT NULL DEFAULT 'new',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.legal_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_leads TO authenticated;
GRANT ALL ON public.legal_leads TO service_role;

ALTER TABLE public.legal_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legal_leads_public_insert" ON public.legal_leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "legal_leads_admin_read" ON public.legal_leads
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "legal_leads_admin_update" ON public.legal_leads
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "legal_leads_admin_delete" ON public.legal_leads
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX legal_leads_advocate_idx ON public.legal_leads(advocate_id);
CREATE INDEX legal_leads_created_idx ON public.legal_leads(created_at DESC);
CREATE INDEX advocates_active_idx ON public.advocates(is_active, sort_order);

CREATE TRIGGER legal_leads_set_updated_at
  BEFORE UPDATE ON public.legal_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
