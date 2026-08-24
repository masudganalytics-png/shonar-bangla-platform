-- Trips: denormalized vehicle info (public can't read vehicles table) + booked seat counter
ALTER TABLE public.ukhiya_go_trips
  ADD COLUMN IF NOT EXISTS vehicle_type public.ukhiya_go_vehicle_type,
  ADD COLUMN IF NOT EXISTS vehicle_label text,
  ADD COLUMN IF NOT EXISTS booked_seats integer NOT NULL DEFAULT 0;

-- Bookings: drop/destination point
ALTER TABLE public.ukhiya_go_bookings
  ADD COLUMN IF NOT EXISTS drop_point text;

CREATE INDEX IF NOT EXISTS idx_ukhiya_go_bookings_trip_status ON public.ukhiya_go_bookings (trip_id, status);
CREATE INDEX IF NOT EXISTS idx_ukhiya_go_trips_search ON public.ukhiya_go_trips (status, trip_date);

-- Guard: booking creation + status transition rules + overbooking prevention
CREATE OR REPLACE FUNCTION public.ukhiya_go_booking_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.ukhiya_go_trips%ROWTYPE;
  is_driver boolean;
  is_admin boolean;
  confirmed int;
BEGIN
  is_admin := auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin');

  SELECT * INTO t FROM public.ukhiya_go_trips
   WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'trip_not_found';
  END IF;

  is_driver := auth.uid() IS NOT NULL AND public.is_ukhiya_go_driver_owner(t.driver_id, auth.uid());

  IF TG_OP = 'INSERT' THEN
    IF NOT is_admin THEN
      NEW.status := 'pending';
    END IF;
    IF NEW.seats_booked IS NULL OR NEW.seats_booked < 1 THEN
      RAISE EXCEPTION 'invalid_seats';
    END IF;
    IF t.status NOT IN ('published', 'full') THEN
      RAISE EXCEPTION 'trip_not_bookable';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE below; trusted server-side and admins may do anything
  IF auth.uid() IS NULL OR is_admin THEN
    RETURN NEW;
  END IF;

  -- Core booking fields are locked for non-admins
  IF NEW.trip_id IS DISTINCT FROM OLD.trip_id
     OR NEW.driver_id IS DISTINCT FROM OLD.driver_id
     OR NEW.passenger_id IS DISTINCT FROM OLD.passenger_id
     OR NEW.passenger_name IS DISTINCT FROM OLD.passenger_name
     OR NEW.passenger_phone IS DISTINCT FROM OLD.passenger_phone
     OR NEW.seats_booked IS DISTINCT FROM OLD.seats_booked THEN
    RAISE EXCEPTION 'booking_fields_locked';
  END IF;

  IF is_driver THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NOT (OLD.status = 'pending' AND NEW.status IN ('confirmed', 'rejected'))
       AND NOT (OLD.status = 'confirmed' AND NEW.status IN ('completed', 'cancelled')) THEN
      RAISE EXCEPTION 'invalid_status_change';
    END IF;
  ELSIF auth.uid() = OLD.passenger_id THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NOT (OLD.status IN ('pending', 'confirmed') AND NEW.status = 'cancelled') THEN
      RAISE EXCEPTION 'invalid_status_change';
    END IF;
  ELSE
    RAISE EXCEPTION 'not_allowed';
  END IF;

  -- Overbooking check when a driver accepts
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    SELECT COALESCE(SUM(seats_booked), 0) INTO confirmed
      FROM public.ukhiya_go_bookings
     WHERE trip_id = NEW.trip_id AND status = 'confirmed' AND id <> NEW.id;
    IF confirmed + NEW.seats_booked > COALESCE(t.available_seats, 0) THEN
      RAISE EXCEPTION 'not_enough_seats';
    END IF;
  END IF;

  RETURN NEW;
END
$$;

-- Sync: recompute booked seat counter and flip trip full/published automatically
CREATE OR REPLACE FUNCTION public.ukhiya_go_sync_trip_seats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid;
  booked int;
  cap int;
BEGIN
  target := COALESCE(NEW.trip_id, OLD.trip_id);
  SELECT COALESCE(SUM(seats_booked), 0) INTO booked
    FROM public.ukhiya_go_bookings
   WHERE trip_id = target AND status = 'confirmed';
  SELECT available_seats INTO cap FROM public.ukhiya_go_trips WHERE id = target;
  UPDATE public.ukhiya_go_trips
     SET booked_seats = booked,
         status = CASE
           WHEN status IN ('published', 'full') AND booked >= COALESCE(cap, 0)
             THEN 'full'::public.ukhiya_go_trip_status
           WHEN status IN ('published', 'full') AND booked < COALESCE(cap, 0)
             THEN 'published'::public.ukhiya_go_trip_status
           ELSE status
         END
   WHERE id = target;
  RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS trg_ukhiya_go_booking_guard ON public.ukhiya_go_bookings;
CREATE TRIGGER trg_ukhiya_go_booking_guard
  BEFORE INSERT OR UPDATE ON public.ukhiya_go_bookings
  FOR EACH ROW EXECUTE FUNCTION public.ukhiya_go_booking_guard();

DROP TRIGGER IF EXISTS trg_ukhiya_go_sync_seats ON public.ukhiya_go_bookings;
CREATE TRIGGER trg_ukhiya_go_sync_seats
  AFTER INSERT OR UPDATE OR DELETE ON public.ukhiya_go_bookings
  FOR EACH ROW EXECUTE FUNCTION public.ukhiya_go_sync_trip_seats();

GRANT EXECUTE ON FUNCTION public.ukhiya_go_booking_guard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ukhiya_go_sync_trip_seats() TO authenticated;