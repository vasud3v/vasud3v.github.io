-- ============================================================================
-- COPY THIS ENTIRE FILE AND RUN IT IN SUPABASE SQL EDITOR
-- ============================================================================
-- Go to: https://app.supabase.com → Your Project → SQL Editor → New Query
-- Paste this entire file and click RUN
-- ============================================================================

-- Disable RLS on thread_bookmarks
ALTER TABLE thread_bookmarks DISABLE ROW LEVEL SECURITY;

-- Disable RLS on thread_watches  
ALTER TABLE thread_watches DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DONE! Now test bookmarks in your app
-- ============================================================================
