-- ============================================================================
-- PROPER RLS POLICIES FOR BOOKMARKS & WATCHES
-- ============================================================================
-- Run this AFTER testing with FIX_BOOKMARKS_SIMPLE.sql
-- This creates secure RLS policies
-- ============================================================================

-- First, let's check what we're working with
-- Run this query first to see the current state:
-- SELECT * FROM pg_policies WHERE tablename IN ('thread_bookmarks', 'thread_watches');

-- ============================================================================
-- THREAD_BOOKMARKS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE thread_bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON thread_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON thread_bookmarks;
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON thread_bookmarks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON thread_bookmarks;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON thread_bookmarks;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON thread_bookmarks;

-- Create new policies with explicit type casting
CREATE POLICY "Enable insert for authenticated users"
ON thread_bookmarks
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = user_id
);

CREATE POLICY "Enable delete for authenticated users"
ON thread_bookmarks
FOR DELETE
TO authenticated
USING (
  auth.uid()::text = user_id
);

CREATE POLICY "Enable select for authenticated users"
ON thread_bookmarks
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = user_id
);

-- ============================================================================
-- THREAD_WATCHES TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE thread_watches ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert their own watches" ON thread_watches;
DROP POLICY IF EXISTS "Users can delete their own watches" ON thread_watches;
DROP POLICY IF EXISTS "Users can view their own watches" ON thread_watches;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON thread_watches;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON thread_watches;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON thread_watches;

-- Create new policies with explicit type casting
CREATE POLICY "Enable insert for authenticated users"
ON thread_watches
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = user_id
);

CREATE POLICY "Enable delete for authenticated users"
ON thread_watches
FOR DELETE
TO authenticated
USING (
  auth.uid()::text = user_id
);

CREATE POLICY "Enable select for authenticated users"
ON thread_watches
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = user_id
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify the policies were created:
-- 
-- SELECT * FROM pg_policies WHERE tablename = 'thread_bookmarks';
-- SELECT * FROM pg_policies WHERE tablename = 'thread_watches';
-- ============================================================================
