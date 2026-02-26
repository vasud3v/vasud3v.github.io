-- Run this in Supabase SQL Editor to check RLS status

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'categories';

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'categories';

-- Try to select as anon user would
SET ROLE anon;
SELECT id, name, is_sticky, is_important FROM categories;
RESET ROLE;
