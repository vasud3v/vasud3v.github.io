-- ============================================================================
-- Forum Users (public mirror of auth.users + forum-specific fields)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.forum_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  banner TEXT,
  post_count INTEGER NOT NULL DEFAULT 0,
  reputation INTEGER NOT NULL DEFAULT 0,
  join_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_online BOOLEAN NOT NULL DEFAULT false,
  rank TEXT DEFAULT 'Newcomer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'MessageSquare',
  thread_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_sticky BOOLEAN NOT NULL DEFAULT false,
  is_important BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Topics (sub-categories)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.topics (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thread_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_post_by TEXT
);

-- ============================================================================
-- Threads
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.threads (
  id TEXT PRIMARY KEY DEFAULT 't-' || gen_random_uuid()::text,
  title TEXT NOT NULL,
  excerpt TEXT,
  author_id TEXT NOT NULL REFERENCES public.forum_users(id),
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reply_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reply_by_id TEXT REFERENCES public.forum_users(id),
  reply_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_hot BOOLEAN NOT NULL DEFAULT false,
  has_unread BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  is_staff_only BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  trending_score REAL DEFAULT 0,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- Posts (replies within threads)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY DEFAULT 'post-' || gen_random_uuid()::text,
  thread_id TEXT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES public.forum_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  likes INTEGER NOT NULL DEFAULT 0,
  is_answer BOOLEAN NOT NULL DEFAULT false,
  reply_to TEXT,
  signature TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- Post Reactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id),
  emoji TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id, emoji)
);

-- ============================================================================
-- Polls
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.polls (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  thread_id TEXT NOT NULL UNIQUE REFERENCES public.threads(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  total_votes INTEGER NOT NULL DEFAULT 0,
  ends_at TIMESTAMPTZ NOT NULL,
  is_multiple_choice BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  poll_id TEXT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  poll_id TEXT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(poll_id, user_id, option_id)
);

-- ============================================================================
-- Thread Bookmarks
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.thread_bookmarks (
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, thread_id)
);

-- ============================================================================
-- Thread Watches
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.thread_watches (
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, thread_id)
);

-- ============================================================================
-- Thread Votes (up/down)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.thread_votes (
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, thread_id)
);

-- ============================================================================
-- Post Votes (up/down)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.post_votes (
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ============================================================================
-- Thread Read Status
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.thread_reads (
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, thread_id)
);

-- ============================================================================
-- Profile Customizations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profile_customizations (
  user_id TEXT PRIMARY KEY REFERENCES public.forum_users(id) ON DELETE CASCADE,
  custom_avatar TEXT,
  custom_banner TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Reputation Events
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reputation_events (
  id TEXT PRIMARY KEY DEFAULT 'rep-' || gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  thread_id TEXT,
  thread_title TEXT,
  post_id TEXT,
  triggered_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Best Answers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.best_answers (
  thread_id TEXT PRIMARY KEY REFERENCES public.threads(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Forum Stats (singleton row)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.forum_stats (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_threads INTEGER NOT NULL DEFAULT 0,
  total_posts INTEGER NOT NULL DEFAULT 0,
  total_users INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  new_posts_today INTEGER NOT NULL DEFAULT 0,
  newest_member TEXT NOT NULL DEFAULT '',
  online_users INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_threads_category ON public.threads(category_id);
CREATE INDEX IF NOT EXISTS idx_threads_author ON public.threads(author_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_reply ON public.threads(last_reply_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_thread ON public.posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_user ON public.reputation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_created ON public.reputation_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topics_category ON public.topics(category_id);

-- ============================================================================
-- Enable realtime for key tables
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reputation_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
