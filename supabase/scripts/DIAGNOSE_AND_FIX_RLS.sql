-- ============================================================================
-- STEP 1: DIAGNOSE - See what policies currently exist
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename IN ('post_bookmarks', 'thread_bookmarks')
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 2: FIX - Run this after reviewing the output above
-- ============================================================================
-- Uncomment the section below after reviewing the policies above

/*
BEGIN;

-- POST BOOKMARKS
ALTER TABLE public.post_bookmarks DISABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'post_bookmarks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.post_bookmarks', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_bookmarks_select ON public.post_bookmarks
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY post_bookmarks_insert ON public.post_bookmarks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY post_bookmarks_delete ON public.post_bookmarks
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- THREAD BOOKMARKS
ALTER TABLE public.thread_bookmarks DISABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'thread_bookmarks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.thread_bookmarks', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.thread_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY thread_bookmarks_select ON public.thread_bookmarks
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY thread_bookmarks_insert ON public.thread_bookmarks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY thread_bookmarks_delete ON public.thread_bookmarks
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

COMMIT;

-- VERIFICATION
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
WHERE tablename IN ('post_bookmarks', 'thread_bookmarks')
ORDER BY tablename, policyname;
*/
