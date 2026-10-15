CREATE TABLE public.ebook_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text,
  photo_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ebook_authors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ebook_authors TO authenticated;
GRANT ALL ON public.ebook_authors TO service_role;
ALTER TABLE public.ebook_authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published authors" ON public.ebook_authors FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage authors" ON public.ebook_authors FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ebook_authors_uat BEFORE UPDATE ON public.ebook_authors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.ebook_authors(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  cover_url text,
  price_bdt numeric(10,2) NOT NULL DEFAULT 0 CHECK (price_bdt >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','hidden')),
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ebooks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ebooks TO authenticated;
GRANT ALL ON public.ebooks TO service_role;
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published ebooks" ON public.ebooks FOR SELECT TO anon, authenticated USING (status = 'published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage ebooks" ON public.ebooks FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ebooks_uat BEFORE UPDATE ON public.ebooks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage location kept apart from the public catalogue; admin-only.
CREATE TABLE public.ebook_files (
  ebook_id uuid PRIMARY KEY REFERENCES public.ebooks(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  size_bytes bigint,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ebook_files TO authenticated;
GRANT ALL ON public.ebook_files TO service_role;
ALTER TABLE public.ebook_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ebook files" ON public.ebook_files FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ebook_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ebook_id uuid NOT NULL REFERENCES public.ebooks(id) ON DELETE RESTRICT,
  amount_bdt numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled','refunded')),
  payment_provider text,
  payment_reference text UNIQUE,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ebook_orders_user_idx ON public.ebook_orders(user_id);
GRANT SELECT ON public.ebook_orders TO authenticated;
GRANT ALL ON public.ebook_orders TO service_role;
ALTER TABLE public.ebook_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own orders" ON public.ebook_orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ebook_orders_uat BEFORE UPDATE ON public.ebook_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ebook_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ebook_id uuid NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.ebook_orders(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ebook_id)
);
GRANT SELECT ON public.ebook_library TO authenticated;
GRANT ALL ON public.ebook_library TO service_role;
ALTER TABLE public.ebook_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own library" ON public.ebook_library FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Library rows require a paid order for that user+book (free books exempt).
CREATE OR REPLACE FUNCTION public.ebook_library_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE price numeric;
BEGIN
  SELECT price_bdt INTO price FROM public.ebooks WHERE id = NEW.ebook_id;
  IF COALESCE(price,0) = 0 THEN RETURN NEW; END IF;
  IF NEW.order_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.ebook_orders o
    WHERE o.id = NEW.order_id AND o.user_id = NEW.user_id AND o.ebook_id = NEW.ebook_id
      AND o.status = 'paid' AND o.paid_at IS NOT NULL AND o.payment_reference IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'payment_not_verified';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_ebook_library_guard BEFORE INSERT OR UPDATE ON public.ebook_library FOR EACH ROW EXECUTE FUNCTION public.ebook_library_guard();

CREATE POLICY "Admins upload ebook files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ebook-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read ebook files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ebook-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update ebook files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ebook-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete ebook files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ebook-files' AND public.has_role(auth.uid(),'admin'));