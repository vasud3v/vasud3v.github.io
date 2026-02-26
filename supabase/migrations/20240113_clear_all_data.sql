-- Clear all forum data: threads, categories, and users
-- This will cascade delete all related data (posts, reactions, votes, etc.)

-- Disable triggers temporarily to avoid conflicts
SET session_replication_role = replica;

-- Delete in order to respect foreign key constraints
-- 1. Delete all posts (references threads and users)
DELETE FROM posts;

-- 2. Delete all threads (references categories and users)
DELETE FROM threads;

-- 3. Delete all categories
DELETE FROM categories;

-- 4. Delete all user-related data
DELETE FROM profile_customizations;
DELETE FROM reputation_events;
DELETE FROM bookmarks;
DELETE FROM watched_threads;
DELETE FROM thread_votes;
DELETE FROM post_votes;
DELETE FROM thread_read_status;

-- 5. Delete all forum users (but keep auth.users intact)
DELETE FROM forum_users;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify deletion
DO $$
DECLARE
  thread_count INTEGER;
  post_count INTEGER;
  category_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO thread_count FROM threads;
  SELECT COUNT(*) INTO post_count FROM posts;
  SELECT COUNT(*) INTO category_count FROM categories;
  SELECT COUNT(*) INTO user_count FROM forum_users;
  
  RAISE NOTICE 'Remaining threads: %', thread_count;
  RAISE NOTICE 'Remaining posts: %', post_count;
  RAISE NOTICE 'Remaining categories: %', category_count;
  RAISE NOTICE 'Remaining forum_users: %', user_count;
  
  IF thread_count = 0 AND post_count = 0 AND category_count = 0 AND user_count = 0 THEN
    RAISE NOTICE 'All data successfully cleared!';
  ELSE
    RAISE WARNING 'Some data remains in the database';
  END IF;
END $$;
