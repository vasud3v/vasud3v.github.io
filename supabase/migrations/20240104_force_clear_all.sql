-- ============================================================================
-- Force Clear ALL Data
-- ============================================================================
-- This will completely wipe the forum data and start fresh
-- WARNING: This deletes EVERYTHING including any real content you created

-- Disable foreign key checks temporarily (if needed)
SET session_replication_role = 'replica';

-- Delete everything
TRUNCATE TABLE public.poll_votes CASCADE;
TRUNCATE TABLE public.poll_options CASCADE;
TRUNCATE TABLE public.polls CASCADE;
TRUNCATE TABLE public.post_reactions CASCADE;
TRUNCATE TABLE public.post_votes CASCADE;
TRUNCATE TABLE public.posts CASCADE;
TRUNCATE TABLE public.thread_votes CASCADE;
TRUNCATE TABLE public.thread_bookmarks CASCADE;
TRUNCATE TABLE public.thread_watches CASCADE;
TRUNCATE TABLE public.thread_reads CASCADE;
TRUNCATE TABLE public.best_answers CASCADE;
TRUNCATE TABLE public.threads CASCADE;
TRUNCATE TABLE public.topics CASCADE;
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.reputation_events CASCADE;
TRUNCATE TABLE public.profile_customizations CASCADE;
TRUNCATE TABLE public.forum_users CASCADE;
TRUNCATE TABLE public.forum_stats CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Insert a default category
INSERT INTO public.categories (id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important, sort_order) VALUES
  ('general', 'General Discussion', 'General discussions and community talk', 'MessageSquare', 0, 0, NOW(), false, false, 1);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'All forum data cleared successfully. Database is completely clean.';
END $$;
