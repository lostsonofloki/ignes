-- Migration: Add unique constraint to movie_logs for duplicate prevention
-- Run this in Supabase SQL Editor

-- Add unique constraint on (user_id, tmdb_id) to prevent duplicate movie logs per user
-- This is required for the Archive Importer's batch upsert to work correctly

ALTER TABLE movie_logs
ADD CONSTRAINT unique_user_movie UNIQUE (user_id, tmdb_id);

-- Optional: Add index for faster lookups during import
CREATE INDEX IF NOT EXISTS idx_movie_logs_user_tmdb 
ON movie_logs(user_id, tmdb_id);

-- Verify the constraint was added
-- SELECT conname, contype 
-- FROM pg_constraint 
-- WHERE conrelid = 'movie_logs'::regclass;
