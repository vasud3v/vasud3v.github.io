-- Check ALL RLS policies for auth.uid() usage without SELECT wrapper
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%( SELECT %auth.uid()%' OR with_check LIKE '%( SELECT %auth.uid()%' THEN '✓ OPTIMIZED'
    WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN '✗ NEEDS FIX'
    ELSE 'N/A'
  END as status,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
ORDER BY 
  CASE 
    WHEN qual LIKE '%( SELECT %auth.uid()%' OR with_check LIKE '%( SELECT %auth.uid()%' THEN 1
    ELSE 0
  END,
  tablename, 
  policyname;
