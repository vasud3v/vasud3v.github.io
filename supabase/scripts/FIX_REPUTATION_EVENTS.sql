-- ============================================================================
-- FIX REPUTATION EVENTS TABLE AND RLS
-- ============================================================================

-- Check if reputation_events table exists, if not create it
CREATE TABLE IF NOT EXISTS public.reputation_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reputation_events_user_id ON public.reputation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_created_at ON public.reputation_events(created_at);

-- Add RLS policies
DROP POLICY IF EXISTS "reputation_events_select" ON public.reputation_events;
CREATE POLICY "reputation_events_select" ON public.reputation_events 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "reputation_events_insert" ON public.reputation_events;
CREATE POLICY "reputation_events_insert" ON public.reputation_events 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Enable RLS
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;

-- Verify the table exists
SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE tablename = 'reputation_events';

-- Verify policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'reputation_events';
