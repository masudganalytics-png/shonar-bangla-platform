ALTER TABLE public.govt_workers ALTER COLUMN user_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_govt_workers_user_id_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_govt_workers_user_id_unique
      ON public.govt_workers (user_id) WHERE user_id IS NOT NULL;
  END IF;
END $$;