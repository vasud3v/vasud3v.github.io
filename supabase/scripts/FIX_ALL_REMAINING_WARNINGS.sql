-- Comprehensive fix for ALL remaining Supabase linter warnings
-- This script optimizes all RLS policies and adds missing indexes

-- ============================================================================
-- 1. Remove remaining duplicate policies
-- ============================================================================

-- Remove duplicate poll policies (keep the descriptive ones)
DROP POLICY IF EXISTS "polls_select" ON public.polls;
DROP POLICY IF EXISTS "poll_options_select" ON public.poll_options;
DROP POLICY IF EXISTS "poll_votes_select" ON public.poll_votes;

-- Consolidate post_reports SELECT policies into one
DROP POLICY IF EXISTS "Users can view their own reports" ON public.post_reports;
DROP POLICY IF EXISTS "Moderators can view all reports" ON public.post_reports;

CREATE POLICY "Users and moderators can view reports"
ON public.post_reports FOR SELECT
USING (
  (SELECT auth.uid())::text = reporter_id 
  OR EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator', 'moderator')
  )
);

-- ============================================================================
-- 2. Optimize ALL RLS policies with (SELECT auth.uid())
-- ============================================================================

-- Forum Users policies
DROP POLICY IF EXISTS "forum_users_insert" ON public.forum_users;
CREATE POLICY "forum_users_insert"
ON public.forum_users FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = id);

DROP POLICY IF EXISTS "forum_users_update" ON public.forum_users;
CREATE POLICY "forum_users_update"
ON public.forum_users FOR UPDATE
USING ((SELECT auth.uid())::text = id);

-- Categories policies
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
CREATE POLICY "categories_insert"
ON public.categories FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator')
  )
);

DROP POLICY IF EXISTS "categories_update" ON public.categories;
CREATE POLICY "categories_update"
ON public.categories FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator')
  )
);

DROP POLICY IF EXISTS "categories_delete" ON public.categories;
CREATE POLICY "categories_delete"
ON public.categories FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator')
  )
);

-- Threads policies
DROP POLICY IF EXISTS "threads_insert" ON public.threads;
CREATE POLICY "threads_insert"
ON public.threads FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = author_id);

DROP POLICY IF EXISTS "threads_update" ON public.threads;
CREATE POLICY "threads_update"
ON public.threads FOR UPDATE
USING (
  (SELECT auth.uid())::text = author_id
  OR EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator', 'moderator')
  )
);

DROP POLICY IF EXISTS "threads_delete" ON public.threads;
CREATE POLICY "threads_delete"
ON public.threads FOR DELETE
USING (
  (SELECT auth.uid())::text = author_id
  OR EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator', 'moderator')
  )
);

-- Posts policies
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
CREATE POLICY "posts_insert"
ON public.posts FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = author_id);

DROP POLICY IF EXISTS "posts_update" ON public.posts;
CREATE POLICY "posts_update"
ON public.posts FOR UPDATE
USING (
  (SELECT auth.uid())::text = author_id
  OR EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator', 'moderator')
  )
);

DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_delete"
ON public.posts FOR DELETE
USING (
  (SELECT auth.uid())::text = author_id
  OR EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator', 'moderator')
  )
);

-- Post reactions policies
DROP POLICY IF EXISTS "post_reactions_insert" ON public.post_reactions;
CREATE POLICY "post_reactions_insert"
ON public.post_reactions FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "post_reactions_delete" ON public.post_reactions;
CREATE POLICY "post_reactions_delete"
ON public.post_reactions FOR DELETE
USING ((SELECT auth.uid())::text = user_id);

-- Post votes policies
DROP POLICY IF EXISTS "post_votes_insert" ON public.post_votes;
CREATE POLICY "post_votes_insert"
ON public.post_votes FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "post_votes_update" ON public.post_votes;
CREATE POLICY "post_votes_update"
ON public.post_votes FOR UPDATE
USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "post_votes_delete" ON public.post_votes;
CREATE POLICY "post_votes_delete"
ON public.post_votes FOR DELETE
USING ((SELECT auth.uid())::text = user_id);

