-- ============================================================================
-- CREATE POLLS TABLES
-- Migration: 20240202_create_polls_tables
-- Description: Creates polls, poll_options, and poll_votes tables for thread polls
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. POLLS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.polls (
  id TEXT PRIMARY KEY DEFAULT 'poll-' || gen_random_uuid()::text,
  thread_id TEXT NOT NULL UNIQUE REFERENCES public.threads(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  total_votes INTEGER NOT NULL DEFAULT 0,
  ends_at TIMESTAMPTZ NOT NULL,
  is_multiple_choice BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_polls_thread ON public.polls(thread_id);
CREATE INDEX IF NOT EXISTS idx_polls_ends_at ON public.polls(ends_at);

COMMENT ON TABLE public.polls IS 'Polls attached to threads';
COMMENT ON COLUMN public.polls.is_multiple_choice IS 'Whether users can select multiple options';

-- ============================================================================
-- 2. POLL OPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.poll_options (
  id TEXT PRIMARY KEY DEFAULT 'option-' || gen_random_uuid()::text,
  poll_id TEXT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON public.poll_options(poll_id);

COMMENT ON TABLE public.poll_options IS 'Options for polls';

-- ============================================================================
-- 3. POLL VOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id TEXT PRIMARY KEY DEFAULT 'vote-' || gen_random_uuid()::text,
  poll_id TEXT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(poll_id, option_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON public.poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option ON public.poll_votes(option_id);

COMMENT ON TABLE public.poll_votes IS 'User votes on poll options';

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Function to update poll vote counts
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment option votes
    UPDATE public.poll_options
    SET votes = votes + 1
    WHERE id = NEW.option_id;
    
    -- Increment total poll votes
    UPDATE public.polls
    SET total_votes = total_votes + 1
    WHERE id = NEW.poll_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement option votes
    UPDATE public.poll_options
    SET votes = votes - 1
    WHERE id = OLD.option_id;
    
    -- Decrement total poll votes
    UPDATE public.polls
    SET total_votes = total_votes - 1
    WHERE id = OLD.poll_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update vote counts
DROP TRIGGER IF EXISTS trigger_update_poll_votes ON public.poll_votes;
CREATE TRIGGER trigger_update_poll_votes
  AFTER INSERT OR DELETE ON public.poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_vote_counts();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls Policies
CREATE POLICY "Anyone can view polls"
  ON public.polls FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create polls"
  ON public.polls FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Poll Options Policies
CREATE POLICY "Anyone can view poll options"
  ON public.poll_options FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create poll options"
  ON public.poll_options FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Poll Votes Policies
CREATE POLICY "Anyone can view poll votes"
  ON public.poll_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.poll_votes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.poll_votes FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.polls TO authenticated;
GRANT SELECT ON public.polls TO anon;
GRANT INSERT ON public.polls TO authenticated;

GRANT SELECT ON public.poll_options TO authenticated;
GRANT SELECT ON public.poll_options TO anon;
GRANT INSERT ON public.poll_options TO authenticated;

GRANT SELECT ON public.poll_votes TO authenticated;
GRANT SELECT ON public.poll_votes TO anon;
GRANT INSERT, DELETE ON public.poll_votes TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('polls', 'poll_options', 'poll_votes');

-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_poll_votes';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('polls', 'poll_options', 'poll_votes');
