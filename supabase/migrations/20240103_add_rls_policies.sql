ALTER TABLE public.forum_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.best_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forum_users_select" ON public.forum_users;
CREATE POLICY "forum_users_select" ON public.forum_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "forum_users_insert" ON public.forum_users;
CREATE POLICY "forum_users_insert" ON public.forum_users FOR INSERT WITH CHECK (auth.uid()::text = id);

DROP POLICY IF EXISTS "forum_users_update" ON public.forum_users;
CREATE POLICY "forum_users_update" ON public.forum_users FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "topics_select" ON public.topics;
CREATE POLICY "topics_select" ON public.topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "threads_select" ON public.threads;
CREATE POLICY "threads_select" ON public.threads FOR SELECT USING (true);

DROP POLICY IF EXISTS "threads_insert" ON public.threads;
CREATE POLICY "threads_insert" ON public.threads FOR INSERT WITH CHECK (auth.uid()::text = author_id);

DROP POLICY IF EXISTS "threads_update" ON public.threads;
CREATE POLICY "threads_update" ON public.threads FOR UPDATE USING (auth.uid()::text = author_id);

DROP POLICY IF EXISTS "posts_select" ON public.posts;
CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "posts_insert" ON public.posts;
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (auth.uid()::text = author_id);

DROP POLICY IF EXISTS "posts_update" ON public.posts;
CREATE POLICY "posts_update" ON public.posts FOR UPDATE USING (auth.uid()::text = author_id);

DROP POLICY IF EXISTS "post_reactions_select" ON public.post_reactions;
CREATE POLICY "post_reactions_select" ON public.post_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "post_reactions_insert" ON public.post_reactions;
CREATE POLICY "post_reactions_insert" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "post_reactions_delete" ON public.post_reactions;
CREATE POLICY "post_reactions_delete" ON public.post_reactions FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "polls_select" ON public.polls;
CREATE POLICY "polls_select" ON public.polls FOR SELECT USING (true);

DROP POLICY IF EXISTS "poll_options_select" ON public.poll_options;
CREATE POLICY "poll_options_select" ON public.poll_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "poll_votes_select" ON public.poll_votes;
CREATE POLICY "poll_votes_select" ON public.poll_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "poll_votes_insert" ON public.poll_votes;
CREATE POLICY "poll_votes_insert" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "thread_bookmarks_select" ON public.thread_bookmarks;
CREATE POLICY "thread_bookmarks_select" ON public.thread_bookmarks FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "thread_bookmarks_insert" ON public.thread_bookmarks;
CREATE POLICY "thread_bookmarks_insert" ON public.thread_bookmarks FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "thread_bookmarks_delete" ON public.thread_bookmarks;
CREATE POLICY "thread_bookmarks_delete" ON public.thread_bookmarks FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "thread_watches_select" ON public.thread_watches;
CREATE POLICY "thread_watches_select" ON public.thread_watches FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "thread_watches_insert" ON public.thread_watches;
CREATE POLICY "thread_watches_insert" ON public.thread_watches FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "thread_watches_delete" ON public.thread_watches;
CREATE POLICY "thread_watches_delete" ON public.thread_watches FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "thread_votes_select" ON public.thread_votes;
CREATE POLICY "thread_votes_select" ON public.thread_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "thread_votes_insert" ON public.thread_votes;
CREATE POLICY "thread_votes_insert" ON public.thread_votes FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "thread_votes_update" ON public.thread_votes;
CREATE POLICY "thread_votes_update" ON public.thread_votes FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "thread_votes_delete" ON public.thread_votes;
CREATE POLICY "thread_votes_delete" ON public.thread_votes FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "post_votes_select" ON public.post_votes;
CREATE POLICY "post_votes_select" ON public.post_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "post_votes_insert" ON public.post_votes;
CREATE POLICY "post_votes_insert" ON public.post_votes FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "post_votes_update" ON public.post_votes;
CREATE POLICY "post_votes_update" ON public.post_votes FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "post_votes_delete" ON public.post_votes;
CREATE POLICY "post_votes_delete" ON public.post_votes FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "thread_reads_select" ON public.thread_reads;
CREATE POLICY "thread_reads_select" ON public.thread_reads FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "thread_reads_insert" ON public.thread_reads;
CREATE POLICY "thread_reads_insert" ON public.thread_reads FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "thread_reads_update" ON public.thread_reads;
CREATE POLICY "thread_reads_update" ON public.thread_reads FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "profile_customizations_select" ON public.profile_customizations;
CREATE POLICY "profile_customizations_select" ON public.profile_customizations FOR SELECT USING (true);

DROP POLICY IF EXISTS "profile_customizations_insert" ON public.profile_customizations;
CREATE POLICY "profile_customizations_insert" ON public.profile_customizations FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "profile_customizations_update" ON public.profile_customizations;
CREATE POLICY "profile_customizations_update" ON public.profile_customizations FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "reputation_events_select" ON public.reputation_events;
CREATE POLICY "reputation_events_select" ON public.reputation_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "reputation_events_insert" ON public.reputation_events;
CREATE POLICY "reputation_events_insert" ON public.reputation_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "best_answers_select" ON public.best_answers;
CREATE POLICY "best_answers_select" ON public.best_answers FOR SELECT USING (true);

DROP POLICY IF EXISTS "best_answers_insert" ON public.best_answers;
CREATE POLICY "best_answers_insert" ON public.best_answers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "best_answers_update" ON public.best_answers;
CREATE POLICY "best_answers_update" ON public.best_answers FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "best_answers_delete" ON public.best_answers;
CREATE POLICY "best_answers_delete" ON public.best_answers FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "forum_stats_select" ON public.forum_stats;
CREATE POLICY "forum_stats_select" ON public.forum_stats FOR SELECT USING (true);