-- Thread votes policies
DROP POLICY IF EXISTS "thread_votes_insert" ON public.thread_votes;
CREATE POLICY "thread_votes_insert"
ON public.thread_votes FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "thread_votes_update" ON public.thread_votes;
CREATE POLICY "thread_votes_update"
ON public.thread_votes FOR UPDATE
USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "thread_votes_delete" ON public.thread_votes;
CREATE POLICY "thread_votes_delete"
ON public.thread_votes FOR DELETE
USING ((SELECT auth.uid())::text = user_id);

-- Thread bookmarks policies
DROP POLICY IF EXISTS "thread_bookmarks_insert" ON public.thread_bookmarks;
CREATE POLICY "thread_bookmarks_insert"
ON public.thread_bookmarks FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "thread_bookmarks_delete" ON public.thread_bookmarks;
CREATE POLICY "thread_bookmarks_delete"
ON public.thread_bookmarks FOR DELETE
USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "thread_bookmarks_select" ON public.thread_bookmarks;
CREATE POLICY "thread_bookmarks_select"
ON public.thread_bookmarks FOR SELECT
USING ((SELECT auth.uid())::text = user_id);

-- Thread watches policies
DROP POLICY IF EXISTS "thread_watches_insert" ON public.thread_watches;
CREATE POLICY "thread_watches_insert"
ON public.thread_watches FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "thread_watches_delete" ON public.thread_watches;
CREATE POLICY "thread_watches_delete"
ON public.thread_watches FOR DELETE
USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "thread_watches_select" ON public.thread_watches;
CREATE POLICY "thread_watches_select"
ON public.thread_watches FOR SELECT
USING ((SELECT auth.uid())::text = user_id);

-- Thread reads policies
DROP POLICY IF EXISTS "thread_reads_insert" ON public.thread_reads;
CREATE POLICY "thread_reads_insert"
ON public.thread_reads FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "thread_reads_update" ON public.thread_reads;
CREATE POLICY "thread_reads_update"
ON public.thread_reads FOR UPDATE
USING ((SELECT auth.uid())::text = user_id);

-- Best answers policies
DROP POLICY IF EXISTS "best_answers_insert" ON public.best_answers;
CREATE POLICY "best_answers_insert"
ON public.best_answers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.threads t
    WHERE t.id = thread_id
    AND t.author_id = (SELECT auth.uid())::text
  )
);

DROP POLICY IF EXISTS "best_answers_update" ON public.best_answers;
CREATE POLICY "best_answers_update"
ON public.best_answers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.threads t
    WHERE t.id = thread_id
    AND t.author_id = (SELECT auth.uid())::text
  )
);

DROP POLICY IF EXISTS "best_answers_delete" ON public.best_answers;
CREATE POLICY "best_answers_delete"
ON public.best_answers FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.threads t
    WHERE t.id = thread_id
    AND t.author_id = (SELECT auth.uid())::text
  )
);

-- Profile customizations policies
DROP POLICY IF EXISTS "profile_customizations_insert" ON public.profile_customizations;
CREATE POLICY "profile_customizations_insert"
ON public.profile_customizations FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "profile_customizations_update" ON public.profile_customizations;
CREATE POLICY "profile_customizations_update"
ON public.profile_customizations FOR UPDATE
USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "profile_customizations_delete" ON public.profile_customizations;
CREATE POLICY "profile_customizations_delete"
ON public.profile_customizations FOR DELETE
USING ((SELECT auth.uid())::text = user_id);

-- Topics policies
DROP POLICY IF EXISTS "topics_insert" ON public.topics;
CREATE POLICY "topics_insert"
ON public.topics FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator')
  )
);

DROP POLICY IF EXISTS "topics_update" ON public.topics;
CREATE POLICY "topics_update"
ON public.topics FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator')
  )
);

-- Reputation events policies
DROP POLICY IF EXISTS "reputation_events_insert" ON public.reputation_events;
CREATE POLICY "reputation_events_insert"
ON public.reputation_events FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = user_id);

-- Polls policies
DROP POLICY IF EXISTS "Authenticated users can create polls" ON public.polls;
CREATE POLICY "Authenticated users can create polls"
ON public.polls FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.threads t
    WHERE t.id = thread_id
    AND t.author_id = (SELECT auth.uid())::text
  )
);

-- Poll options policies
DROP POLICY IF EXISTS "Authenticated users can create poll options" ON public.poll_options;
CREATE POLICY "Authenticated users can create poll options"
ON public.poll_options FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.threads t ON t.id = p.thread_id
    WHERE p.id = poll_id
    AND t.author_id = (SELECT auth.uid())::text
  )
);

