-- ENUMS
CREATE TYPE public.ukhiya_go_verification_status AS ENUM ('pending','approved','rejected','suspended');
CREATE TYPE public.ukhiya_go_vehicle_type AS ENUM ('car','microbus','cng','tomtom','bike','truck','pickup','ambulance','other');
CREATE TYPE public.ukhiya_go_trip_type AS ENUM ('regular','return_trip','rental','goods');
CREATE TYPE public.ukhiya_go_trip_status AS ENUM ('draft','published','full','completed','cancelled');
CREATE TYPE public.ukhiya_go_booking_status AS ENUM ('pending','confirmed','cancelled','completed','rejected');
CREATE TYPE public.ukhiya_go_report_status AS ENUM ('open','reviewed','dismissed');

-- DRIVERS
CREATE TABLE public.ukhiya_go_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  profile_photo text,
  address text,
  experience_years integer,
  bio text,
  verification_status public.ukhiya_go_verification_status NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  verified_by uuid,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ukhiya_go_drivers_user_id_key ON public.ukhiya_go_drivers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX ukhiya_go_drivers_status_idx ON public.ukhiya_go_drivers(verification_status);

GRANT SELECT, INSERT, UPDATE ON public.ukhiya_go_drivers TO authenticated;
GRANT ALL ON public.ukhiya_go_drivers TO service_role;
ALTER TABLE public.ukhiya_go_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers_select_own" ON public.ukhiya_go_drivers
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "drivers_insert_own" ON public.ukhiya_go_drivers
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "drivers_update_own" ON public.ukhiya_go_drivers
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "drivers_delete_admin" ON public.ukhiya_go_drivers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_ukhiya_go_drivers_uat BEFORE UPDATE ON public.ukhiya_go_drivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- helper
CREATE OR REPLACE FUNCTION public.is_ukhiya_go_driver_owner(_driver_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.ukhiya_go_drivers d WHERE d.id = _driver_id AND d.user_id = _user_id);
$$;
REVOKE EXECUTE ON FUNCTION public.is_ukhiya_go_driver_owner(uuid, uuid) FROM anon;

-- VEHICLES
CREATE TABLE public.ukhiya_go_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.ukhiya_go_drivers(id) ON DELETE CASCADE,
  vehicle_type public.ukhiya_go_vehicle_type NOT NULL,
  brand text,
  model text,
  registration_number text,
  seating_capacity integer,
  photos text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  verification_status public.ukhiya_go_verification_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ukhiya_go_vehicles_driver_idx ON public.ukhiya_go_vehicles(driver_id);
