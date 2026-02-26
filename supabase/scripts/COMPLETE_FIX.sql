-- ============================================================================
-- COMPLETE FIX FOR CATEGORIES
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================================

-- Step 1: Check current RLS status
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'categories';

-- Step 2: Disable RLS temporarily
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify categories exist
SELECT COUNT(*) as category_count FROM public.categories;

-- Step 4: If count is 0, insert categories
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.categories) = 0 THEN
    INSERT INTO public.categories (id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important, sort_order, created_at) VALUES
    ('announcements', 'Announcements', 'Official announcements', 'Newspaper', 0, 0, NOW(), true, true, 1, NOW()),
    ('rules', 'Rules & Guidelines', 'Forum rules', 'Shield', 0, 0, NOW(), true, true, 2, NOW()),
    ('getting-started', 'Getting Started', 'New members', 'Rocket', 0, 0, NOW(), true, false, 3, NOW()),
    ('general', 'General Discussion', 'General talk', 'MessageSquare', 0, 0, NOW(), false, false, 100, NOW()),
    ('tech-support', 'Technical Support', 'Tech help', 'Wrench', 0, 0, NOW(), false, false, 101, NOW());
  END IF;
END $$;

-- Step 5: Drop ALL existing policies
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;
DROP POLICY IF EXISTS "categories_delete" ON public.categories;

-- Step 6: Create new policies that allow everything
CREATE POLICY "categories_select" ON public.categories 
  FOR SELECT 
  TO public
  USING (true);

CREATE POLICY "categories_insert" ON public.categories 
  FOR INSERT 
  TO public
  WITH CHECK (true);

CREATE POLICY "categories_update" ON public.categories 
  FOR UPDATE 
  TO public
  USING (true)
  WITH CHECK (true);

-- Step 7: Re-enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Step 8: Verify policies
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'categories';

-- Step 9: Test SELECT (should return all categories)
SELECT id, name, is_sticky, is_important, sort_order 
FROM public.categories 
ORDER BY is_sticky DESC, sort_order;

-- ============================================================================
-- EXPECTED RESULT: You should see 5 categories with sticky ones at top
-- ============================================================================
