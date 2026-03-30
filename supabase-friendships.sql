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
-- Add username column to profiles (from auth.users.email)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT;
  END IF;
END $$;

-- Create index on profiles username for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Allow users to view other users' profiles (needed for friend search)
DROP POLICY IF EXISTS "Users can view other users' profiles" ON public.profiles;
CREATE POLICY "Users can view other users' profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- ============================================
-- Sync profiles.username from auth.users.email (extract username from email)
-- ============================================

-- Function to extract username from email
CREATE OR REPLACE FUNCTION public.extract_username_from_email(email_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN SPLIT_PART(SPLIT_PART(email_text, '@', 1), '.', 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing profiles with username from email
UPDATE public.profiles p 
SET username = public.extract_username_from_email(au.email)
FROM auth.users au 
WHERE p.id = au.id AND (p.username IS NULL OR p.username = '');

-- ============================================
-- Auto-sync username on user creation
-- ============================================

-- Function to sync username on new user creation
CREATE OR REPLACE FUNCTION public.sync_profile_username()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    public.extract_username_from_email(NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    username = public.extract_username_from_email(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-sync username on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_username ON auth.users;
CREATE TRIGGER on_auth_user_created_username
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_username();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE public.friendships IS 'Social connections for The Matchmaker feature';
COMMENT ON COLUMN public.friendships.sender_id IS 'User who sent the friend request';
COMMENT ON COLUMN public.friendships.receiver_id IS 'User who received the friend request';
COMMENT ON COLUMN public.friendships.status IS 'Status: pending, accepted, or declined';
