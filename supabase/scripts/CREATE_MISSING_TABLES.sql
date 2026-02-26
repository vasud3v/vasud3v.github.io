-- ============================================================================
-- CREATE ALL MISSING TABLES WITH RLS POLICIES
-- ============================================================================

-- Reputation Events
CREATE TABLE IF NOT EXISTS public.reputation_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reputation_events_user_id ON public.reputation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_created_at ON public.reputation_events(created_at);

-- Thread Bookmarks
CREATE TABLE IF NOT EXISTS public.thread_bookmarks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  thread_id TEXT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_bookmarks_user_id ON public.thread_bookmarks(user_id);

-- Thread Watches
CREATE TABLE IF NOT EXISTS public.thread_watches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  thread_id TEXT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_watches_user_id ON public.thread_watches(user_id);

-- Thread Reads
CREATE TABLE IF NOT EXISTS public.thread_reads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  thread_id TEXT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_reads_user_id ON public.thread_reads(user_id);

-- Thread Votes
CREATE TABLE IF NOT EXISTS public.thread_votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  thread_id TEXT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_votes_thread_id ON public.thread_votes(thread_id);

-- Post Votes
CREATE TABLE IF NOT EXISTS public.post_votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON public.post_votes(post_id);

-- Profile Customizations
CREATE TABLE IF NOT EXISTS public.profile_customizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE REFERENCES public.forum_users(id) ON DELETE CASCADE,
  custom_avatar TEXT,
  custom_banner TEXT,
  page_size INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ADD RLS POLICIES FOR ALL TABLES
-- ============================================================================

-- Reputation Events
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reputation_events_select" ON public.reputation_events;
CREATE POLICY "reputation_events_select" ON public.reputation_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "reputation_events_insert" ON public.reputation_events;
CREATE POLICY "reputation_events_insert" ON public.reputation_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Thread Bookmarks
ALTER TABLE public.thread_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "thread_bookmarks_select" ON public.thread_bookmarks;
CREATE POLICY "thread_bookmarks_select" ON public.thread_bookmarks FOR SELECT USING (true);
DROP POLICY IF EXISTS "thread_bookmarks_insert" ON public.thread_bookmarks;
CREATE POLICY "thread_bookmarks_insert" ON public.thread_bookmarks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "thread_bookmarks_delete" ON public.thread_bookmarks;
CREATE POLICY "thread_bookmarks_delete" ON public.thread_bookmarks FOR DELETE USING (auth.uid()::text = user_id);

-- Thread Watches
ALTER TABLE public.thread_watches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "thread_watches_select" ON public.thread_watches;
CREATE POLICY "thread_watches_select" ON public.thread_watches FOR SELECT USING (true);
DROP POLICY IF EXISTS "thread_watches_insert" ON public.thread_watches;
CREATE POLICY "thread_watches_insert" ON public.thread_watches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "thread_watches_delete" ON public.thread_watches;
CREATE POLICY "thread_watches_delete" ON public.thread_watches FOR DELETE USING (auth.uid()::text = user_id);

-- Thread Reads
ALTER TABLE public.thread_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "thread_reads_select" ON public.thread_reads;
CREATE POLICY "thread_reads_select" ON public.thread_reads FOR SELECT USING (true);
DROP POLICY IF EXISTS "thread_reads_insert" ON public.thread_reads;
CREATE POLICY "thread_reads_insert" ON public.thread_reads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "thread_reads_update" ON public.thread_reads;
CREATE POLICY "thread_reads_update" ON public.thread_reads FOR UPDATE USING (auth.uid()::text = user_id);

-- Thread Votes
ALTER TABLE public.thread_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "thread_votes_select" ON public.thread_votes;
CREATE POLICY "thread_votes_select" ON public.thread_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "thread_votes_insert" ON public.thread_votes;
CREATE POLICY "thread_votes_insert" ON public.thread_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "thread_votes_update" ON public.thread_votes;
CREATE POLICY "thread_votes_update" ON public.thread_votes FOR UPDATE USING (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "thread_votes_delete" ON public.thread_votes;
CREATE POLICY "thread_votes_delete" ON public.thread_votes FOR DELETE USING (auth.uid()::text = user_id);

-- Post Votes
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "post_votes_select" ON public.post_votes;
CREATE POLICY "post_votes_select" ON public.post_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "post_votes_insert" ON public.post_votes;
CREATE POLICY "post_votes_insert" ON public.post_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "post_votes_update" ON public.post_votes;
CREATE POLICY "post_votes_update" ON public.post_votes FOR UPDATE USING (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "post_votes_delete" ON public.post_votes;
CREATE POLICY "post_votes_delete" ON public.post_votes FOR DELETE USING (auth.uid()::text = user_id);

-- Profile Customizations
ALTER TABLE public.profile_customizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profile_customizations_select" ON public.profile_customizations;
CREATE POLICY "profile_customizations_select" ON public.profile_customizations FOR SELECT USING (true);
DROP POLICY IF EXISTS "profile_customizations_insert" ON public.profile_customizations;
CREATE POLICY "profile_customizations_insert" ON public.profile_customizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "profile_customizations_update" ON public.profile_customizations;
CREATE POLICY "profile_customizations_update" ON public.profile_customizations FOR UPDATE USING (auth.uid()::text = user_id);

-- ============================================================================
-- VERIFY TABLES AND POLICIES
-- ============================================================================

SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE tablename IN (
  'reputation_events',
  'thread_bookmarks', 
  'thread_watches',
  'thread_reads',
  'thread_votes',
  'post_votes',
  'profile_customizations'
)
ORDER BY tablename;

SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN (
  'reputation_events',
  'thread_bookmarks',
  'thread_watches', 
  'thread_reads',
  'thread_votes',
  'post_votes',
  'profile_customizations'
)
GROUP BY tablename
ORDER BY tablename;