-- Poll votes policies
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.poll_votes;
CREATE POLICY "Authenticated users can vote"
ON public.poll_votes FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own votes" ON public.poll_votes;
CREATE POLICY "Users can delete their own votes"
ON public.poll_votes FOR DELETE
USING ((SELECT auth.uid())::text = user_id);

-- Post reports policies (already consolidated above)
DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.post_reports;
CREATE POLICY "Authenticated users can create reports"
ON public.post_reports FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = reporter_id);

DROP POLICY IF EXISTS "Moderators can update reports" ON public.post_reports;
CREATE POLICY "Moderators can update reports"
ON public.post_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator', 'moderator')
  )
);

-- Post views policies
DROP POLICY IF EXISTS "Users can view their own view history" ON public.post_views;
CREATE POLICY "Users can view their own view history"
ON public.post_views FOR SELECT
USING ((SELECT auth.uid())::text = user_id OR user_id IS NULL);

-- Content reports policies
DROP POLICY IF EXISTS "reports_select" ON public.content_reports;
CREATE POLICY "reports_select"
ON public.content_reports FOR SELECT
USING (
  (SELECT auth.uid())::text = reporter_id
  OR EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator', 'moderator')
  )
);

DROP POLICY IF EXISTS "reports_insert" ON public.content_reports;
CREATE POLICY "reports_insert"
ON public.content_reports FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = reporter_id);

DROP POLICY IF EXISTS "reports_update" ON public.content_reports;
CREATE POLICY "reports_update"
ON public.content_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator', 'moderator')
  )
);

-- Moderation logs policies
DROP POLICY IF EXISTS "modlogs_select" ON public.moderation_logs;
CREATE POLICY "modlogs_select"
ON public.moderation_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator', 'moderator')
  )
);

DROP POLICY IF EXISTS "modlogs_insert" ON public.moderation_logs;
CREATE POLICY "modlogs_insert"
ON public.moderation_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator', 'moderator')
  )
);

-- User warnings policies
DROP POLICY IF EXISTS "warnings_select" ON public.user_warnings;
CREATE POLICY "warnings_select"
ON public.user_warnings FOR SELECT
USING (
  (SELECT auth.uid())::text = user_id
  OR EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator', 'moderator')
  )
);

DROP POLICY IF EXISTS "warnings_insert" ON public.user_warnings;
CREATE POLICY "warnings_insert"
ON public.user_warnings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator', 'moderator')
  )
);

DROP POLICY IF EXISTS "warnings_update" ON public.user_warnings;
CREATE POLICY "warnings_update"
ON public.user_warnings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = (SELECT auth.uid())::text
    AND role IN ('admin', 'super_moderator', 'moderator')
  )
);

-- ============================================================================
-- 3. Add missing indexes for foreign keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_best_answers_post_id ON public.best_answers(post_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON public.content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_resolved_by ON public.content_reports(resolved_by);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target_user_id ON public.moderation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON public.post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_by ON public.posts(deleted_by);
CREATE INDEX IF NOT EXISTS idx_thread_reads_thread_id ON public.thread_reads(thread_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_reply_by_id ON public.threads(last_reply_by_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_issued_by ON public.user_warnings(issued_by);

-- ============================================================================
-- Verification
-- ============================================================================

-- Count remaining policies with auth.uid() not wrapped in SELECT
SELECT 
    schemaname,
    tablename,
    policyname,
    'Check if optimized' as note
FROM pg_policies
WHERE schemaname = 'public'
    AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
    AND qual NOT LIKE '%(select auth.uid())%'
    AND with_check NOT LIKE '%(select auth.uid())%'
ORDER BY tablename, policyname;

-- Check new indexes were created
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND indexname IN (
        'idx_best_answers_post_id',
        'idx_content_reports_reporter_id',
        'idx_content_reports_resolved_by',
        'idx_moderation_logs_target_user_id',
        'idx_post_reactions_user_id',
        'idx_posts_deleted_by',
        'idx_thread_reads_thread_id',
        'idx_threads_last_reply_by_id',
        'idx_user_warnings_issued_by'
    )
ORDER BY tablename, indexname;
