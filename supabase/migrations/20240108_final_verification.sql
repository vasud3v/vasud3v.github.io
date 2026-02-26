-- ============================================================================
-- Final Verification and Clean
-- ============================================================================

-- Show what we have BEFORE
SELECT '=== BEFORE CLEANUP ===' as status;
SELECT 'Categories:' as info, COUNT(*) as count FROM public.categories;
SELECT id, name FROM public.categories;

SELECT 'Threads:' as info, COUNT(*) as count FROM public.threads;
SELECT 'Topics:' as info, COUNT(*) as count FROM public.topics;

-- Delete EVERYTHING except 'general' category
DELETE FROM public.threads WHERE category_id != 'general';
DELETE FROM public.topics WHERE category_id != 'general';
DELETE FROM public.categories WHERE id != 'general';

-- Show what we have AFTER
SELECT '=== AFTER CLEANUP ===' as status;
SELECT 'Categories:' as info, COUNT(*) as count FROM public.categories;
SELECT id, name, thread_count, post_count FROM public.categories;

SELECT 'Threads:' as info, COUNT(*) as count FROM public.threads;
SELECT 'Topics:' as info, COUNT(*) as count FROM public.topics;

-- If 'general' doesn't exist, create it
INSERT INTO public.categories (id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important, sort_order) 
VALUES ('general', 'General Discussion', 'General discussions and community talk', 'MessageSquare', 0, 0, NOW(), false, false, 1)
ON CONFLICT (id) DO UPDATE SET
  thread_count = 0,
  post_count = 0;

SELECT '=== FINAL STATE ===' as status;
SELECT id, name, thread_count, post_count FROM public.categories;
