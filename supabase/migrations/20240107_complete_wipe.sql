-- ============================================================================
-- Complete Wipe - Delete Everything in Correct Order
-- ============================================================================

-- Step 1: Delete all threads (this will cascade to posts)
DELETE FROM public.threads WHERE category_id IN ('cat-moderators', 'cat1', 'cat2', 'cat3', 'cat4');

-- Step 2: Delete all topics
DELETE FROM public.topics WHERE category_id IN ('cat-moderators', 'cat1', 'cat2', 'cat3', 'cat4');

-- Step 3: Now delete the categories
DELETE FROM public.categories WHERE id IN ('cat-moderators', 'cat1', 'cat2', 'cat3', 'cat4');

-- Step 4: Delete any other categories except 'general'
DELETE FROM public.categories WHERE id != 'general';

-- Step 5: Make sure 'general' exists
INSERT INTO public.categories (id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important, sort_order) 
VALUES ('general', 'General Discussion', 'General discussions and community talk', 'MessageSquare', 0, 0, NOW(), false, false, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  thread_count = 0,
  post_count = 0;

-- Step 6: Verify
SELECT 'Final categories in database:' as info;
SELECT id, name, thread_count, post_count FROM public.categories ORDER BY id;
