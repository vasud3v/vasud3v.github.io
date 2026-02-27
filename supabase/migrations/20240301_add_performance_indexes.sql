-- ============================================================================
-- Performance Indexes for Optimized Queries
-- ============================================================================
-- This migration adds indexes to speed up common queries

-- Posts table indexes
-- Index for fetching posts by thread (most common query)
CREATE INDEX IF NOT EXISTS idx_posts_thread_id_created_at 
ON posts(thread_id, created_at);

-- Index for post reactions lookup
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id 
ON post_reactions(post_id);

-- Index for post reactions by user (for checking if user reacted)
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id 
ON post_reactions(user_id);

-- Composite index for post reactions (optimal for our query)
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_user 
ON post_reactions(post_id, user_id);

-- Threads table indexes
-- Index for fetching threads by category
CREATE INDEX IF NOT EXISTS idx_threads_category_pinned_reply 
ON threads(category_id, is_pinned DESC, last_reply_at DESC);

-- Index for thread votes
CREATE INDEX IF NOT EXISTS idx_thread_votes_thread_id 
ON thread_votes(thread_id);

-- Index for post votes
CREATE INDEX IF NOT EXISTS idx_post_votes_post_id 
ON post_votes(post_id);

-- Forum users index for lookups
CREATE INDEX IF NOT EXISTS idx_forum_users_username 
ON forum_users(username);

-- Topics index for category lookup
CREATE INDEX IF NOT EXISTS idx_topics_category_id 
ON topics(category_id);

-- Reputation events index
CREATE INDEX IF NOT EXISTS idx_reputation_events_user_id 
ON reputation_events(user_id, created_at DESC);

-- Thread bookmarks index
CREATE INDEX IF NOT EXISTS idx_thread_bookmarks_user_thread 
ON thread_bookmarks(user_id, thread_id);

-- Thread watches index
CREATE INDEX IF NOT EXISTS idx_thread_watches_user_thread 
ON thread_watches(user_id, thread_id);

-- Post bookmarks index (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_bookmarks') THEN
        CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user_post 
        ON post_bookmarks(user_id, post_id);
    END IF;
END $$;

-- ============================================================================
-- Analyze tables to update statistics
-- ============================================================================
ANALYZE posts;
ANALYZE post_reactions;
ANALYZE threads;
ANALYZE thread_votes;
ANALYZE post_votes;
ANALYZE forum_users;
ANALYZE topics;
ANALYZE categories;
ANALYZE reputation_events;
ANALYZE thread_bookmarks;
ANALYZE thread_watches;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON INDEX idx_posts_thread_id_created_at IS 'Optimizes fetching posts for a thread ordered by creation time';
COMMENT ON INDEX idx_post_reactions_post_id IS 'Optimizes fetching reactions for posts';
COMMENT ON INDEX idx_post_reactions_post_user IS 'Optimizes checking if user reacted to post';
COMMENT ON INDEX idx_threads_category_pinned_reply IS 'Optimizes fetching threads for category with pinned first';
COMMENT ON INDEX idx_thread_votes_thread_id IS 'Optimizes counting votes for threads';
COMMENT ON INDEX idx_post_votes_post_id IS 'Optimizes counting votes for posts';
