-- Fix RLS policies for threads table so everyone can read them

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "threads_select" ON public.threads;

-- Create a new SELECT policy that allows everyone to read threads
CREATE POLICY "threads_select" ON public.threads 
  FOR SELECT 
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

-- Verify the policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'threads';

-- Test: This should return all threads including the 5 we created
SELECT id, title, category_id, is_pinned, is_locked 
FROM public.threads 
WHERE category_id = 'announcements'
ORDER BY created_at;
