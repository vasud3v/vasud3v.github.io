-- Fix RLS policies to use (select auth.uid()) instead of auth.uid()
-- This prevents re-evaluation for each row

-- ============================================================================
-- Fix thread_bookmarks RLS policies
-- ============================================================================

DROP POLICY IF EXISTS thread_bookmarks_select ON thread_bookmarks;
DROP POLICY IF EXISTS thread_bookmarks_insert ON thread_bookmarks;
DROP POLICY IF EXISTS thread_bookmarks_delete ON thread_bookmarks;

CREATE POLICY thread_bookmarks_select ON thread_bookmarks
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY thread_bookmarks_insert ON thread_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY thread_bookmarks_delete ON thread_bookmarks
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- ============================================================================
-- Fix post_bookmarks RLS policies - remove duplicates and optimize
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can view their own post bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can insert their own post bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own post bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS post_bookmarks_select ON post_bookmarks;
DROP POLICY IF EXISTS post_bookmarks_insert ON post_bookmarks;
DROP POLICY IF EXISTS post_bookmarks_delete ON post_bookmarks;

-- Create single optimized policy for each action
CREATE POLICY post_bookmarks_select ON post_bookmarks
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY post_bookmarks_insert ON post_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY post_bookmarks_delete ON post_bookmarks
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- ============================================================================
-- Fix duplicate indexes
-- ============================================================================

-- Drop duplicate index on post_reactions (keep idx_post_reactions_post_id)
DROP INDEX IF EXISTS idx_post_reactions_post;

-- Drop duplicate index on topics (keep idx_topics_category_id)
DROP INDEX IF EXISTS idx_topics_category;

-- ============================================================================
-- Note on unused indexes
-- ============================================================================
-- The database linter reports many unused indexes. These are kept for now because:
-- 1. The application is still in development/early stages
-- 2. These indexes will be useful as data volume grows
-- 3. They support common query patterns (user lookups, filtering, sorting)
-- 4. The storage overhead is minimal compared to the query performance benefits
--
-- Indexes to monitor and potentially remove if truly unused after production use:
-- - idx_post_reactions_post_id, idx_post_reactions_post_user
-- - idx_threads_category_pinned_reply, idx_threads_last_reply_at
-- - idx_forum_users_username, idx_forum_users_is_online, idx_forum_users_reputation
-- - idx_thread_bookmarks_user_thread, idx_thread_bookmarks_thread_id
-- - idx_post_bookmarks_user, idx_post_bookmarks_folder, idx_post_bookmarks_post_id
-- - Various other foreign key and filtering indexes
--
-- Recommendation: Re-evaluate after 6 months of production use with real query patterns
