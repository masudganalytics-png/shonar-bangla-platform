CREATE TABLE public.cv_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_cv_id text NOT NULL,
  edit_token text NOT NULL,
  cv_name text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  job_title text NOT NULL DEFAULT '',
  template text NOT NULL DEFAULT 'government',
  language text NOT NULL DEFAULT 'English',
  status text NOT NULL DEFAULT 'draft',
  completion int NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cv_submissions_client_cv_id_key UNIQUE (client_cv_id)
);

CREATE INDEX cv_submissions_created_at_idx ON public.cv_submissions (created_at DESC);
CREATE INDEX cv_submissions_status_idx ON public.cv_submissions (status);

GRANT ALL ON public.cv_submissions TO service_role;

ALTER TABLE public.cv_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cv submissions"
  ON public.cv_submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cv submissions"
  ON public.cv_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cv submissions"
  ON public.cv_submissions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER cv_submissions_set_updated_at
  BEFORE UPDATE ON public.cv_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();