CREATE INDEX ukhiya_go_vehicles_type_idx ON public.ukhiya_go_vehicles(vehicle_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ukhiya_go_vehicles TO authenticated;
GRANT ALL ON public.ukhiya_go_vehicles TO service_role;
ALTER TABLE public.ukhiya_go_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_select_own" ON public.ukhiya_go_vehicles
  FOR SELECT TO authenticated
  USING (public.is_ukhiya_go_driver_owner(driver_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "vehicles_write_own" ON public.ukhiya_go_vehicles
  FOR ALL TO authenticated
  USING (public.is_ukhiya_go_driver_owner(driver_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_ukhiya_go_driver_owner(driver_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_ukhiya_go_vehicles_uat BEFORE UPDATE ON public.ukhiya_go_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TRIPS
CREATE TABLE public.ukhiya_go_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.ukhiya_go_drivers(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.ukhiya_go_vehicles(id) ON DELETE SET NULL,
  from_location text NOT NULL,
  to_location text NOT NULL,
  trip_type public.ukhiya_go_trip_type NOT NULL DEFAULT 'regular',
  trip_date date NOT NULL,
  departure_time time,
  available_seats integer NOT NULL DEFAULT 0,
  price_per_person numeric(10,2),
  notes text,
  status public.ukhiya_go_trip_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ukhiya_go_trips_driver_idx ON public.ukhiya_go_trips(driver_id);
CREATE INDEX ukhiya_go_trips_date_idx ON public.ukhiya_go_trips(trip_date);
CREATE INDEX ukhiya_go_trips_status_idx ON public.ukhiya_go_trips(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ukhiya_go_trips TO authenticated;
GRANT SELECT ON public.ukhiya_go_trips TO anon;
GRANT ALL ON public.ukhiya_go_trips TO service_role;
ALTER TABLE public.ukhiya_go_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_select_published" ON public.ukhiya_go_trips
  FOR SELECT TO anon, authenticated
  USING (status IN ('published','full'));
CREATE POLICY "trips_select_own" ON public.ukhiya_go_trips
  FOR SELECT TO authenticated
  USING (public.is_ukhiya_go_driver_owner(driver_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "trips_write_own" ON public.ukhiya_go_trips
  FOR ALL TO authenticated
  USING (public.is_ukhiya_go_driver_owner(driver_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_ukhiya_go_driver_owner(driver_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_ukhiya_go_trips_uat BEFORE UPDATE ON public.ukhiya_go_trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- BOOKINGS
CREATE TABLE public.ukhiya_go_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.ukhiya_go_trips(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.ukhiya_go_drivers(id) ON DELETE CASCADE,
  passenger_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  passenger_name text NOT NULL,
  passenger_phone text NOT NULL,
  seats_booked integer NOT NULL DEFAULT 1,
  pickup_point text,
  note text,
  status public.ukhiya_go_booking_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ukhiya_go_bookings_trip_idx ON public.ukhiya_go_bookings(trip_id);
CREATE INDEX ukhiya_go_bookings_passenger_idx ON public.ukhiya_go_bookings(passenger_id);

GRANT SELECT, INSERT, UPDATE ON public.ukhiya_go_bookings TO authenticated;
GRANT ALL ON public.ukhiya_go_bookings TO service_role;
ALTER TABLE public.ukhiya_go_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_select_involved" ON public.ukhiya_go_bookings
  FOR SELECT TO authenticated
  USING (passenger_id = auth.uid() OR public.is_ukhiya_go_driver_owner(driver_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bookings_insert_own" ON public.ukhiya_go_bookings
  FOR INSERT TO authenticated WITH CHECK (passenger_id = auth.uid());
CREATE POLICY "bookings_update_involved" ON public.ukhiya_go_bookings
  FOR UPDATE TO authenticated
  USING (passenger_id = auth.uid() OR public.is_ukhiya_go_driver_owner(driver_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (passenger_id = auth.uid() OR public.is_ukhiya_go_driver_owner(driver_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_ukhiya_go_bookings_uat BEFORE UPDATE ON public.ukhiya_go_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- REVIEWS
CREATE TABLE public.ukhiya_go_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.ukhiya_go_drivers(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.ukhiya_go_trips(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.ukhiya_go_bookings(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (driver_id, user_id, trip_id)
);
CREATE INDEX ukhiya_go_reviews_driver_idx ON public.ukhiya_go_reviews(driver_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ukhiya_go_reviews TO authenticated;
GRANT SELECT ON public.ukhiya_go_reviews TO anon;
GRANT ALL ON public.ukhiya_go_reviews TO service_role;
ALTER TABLE public.ukhiya_go_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_public" ON public.ukhiya_go_reviews
  FOR SELECT TO anon, authenticated USING (is_hidden = false);
CREATE POLICY "reviews_select_own" ON public.ukhiya_go_reviews
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reviews_insert_own" ON public.ukhiya_go_reviews
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_update_own" ON public.ukhiya_go_reviews
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reviews_delete_own" ON public.ukhiya_go_reviews
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_ukhiya_go_reviews_uat BEFORE UPDATE ON public.ukhiya_go_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- REPORTS
CREATE TABLE public.ukhiya_go_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.ukhiya_go_drivers(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.ukhiya_go_vehicles(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.ukhiya_go_trips(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.ukhiya_go_bookings(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status public.ukhiya_go_report_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ukhiya_go_reports_status_idx ON public.ukhiya_go_reports(status);

GRANT SELECT, INSERT ON public.ukhiya_go_reports TO authenticated;
GRANT UPDATE ON public.ukhiya_go_reports TO authenticated;
GRANT ALL ON public.ukhiya_go_reports TO service_role;
ALTER TABLE public.ukhiya_go_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select_own_or_admin" ON public.ukhiya_go_reports
  FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reports_insert_own" ON public.ukhiya_go_reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_update_admin" ON public.ukhiya_go_reports
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_ukhiya_go_reports_uat BEFORE UPDATE ON public.ukhiya_go_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();