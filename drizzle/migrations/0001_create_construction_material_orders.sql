CREATE TABLE public.construction_material_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  material text NOT NULL,
  quantity text NOT NULL,
  delivery_location text NOT NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.construction_material_orders TO anon;
GRANT SELECT, INSERT ON public.construction_material_orders TO authenticated;
GRANT ALL ON public.construction_material_orders TO service_role;

ALTER TABLE public.construction_material_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a material order"
  ON public.construction_material_orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own material orders"
  ON public.construction_material_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all material orders"
  ON public.construction_material_orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update material orders"
  ON public.construction_material_orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_construction_material_orders_updated_at
  BEFORE UPDATE ON public.construction_material_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_construction_material_orders_created_at
  ON public.construction_material_orders (created_at DESC);