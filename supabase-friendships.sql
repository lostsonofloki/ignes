-- ============================================
-- Friendships Table for The Matchmaker (v1.8.0)
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.friendships CASCADE;

-- Create friendships table with explicit foreign key constraint names
CREATE TABLE public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT friendships_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT friendships_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT friendships_sender_receiver_unique UNIQUE(sender_id, receiver_id)
);

-- Create indexes for performance
CREATE INDEX idx_friendships_sender_id ON public.friendships(sender_id);
CREATE INDEX idx_friendships_receiver_id ON public.friendships(receiver_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);
CREATE INDEX idx_friendships_sender_status ON public.friendships(sender_id, status);
CREATE INDEX idx_friendships_receiver_status ON public.friendships(receiver_id, status);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can accept/decline friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete friendships" ON public.friendships;

CREATE POLICY "Users can view own friendships"
  ON public.friendships
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
  ON public.friendships
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can accept/decline friend requests"
  ON public.friendships
  FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Users can delete friendships"
  ON public.friendships
  FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================
-- Profiles email column for friend search
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

DROP POLICY IF EXISTS "Users can view other users' profiles" ON public.profiles;
CREATE POLICY "Users can view other users' profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Backfill emails from auth.users
UPDATE public.profiles p SET email = au.email
FROM auth.users au WHERE p.id = au.id AND p.email IS NULL;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE public.friendships IS 'Social connections for The Matchmaker feature';
COMMENT ON COLUMN public.friendships.sender_id IS 'User who sent the friend request';
COMMENT ON COLUMN public.friendships.receiver_id IS 'User who received the friend request';
COMMENT ON COLUMN public.friendships.status IS 'Status: pending, accepted, or declined';
