-- ============================================================================
-- Fix View Increment Function
-- ============================================================================
-- This script ensures the increment_thread_views function exists and works properly

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS increment_thread_views(TEXT);

-- Create the function with proper error handling
CREATE OR REPLACE FUNCTION increment_thread_views(thread_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the view count for the specified thread
  UPDATE threads
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = thread_id;
  
  -- No need to raise an error if thread doesn't exist
  -- This allows the function to be called safely even if thread is deleted
END;
$$;

-- Grant execute permissions to all users (authenticated and anonymous)
GRANT EXECUTE ON FUNCTION increment_thread_views(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_thread_views(TEXT) TO anon;

-- Test the function (optional - comment out if you don't want to test)
-- SELECT increment_thread_views('test-thread-id');

-- Verify the function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'increment_thread_views';
