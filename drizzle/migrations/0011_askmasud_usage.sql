CREATE TABLE public.askmasud_usage (
  usage_key text NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (usage_key, day)
);
GRANT ALL ON public.askmasud_usage TO service_role;
ALTER TABLE public.askmasud_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.askmasud_consume(_key text, _limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c integer;
BEGIN
  INSERT INTO public.askmasud_usage(usage_key, day, count)
  VALUES (_key, (now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (usage_key, day) DO UPDATE SET count = askmasud_usage.count + 1
  WHERE askmasud_usage.count < _limit
  RETURNING count INTO c;
  RETURN c IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.askmasud_consume(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.askmasud_consume(text, integer) TO service_role;