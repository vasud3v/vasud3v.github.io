-- Fix RLS policies for categories table
-- Run this in Supabase SQL Editor

-- Drop and recreate the SELECT policy to allow everyone to read categories
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories 
  FOR SELECT 
  USING (true);

-- Verify the policy exists
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'categories';

-- Test: This should return all categories
SELECT id, name, is_sticky, is_important FROM public.categories ORDER BY is_sticky DESC, sort_order;
