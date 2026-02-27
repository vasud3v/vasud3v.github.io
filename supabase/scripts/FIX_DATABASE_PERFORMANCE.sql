-- ============================================================================
-- FIX DATABASE PERFORMANCE ISSUES
-- ============================================================================
-- Your database is timing out on queries. This SQL will fix it.
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. DISABLE RLS ON BOOKMARKS (fixes bookmark issue)
-- ============================================================================
ALTER TABLE thread_bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE thread_watches DISABLE ROW LEVEL SECURITY;

-- 2. CHECK IF profile_customizations TABLE EXISTS
-- ============================================================================
-- If this table doesn't exist, create it
CREATE TABLE IF NOT EXISTS profile_customizations (
    user_id TEXT PRIMARY KEY REFERENCES forum_users(id) ON DELETE CASCADE,
    custom_avatar TEXT,
    custom_banner TEXT,
    page_size INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ADD INDEXES FOR PERFORMANCE
-- ============================================================================
-- These indexes will speed up queries significantly

-- Index on forum_users for common queries
CREATE INDEX IF NOT EXISTS idx_forum_users_is_online ON forum_users(is_online);
CREATE INDEX IF NOT EXISTS idx_forum_users_reputation ON forum_users(reputation DESC);

-- Index on threads for common queries
CREATE INDEX IF NOT EXISTS idx_threads_category_id ON threads(category_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_reply_at ON threads(last_reply_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_is_pinned ON threads(is_pinned);

-- Index on posts for thread queries
CREATE INDEX IF NOT EXISTS idx_posts_thread_id ON posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);

-- Index on bookmarks and watches
CREATE INDEX IF NOT EXISTS idx_thread_bookmarks_user_id ON thread_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_bookmarks_thread_id ON thread_bookmarks(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_watches_user_id ON thread_watches(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_watches_thread_id ON thread_watches(thread_id);

-- 4. DISABLE RLS ON profile_customizations (if it exists)
-- ============================================================================
ALTER TABLE profile_customizations DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DONE! This should fix:
-- - 500 errors
-- - Statement timeouts
-- - Bookmark issues
-- - Slow queries
-- ============================================================================
