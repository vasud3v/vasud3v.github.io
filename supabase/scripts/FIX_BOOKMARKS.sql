-- ============================================================================
-- FIX BOOKMARK & WATCH RLS POLICIES
-- ============================================================================
-- This SQL fixes the Row-Level Security policies that are preventing
-- bookmarks and watches from being saved to the database.
--
-- HOW TO USE:
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Copy and paste this entire file
-- 5. Click "Run"
-- ============================================================================

-- Fix thread_bookmarks table
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE thread_bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON thread_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON thread_bookmarks;
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON thread_bookmarks;

-- Create INSERT policy - allows users to bookmark threads
CREATE POLICY "Users can insert their own bookmarks"
ON thread_bookmarks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Create DELETE policy - allows users to remove their bookmarks
CREATE POLICY "Users can delete their own bookmarks"
ON thread_bookmarks
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- Create SELECT policy - allows users to view their bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON thread_bookmarks
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);


-- Fix thread_watches table
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE thread_watches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own watches" ON thread_watches;
DROP POLICY IF EXISTS "Users can delete their own watches" ON thread_watches;
DROP POLICY IF EXISTS "Users can view their own watches" ON thread_watches;

-- Create INSERT policy - allows users to watch threads
CREATE POLICY "Users can insert their own watches"
ON thread_watches
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Create DELETE policy - allows users to unwatch threads
CREATE POLICY "Users can delete their own watches"
ON thread_watches
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- Create SELECT policy - allows users to view their watched threads
CREATE POLICY "Users can view their own watches"
ON thread_watches
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- ============================================================================
-- DONE!
-- ============================================================================
-- After running this SQL:
-- 1. Restart your dev server (Ctrl+C, then npm run dev)
-- 2. Hard refresh your browser (Ctrl+Shift+R)
-- 3. Test bookmarking a thread
-- 4. Check the Bookmarks page
-- 5. Run: node scripts/check-bookmarks-db.js
-- ============================================================================
