-- Verify that policies are optimized
-- This should show all policies with OPTIMIZED status

SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%SELECT%auth.uid()%' OR with_check LIKE '%SELECT%auth.uid()%' THEN '✓ OPTIMIZED'
    WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN '✗ NEEDS FIX'
    ELSE 'N/A'
  END as status,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename IN ('post_bookmarks', 'thread_bookmarks')
ORDER BY tablename, policyname;
