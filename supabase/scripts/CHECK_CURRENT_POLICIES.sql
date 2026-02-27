-- Check current RLS policies to see what's actually deployed
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename IN ('thread_bookmarks', 'post_bookmarks')
ORDER BY tablename, policyname;
