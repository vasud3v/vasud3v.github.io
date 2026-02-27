-- ============================================================================
-- Check View Increment Setup
-- ============================================================================
-- This script checks if everything is properly configured for view increments

-- 1. Check if the function exists
SELECT 
  'Function Check' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Function exists'
    ELSE '❌ Function does NOT exist - Run FIX_VIEW_INCREMENT.sql'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'increment_thread_views';

-- 2. Check function permissions
SELECT 
  'Permission Check' as check_type,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' 
  AND routine_name = 'increment_thread_views';

-- 3. Check if threads table has view_count column
SELECT 
  'Column Check' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ view_count column exists'
    ELSE '❌ view_count column missing'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'threads'
  AND column_name = 'view_count';

-- 4. Check RLS on threads table
SELECT 
  'RLS Check' as check_type,
  CASE 
    WHEN relrowsecurity THEN '⚠️  RLS is ENABLED on threads table'
    ELSE '✅ RLS is disabled on threads table'
  END as status
FROM pg_class
WHERE relname = 'threads' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. Show RLS policies on threads table (if any)
SELECT 
  'RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'threads';

-- 6. Sample thread data
SELECT 
  'Sample Data' as check_type,
  id,
  title,
  view_count,
  created_at
FROM threads
ORDER BY created_at DESC
LIMIT 3;

-- 7. Test the function (optional - uncomment to test)
-- DO $$
-- DECLARE
--   test_thread_id TEXT;
--   old_count INTEGER;
--   new_count INTEGER;
-- BEGIN
--   -- Get a thread ID
--   SELECT id INTO test_thread_id FROM threads LIMIT 1;
--   
--   IF test_thread_id IS NOT NULL THEN
--     -- Get current count
--     SELECT view_count INTO old_count FROM threads WHERE id = test_thread_id;
--     
--     -- Increment
--     PERFORM increment_thread_views(test_thread_id);
--     
--     -- Get new count
--     SELECT view_count INTO new_count FROM threads WHERE id = test_thread_id;
--     
--     RAISE NOTICE 'Test Result: Thread % - Old count: %, New count: %', test_thread_id, old_count, new_count;
--   END IF;
-- END $$;
