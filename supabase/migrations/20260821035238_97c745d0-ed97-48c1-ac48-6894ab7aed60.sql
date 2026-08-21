DO $$
DECLARE
  t text;
  sensitive text[];
  cols text;
  pairs jsonb := '{
    "blood_donors": ["phone","whatsapp","address"],
    "blood_requests": ["phone","whatsapp"],
    "teachers": ["phone","whatsapp","email"],
    "workers": ["phone","whatsapp"]
  }'::jsonb;
BEGIN
  FOR t IN SELECT jsonb_object_keys(pairs) LOOP
    SELECT array_agg(value::text) INTO sensitive FROM jsonb_array_elements_text(pairs -> t) AS value;
    SELECT string_agg(quote_ident(a.attname), ', ')
      INTO cols
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = t
       AND a.attnum > 0 AND NOT a.attisdropped
       AND NOT (a.attname = ANY (sensitive));
    EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT (%s) ON public.%I TO anon', cols, t);
  END LOOP;
END $$;