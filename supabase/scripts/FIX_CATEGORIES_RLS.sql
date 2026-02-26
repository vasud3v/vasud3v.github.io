-- ============================================================================
-- FIX CATEGORIES RLS - Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Ensure RLS is enabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;
DROP POLICY IF EXISTS "categories_delete" ON public.categories;

-- Step 3: Create new policies that allow public read access
CREATE POLICY "categories_select" 
  ON public.categories 
  FOR SELECT 
  USING (true);

CREATE POLICY "categories_insert" 
  ON public.categories 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "categories_update" 
  ON public.categories 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Step 4: Verify categories exist
SELECT 
  id, 
  name, 
  is_sticky, 
  is_important, 
  sort_order 
FROM public.categories 
ORDER BY is_sticky DESC, sort_order;

-- Step 5: Test as anon user (this simulates what your app sees)
SET ROLE anon;
SELECT 
  id, 
  name, 
  is_sticky, 
  is_important 
FROM public.categories;
RESET ROLE;

-- If the above SELECT returns rows, your app should now see categories!
