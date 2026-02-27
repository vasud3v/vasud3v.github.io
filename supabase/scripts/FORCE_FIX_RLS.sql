-- ============================================================================
-- FORCE FIX: RLS Performance Optimization for Bookmarks
-- ============================================================================
-- This script aggressively fixes all RLS policies by disabling RLS,
-- dropping all policies, and recreating them with optimized patterns.
-- ============================================================================

BEGIN;

-- ============================================================================
-- THREAD BOOKMARKS
-- ============================================================================

-- Temporarily disable RLS to clean up
ALTER TABLE thread_bookmarks DISABLE ROW LEVEL SECURITY;

-- Drop ALL possible policy names
DROP POLICY IF EXISTS thread_bookmarks_select ON thread_bookmarks;
DROP POLICY IF EXISTS thread_bookmarks_insert ON thread_bookmarks;
DROP POLICY IF EXISTS thread_bookmarks_delete ON thread_bookmarks;
DROP POLICY IF EXISTS thread_bookmarks_update ON thread_bookmarks;
DROP POLICY IF EXISTS "thread_bookmarks_select" ON thread_bookmarks;
DROP POLICY IF EXISTS "thread_bookmarks_insert" ON thread_bookmarks;
DROP POLICY IF EXISTS "thread_bookmarks_delete" ON thread_bookmarks;
DROP POLICY IF EXISTS "thread_bookmarks_update" ON thread_bookmarks;
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON thread_bookmarks;
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON thread_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON thread_bookmarks;
DROP POLICY IF EXISTS "Users can update their own bookmarks" ON thread_bookmarks;

-- Re-enable RLS
ALTER TABLE thread_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create optimized policies with SELECT subquery
CREATE POLICY thread_bookmarks_select ON thread_bookmarks
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY thread_bookmarks_insert ON thread_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY thread_bookmarks_delete ON thread_bookmarks
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- ============================================================================
-- POST BOOKMARKS
-- ============================================================================

-- Temporarily disable RLS to clean up
ALTER TABLE post_bookmarks DISABLE ROW LEVEL SECURITY;

-- Drop ALL possible policy names
DROP POLICY IF EXISTS post_bookmarks_select ON post_bookmarks;
DROP POLICY IF EXISTS post_bookmarks_insert ON post_bookmarks;
DROP POLICY IF EXISTS post_bookmarks_delete ON post_bookmarks;
DROP POLICY IF EXISTS post_bookmarks_update ON post_bookmarks;
DROP POLICY IF EXISTS "post_bookmarks_select" ON post_bookmarks;
DROP POLICY IF EXISTS "post_bookmarks_insert" ON post_bookmarks;
DROP POLICY IF EXISTS "post_bookmarks_delete" ON post_bookmarks;
DROP POLICY IF EXISTS "post_bookmarks_update" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can view their own post bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can insert their own post bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own post bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can update their own bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can update their own post bookmarks" ON post_bookmarks;

-- Re-enable RLS
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create optimized policies with SELECT subquery
CREATE POLICY post_bookmarks_select ON post_bookmarks
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY post_bookmarks_insert ON post_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY post_bookmarks_delete ON post_bookmarks
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid()%' OR with_check LIKE '%(SELECT auth.uid()%' THEN '✓ OPTIMIZED'
    WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN '✗ NEEDS FIX'
    ELSE 'N/A'
  END as status
FROM pg_policies 
WHERE tablename IN ('thread_bookmarks', 'post_bookmarks')
ORDER BY tablename, policyname;
