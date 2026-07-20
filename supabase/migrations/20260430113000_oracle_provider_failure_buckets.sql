alter table public.oracle_provider_events
  add column if not exists failure_bucket text,
  add column if not exists failure_stage text;
