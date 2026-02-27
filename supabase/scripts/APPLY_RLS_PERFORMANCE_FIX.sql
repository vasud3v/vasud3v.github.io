-- ============================================================================
-- IMMEDIATE FIX: Apply RLS Performance Optimization
-- ============================================================================
-- This script fixes the auth_rls_initplan warnings by wrapping auth.uid() 
-- in a SELECT subquery to prevent re-evaluation for each row.
--
-- Run this directly in your Supabase SQL Editor or via CLI:
-- psql -h <host> -U postgres -d postgres -f APPLY_RLS_PERFORMANCE_FIX.sql
-- ============================================================================

-- Fix thread_bookmarks RLS policies
-- Drop all possible policy names
DROP POLICY IF EXISTS thread_bookmarks_select ON public.thread_bookmarks;
DROP POLICY IF EXISTS thread_bookmarks_insert ON public.thread_bookmarks;
DROP POLICY IF EXISTS thread_bookmarks_delete ON public.thread_bookmarks;
DROP POLICY IF EXISTS "thread_bookmarks_select" ON public.thread_bookmarks;
DROP POLICY IF EXISTS "thread_bookmarks_insert" ON public.thread_bookmarks;
DROP POLICY IF EXISTS "thread_bookmarks_delete" ON public.thread_bookmarks;
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.thread_bookmarks;
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON public.thread_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.thread_bookmarks;

CREATE POLICY thread_bookmarks_select ON public.thread_bookmarks
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY thread_bookmarks_insert ON public.thread_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY thread_bookmarks_delete ON public.thread_bookmarks
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- Fix post_bookmarks RLS policies
-- Drop all possible policy names
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.post_bookmarks;
DROP POLICY IF EXISTS "Users can view their own post bookmarks" ON public.post_bookmarks;
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.post_bookmarks;
DROP POLICY IF EXISTS "Users can insert their own post bookmarks" ON public.post_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.post_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own post bookmarks" ON public.post_bookmarks;
DROP POLICY IF EXISTS "Users can update their own bookmarks" ON public.post_bookmarks;
DROP POLICY IF EXISTS post_bookmarks_select ON public.post_bookmarks;
DROP POLICY IF EXISTS post_bookmarks_insert ON public.post_bookmarks;
DROP POLICY IF EXISTS post_bookmarks_delete ON public.post_bookmarks;
DROP POLICY IF EXISTS post_bookmarks_update ON public.post_bookmarks;
DROP POLICY IF EXISTS "post_bookmarks_select" ON public.post_bookmarks;
DROP POLICY IF EXISTS "post_bookmarks_insert" ON public.post_bookmarks;
DROP POLICY IF EXISTS "post_bookmarks_delete" ON public.post_bookmarks;

CREATE POLICY post_bookmarks_select ON public.post_bookmarks
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY post_bookmarks_insert ON public.post_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY post_bookmarks_delete ON public.post_bookmarks
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- Verification query - run this to confirm the fix
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid()%' OR with_check LIKE '%(SELECT auth.uid()%' THEN '✓ Optimized'
    WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN '✗ Needs Fix'
    ELSE 'N/A'
  END as status,
  cmd
FROM pg_policies 
WHERE tablename IN ('thread_bookmarks', 'post_bookmarks')
ORDER BY tablename, policyname;
