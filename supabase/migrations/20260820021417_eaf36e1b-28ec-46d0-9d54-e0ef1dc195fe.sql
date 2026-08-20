ALTER TYPE public.ukhiya_go_vehicle_type ADD VALUE IF NOT EXISTS 'noah';
ALTER TYPE public.ukhiya_go_vehicle_type ADD VALUE IF NOT EXISTS 'hiace';
ALTER TYPE public.ukhiya_go_vehicle_type ADD VALUE IF NOT EXISTS 'rickshaw';

ALTER TABLE public.ukhiya_go_drivers
  ADD COLUMN IF NOT EXISTS service_areas text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS services text[] NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS idx_ukhiya_go_drivers_user_id_unique
  ON public.ukhiya_go_drivers (user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.ukhiya_go_guard_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.verification_status := 'pending';
    IF TG_TABLE_NAME = 'ukhiya_go_drivers' THEN
      NEW.verified_at := NULL;
      NEW.verified_by := NULL;
      NEW.admin_note := NULL;
    END IF;
    RETURN NEW;
  END IF;

  NEW.verification_status := OLD.verification_status;
  IF TG_TABLE_NAME = 'ukhiya_go_drivers' THEN
    NEW.verified_at := OLD.verified_at;
    NEW.verified_by := OLD.verified_by;
    NEW.admin_note := OLD.admin_note;
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.ukhiya_go_guard_verification() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_ukhiya_go_drivers_guard ON public.ukhiya_go_drivers;
CREATE TRIGGER trg_ukhiya_go_drivers_guard
  BEFORE INSERT OR UPDATE ON public.ukhiya_go_drivers
  FOR EACH ROW EXECUTE FUNCTION public.ukhiya_go_guard_verification();

DROP TRIGGER IF EXISTS trg_ukhiya_go_vehicles_guard ON public.ukhiya_go_vehicles;
CREATE TRIGGER trg_ukhiya_go_vehicles_guard
  BEFORE INSERT OR UPDATE ON public.ukhiya_go_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.ukhiya_go_guard_verification();