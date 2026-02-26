-- Check if threads were created
SELECT id, title, category_id, is_pinned, author_id 
FROM public.threads 
WHERE category_id = 'announcements'
ORDER BY created_at;

-- Check RLS policies on threads table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'threads';

-- Check if RLS is enabled on threads
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'threads';
