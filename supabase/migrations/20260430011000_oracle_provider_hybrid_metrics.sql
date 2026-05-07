alter table public.oracle_provider_events
  add column if not exists input_recommendation_count integer,
  add column if not exists post_filter_recommendation_count integer,
  add column if not exists dedupe_dropped_count integer,
  add column if not exists rejected_violation_attempt_count integer,
  add column if not exists provider_attempt_count integer,
  add column if not exists fallback_depth integer,
  add column if not exists provider_attempts jsonb not null default '[]'::jsonb;
