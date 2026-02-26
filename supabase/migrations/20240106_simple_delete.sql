-- ============================================================================
-- Simple Direct Delete - No Tricks, Just Delete Everything
-- ============================================================================

-- Step 1: Check what we have
SELECT 'BEFORE DELETE - Categories:' as step;
SELECT id, name FROM public.categories ORDER BY id;

-- Step 2: Delete specific problematic categories by ID
DELETE FROM public.categories WHERE id = 'cat-moderators';
DELETE FROM public.categories WHERE id = 'cat1';
DELETE FROM public.categories WHERE id = 'cat2';
DELETE FROM public.categories WHERE id = 'cat3';
DELETE FROM public.categories WHERE id = 'cat4';

-- Step 3: Delete any remaining categories except 'general'
DELETE FROM public.categories WHERE id != 'general';

-- Step 4: If 'general' doesn't exist, create it
INSERT INTO public.categories (id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important, sort_order) 
VALUES ('general', 'General Discussion', 'General discussions and community talk', 'MessageSquare', 0, 0, NOW(), false, false, 1)
ON CONFLICT (id) DO NOTHING;

-- Step 5: Verify what's left
SELECT 'AFTER DELETE - Categories:' as step;
SELECT id, name FROM public.categories ORDER BY id;
