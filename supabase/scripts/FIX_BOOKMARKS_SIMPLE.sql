-- ============================================================================
-- SIMPLE FIX: DISABLE RLS FOR TESTING
-- ============================================================================
-- This temporarily disables RLS to test if that's the issue
-- WARNING: This is for testing only! Re-enable RLS with proper policies later
-- ============================================================================

-- Disable RLS on thread_bookmarks (TEMPORARY - FOR TESTING ONLY)
ALTER TABLE thread_bookmarks DISABLE ROW LEVEL SECURITY;

-- Disable RLS on thread_watches (TEMPORARY - FOR TESTING ONLY)  
ALTER TABLE thread_watches DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- After running this:
-- 1. Test if bookmarks work
-- 2. If they work, the issue is definitely RLS policies
-- 3. Then we'll create proper policies
-- ============================================================================
