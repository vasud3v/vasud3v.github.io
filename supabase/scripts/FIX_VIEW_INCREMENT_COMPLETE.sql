-- ============================================================================
-- Complete Fix for View Increment Function
-- ============================================================================
-- This script ensures view increments work regardless of RLS policies

-- Step 1: Drop existing function
DROP FUNCTION IF EXISTS increment_thread_views(TEXT);

-- Step 2: Create function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION increment_thread_views(thread_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS policies
SET search_path = public
AS $$
BEGIN
  -- Update the view count, using COALESCE to handle NULL values
  UPDATE threads
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = thread_id;
  
  -- Note: We don't raise an error if the thread doesn't exist
  -- This allows safe calls even if the thread was deleted
END;
$$;

-- Step 3: Grant execute permissions to all users
GRANT EXECUTE ON FUNCTION increment_thread_views(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_thread_views(TEXT) TO anon;

-- Step 4: Add a comment to document the function
COMMENT ON FUNCTION increment_thread_views(TEXT) IS 
  'Increments the view count for a thread. Uses SECURITY DEFINER to bypass RLS policies.';

-- Step 5: Verify the function was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' 
      AND routine_name = 'increment_thread_views'
  ) THEN
    RAISE NOTICE '✅ Function increment_thread_views created successfully';
  ELSE
    RAISE EXCEPTION '❌ Function creation failed';
  END IF;
END $$;

-- Step 6: Optional - Test the function with a sample thread
-- Uncomment the following block to test:
/*
DO $$
DECLARE
  test_thread_id TEXT;
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  -- Get the first thread
  SELECT id INTO test_thread_id FROM threads LIMIT 1;
  
  IF test_thread_id IS NOT NULL THEN
    -- Get current view count
    SELECT view_count INTO old_count FROM threads WHERE id = test_thread_id;
    
    -- Call the increment function
    PERFORM increment_thread_views(test_thread_id);
    
    -- Get new view count
    SELECT view_count INTO new_count FROM threads WHERE id = test_thread_id;
    
    -- Report results
    IF new_count > old_count THEN
      RAISE NOTICE '✅ Test PASSED: View count increased from % to %', old_count, new_count;
    ELSE
      RAISE WARNING '❌ Test FAILED: View count did not increase (was %, now %)', old_count, new_count;
    END IF;
  ELSE
    RAISE NOTICE '⚠️  No threads found to test with';
  END IF;
END $$;
*/
