-- ============================================================================
-- FIX: Use EXACT format that Supabase linter expects
-- ============================================================================
-- The linter wants: (select auth.uid())
-- Not: ( SELECT (auth.uid())::text AS uid)
-- ============================================================================

BEGIN;

-- POST BOOKMARKS
ALTER TABLE post_bookmarks DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS post_bookmarks_select ON post_bookmarks;
DROP POLICY IF EXISTS post_bookmarks_insert ON post_bookmarks;
DROP POLICY IF EXISTS post_bookmarks_delete ON post_bookmarks;

ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;

-- Use exact format: (select auth.uid()) without extra parentheses or aliases
CREATE POLICY post_bookmarks_select ON post_bookmarks
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid())::text);

CREATE POLICY post_bookmarks_insert ON post_bookmarks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY post_bookmarks_delete ON post_bookmarks
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid())::text);

-- THREAD BOOKMARKS
ALTER TABLE thread_bookmarks DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS thread_bookmarks_select ON thread_bookmarks;
DROP POLICY IF EXISTS thread_bookmarks_insert ON thread_bookmarks;
DROP POLICY IF EXISTS thread_bookmarks_delete ON thread_bookmarks;

ALTER TABLE thread_bookmarks ENABLE ROW LEVEL SECURITY;

-- Use exact format: (select auth.uid()) without extra parentheses or aliases
CREATE POLICY thread_bookmarks_select ON thread_bookmarks
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid())::text);

CREATE POLICY thread_bookmarks_insert ON thread_bookmarks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY thread_bookmarks_delete ON thread_bookmarks
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid())::text);

COMMIT;

-- VERIFICATION
SELECT 
  tablename,
  policyname,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename IN ('post_bookmarks', 'thread_bookmarks')
ORDER BY tablename, policyname;
