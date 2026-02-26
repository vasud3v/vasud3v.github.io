-- ============================================================================
-- Clear Seed Data
-- ============================================================================
-- This migration removes all the dummy/seed data from the database
-- Run this if you want to start with a clean database

-- Delete in reverse order of dependencies

-- Delete ALL poll votes
DELETE FROM public.poll_votes;

-- Delete ALL poll options
DELETE FROM public.poll_options;

-- Delete ALL polls
DELETE FROM public.polls;

-- Delete ALL post reactions
DELETE FROM public.post_reactions;

-- Delete ALL post votes
DELETE FROM public.post_votes;

-- Delete ALL posts
DELETE FROM public.posts;

-- Delete ALL thread votes
DELETE FROM public.thread_votes;

-- Delete ALL thread bookmarks
DELETE FROM public.thread_bookmarks;

-- Delete ALL thread watches
DELETE FROM public.thread_watches;

-- Delete ALL thread reads
DELETE FROM public.thread_reads;

-- Delete ALL best answers
DELETE FROM public.best_answers;

-- Delete ALL threads
DELETE FROM public.threads;

-- Delete ALL topics
DELETE FROM public.topics;

-- Delete ALL categories
DELETE FROM public.categories;

-- Delete ALL reputation events
DELETE FROM public.reputation_events;

-- Delete ALL profile customizations
DELETE FROM public.profile_customizations;

-- Delete ALL forum users (except authenticated users from auth.users)
-- This will delete seed users but keep real authenticated users
DELETE FROM public.forum_users WHERE id IN ('u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8');

-- Reset forum stats
DELETE FROM public.forum_stats;

-- Insert a default category for new users
INSERT INTO public.categories (id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important, sort_order) VALUES
  ('general', 'General Discussion', 'General discussions and community talk', 'MessageSquare', 0, 0, NOW(), false, false, 1);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Seed data cleared successfully. Database is now clean.';
END $$;
