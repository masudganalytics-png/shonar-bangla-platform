CREATE OR REPLACE FUNCTION public.probashi_guard_moderation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Trusted server-side (service role) calls and admins may set moderation fields.
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.is_verified := false;
  ELSE
    NEW.is_verified := OLD.is_verified;
    IF OLD.status = 'suspended' THEN
      NEW.status := OLD.status;
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END $function$;