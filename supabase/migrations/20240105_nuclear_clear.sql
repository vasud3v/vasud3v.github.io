-- ============================================================================
-- Nuclear Clear - Remove Everything Including Stubborn Data
-- ============================================================================

-- First, drop all foreign key constraints temporarily
ALTER TABLE public.threads DROP CONSTRAINT IF EXISTS threads_author_id_fkey;
ALTER TABLE public.threads DROP CONSTRAINT IF EXISTS threads_last_reply_by_id_fkey;
ALTER TABLE public.threads DROP CONSTRAINT IF EXISTS threads_category_id_fkey;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_thread_id_fkey;

-- Delete everything with CASCADE
DELETE FROM public.categories;
DELETE FROM public.topics;
DELETE FROM public.threads;
DELETE FROM public.posts;
DELETE FROM public.polls;
DELETE FROM public.poll_options;
DELETE FROM public.poll_votes;
DELETE FROM public.post_reactions;
DELETE FROM public.post_votes;
DELETE FROM public.thread_votes;
DELETE FROM public.thread_bookmarks;
DELETE FROM public.thread_watches;
DELETE FROM public.thread_reads;
DELETE FROM public.best_answers;
DELETE FROM public.reputation_events;
DELETE FROM public.profile_customizations;
DELETE FROM public.forum_users;
DELETE FROM public.forum_stats;

-- Recreate the foreign key constraints
ALTER TABLE public.threads ADD CONSTRAINT threads_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES public.forum_users(id) ON DELETE CASCADE;
ALTER TABLE public.threads ADD CONSTRAINT threads_last_reply_by_id_fkey 
  FOREIGN KEY (last_reply_by_id) REFERENCES public.forum_users(id) ON DELETE SET NULL;
ALTER TABLE public.threads ADD CONSTRAINT threads_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
ALTER TABLE public.posts ADD CONSTRAINT posts_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES public.forum_users(id) ON DELETE CASCADE;
ALTER TABLE public.posts ADD CONSTRAINT posts_thread_id_fkey 
  FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON DELETE CASCADE;

-- Insert ONE clean category
INSERT INTO public.categories (id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important, sort_order) VALUES
  ('general', 'General Discussion', 'General discussions and community talk', 'MessageSquare', 0, 0, NOW(), false, false, 1);

-- Verify
SELECT 'Categories in database:' as info;
SELECT id, name FROM public.categories;
