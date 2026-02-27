-- ============================================================================
-- FIX: Post Bookmarks RLS Performance Optimization
-- ============================================================================
-- Fixes auth_rls_initplan warnings for post_bookmarks table only
-- ============================================================================

BEGIN;

-- Temporarily disable RLS to clean up all policies
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

-- Create optimized policies with (SELECT auth.uid()) to prevent row-by-row evaluation
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
  qual as using_clause,
  with_check,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid()%' OR with_check LIKE '%(SELECT auth.uid()%' THEN '✓ OPTIMIZED'
    WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN '✗ NEEDS FIX'
    ELSE 'N/A'
  END as status
FROM pg_policies 
WHERE tablename = 'post_bookmarks'
ORDER BY policyname;
