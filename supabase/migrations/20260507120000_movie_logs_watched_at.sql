-- Optional watch date for calendar / Year in Review (hybrid with created_at in app).
-- Apply to remote DB with: supabase db push / migration run.
ALTER TABLE public.movie_logs
  ADD COLUMN IF NOT EXISTS watched_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.movie_logs.watched_at IS
  'When the user watched the film; aggregates fall back to created_at when null.';
