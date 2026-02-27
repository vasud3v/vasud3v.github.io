-- ============================================================================
-- Fix Post Delete RLS Policy
-- ============================================================================
-- This script fixes the RLS policy to allow users to delete their own posts
-- Currently only staff can delete posts, but users should be able to delete
-- their own posts as well.

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "posts_delete" ON public.posts;

-- Create new policy that allows:
-- 1. Post authors to delete their own posts
-- 2. Staff members to delete any post
CREATE POLICY "posts_delete" 
ON public.posts 
FOR DELETE
USING (
  -- User is the post author
  auth.uid()::text = author_id 
  OR 
  -- User is staff (moderator, admin, or supermod)
  public.is_staff(auth.uid()::text)
);

-- Verify the policy was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'posts' 
      AND policyname = 'posts_delete'
  ) THEN
    RAISE NOTICE '✅ Policy posts_delete created successfully';
    RAISE NOTICE 'Users can now delete their own posts';
    RAISE NOTICE 'Staff can delete any post';
  ELSE
    RAISE WARNING '❌ Policy posts_delete was NOT created';
  END IF;
END $$;

-- Show the current policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'posts'
  AND policyname = 'posts_delete';

-- ============================================================================
-- Optional: Fix Thread Delete RLS Policy
-- ============================================================================
-- Uncomment the following if you also want users to delete their own threads
-- Currently only staff can delete threads, which is often the desired behavior
-- for forums to prevent users from removing entire discussions

/*
DROP POLICY IF EXISTS "threads_delete" ON public.threads;

CREATE POLICY "threads_delete" 
ON public.threads 
FOR DELETE
USING (
  auth.uid()::text = author_id 
  OR 
  public.is_staff(auth.uid()::text)
);

-- Verify thread delete policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'threads'
  AND policyname = 'threads_delete';
*/
