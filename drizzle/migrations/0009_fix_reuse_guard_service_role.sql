CREATE OR REPLACE FUNCTION public.reuse_listings_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin')
                      OR coalesce(auth.jwt() ->> 'role', '') = 'service_role';
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT is_admin THEN
      NEW.status := 'pending';
      NEW.admin_note := NULL;
    END IF;
    IF NEW.listing_type = 'donation' THEN NEW.price := NULL; END IF;
    RETURN NEW;
  END IF;

  IF NOT is_admin THEN
    NEW.user_id := OLD.user_id;
    NEW.admin_note := OLD.admin_note;
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status NOT IN ('sold','donated','hidden','pending') THEN
      NEW.status := OLD.status;
    END IF;
    -- Editing content of an approved listing sends it back for review.
    IF OLD.status = 'approved' AND NEW.status = 'approved' AND (
         NEW.title IS DISTINCT FROM OLD.title OR
         NEW.description IS DISTINCT FROM OLD.description OR
         NEW.category IS DISTINCT FROM OLD.category OR
         NEW.price IS DISTINCT FROM OLD.price OR
         NEW.image_url IS DISTINCT FROM OLD.image_url
       ) THEN
      NEW.status := 'pending';
    END IF;
  END IF;

  IF NEW.listing_type = 'donation' THEN NEW.price := NULL; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;