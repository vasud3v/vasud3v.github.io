-- Performance optimizations for Supabase linter warnings
-- These are OPTIONAL optimizations, not critical security issues

-- ============================================================================
-- 1. Remove duplicate indexes (saves storage and improves write performance)
-- ============================================================================

-- Posts table - keep the more descriptive index names
DROP INDEX IF EXISTS public.idx_posts_author;
DROP INDEX IF EXISTS public.idx_posts_thread;

-- Reputation events table
DROP INDEX IF EXISTS public.idx_reputation_events_user;

-- Threads table
DROP INDEX IF EXISTS public.idx_threads_category;
DROP INDEX IF EXISTS public.idx_threads_last_reply;

-- ============================================================================
-- 2. Optimize RLS policies with (SELECT auth.uid())
-- ============================================================================
-- This prevents re-evaluation of auth.uid() for each row
-- Only fixing a few critical ones - you have 70+ policies to optimize

-- Example: Optimize post_views policy we just created
DROP POLICY IF EXISTS "Authenticated users can insert views" ON public.post_views;
CREATE POLICY "Authenticated users can insert views"
ON public.post_views
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid())::text = user_id OR user_id IS NULL);

-- Optimize post_bookmarks policies
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.post_bookmarks;
CREATE POLICY "Users can view their own bookmarks"
ON public.post_bookmarks FOR SELECT
USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.post_bookmarks;
CREATE POLICY "Users can create their own bookmarks"
ON public.post_bookmarks FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.post_bookmarks;
CREATE POLICY "Users can delete their own bookmarks"
ON public.post_bookmarks FOR DELETE
USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can update their own bookmarks" ON public.post_bookmarks;
CREATE POLICY "Users can update their own bookmarks"
ON public.post_bookmarks FOR UPDATE
USING ((SELECT auth.uid())::text = user_id);

-- ============================================================================
-- 3. Consolidate duplicate policies
-- ============================================================================

-- Thread bookmarks - remove duplicate policies, keep the newer ones
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.thread_bookmarks;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.thread_bookmarks;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.thread_bookmarks;

-- Thread watches - remove duplicate policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.thread_watches;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.thread_watches;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.thread_watches;

-- Poll-related duplicate policies - keep the descriptive ones
DROP POLICY IF EXISTS "polls_insert" ON public.polls;
DROP POLICY IF EXISTS "poll_options_insert" ON public.poll_options;
DROP POLICY IF EXISTS "poll_options_select" ON public.poll_options;
DROP POLICY IF EXISTS "poll_votes_insert" ON public.poll_votes;
DROP POLICY IF EXISTS "poll_votes_select" ON public.poll_votes;

-- ============================================================================
-- NOTES
-- ============================================================================

-- The remaining 60+ auth_rls_initplan warnings can be fixed by wrapping
-- auth.uid() calls with (SELECT auth.uid()) in each policy.
-- 
-- This is tedious but improves performance at scale. The pattern is:
--   BEFORE: auth.uid()::text = user_id
--   AFTER:  (SELECT auth.uid())::text = user_id
--
-- You can do this gradually as needed, or generate a comprehensive script
-- by querying pg_policies and recreating each policy with the optimization.

-- ============================================================================
-- Verification
-- ============================================================================

-- Check for remaining duplicate indexes
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname IN (
        'idx_posts_author',
        'idx_posts_thread',
        'idx_reputation_events_user',
        'idx_threads_category',
        'idx_threads_last_reply'
    );

-- Check policies were updated
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('post_views', 'post_bookmarks', 'thread_bookmarks', 'thread_watches')
ORDER BY tablename, policyname;
