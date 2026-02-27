-- ============================================================================
-- Fix Bookmark System
-- ============================================================================
-- This script verifies and fixes the bookmark system

-- 1. Check if table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'thread_bookmarks') THEN
        RAISE EXCEPTION 'thread_bookmarks table does not exist!';
    END IF;
    RAISE NOTICE 'thread_bookmarks table exists';
END $$;

-- 2. Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'thread_bookmarks'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'thread_bookmarks';

-- 4. Check RLS policies
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
WHERE tablename = 'thread_bookmarks';

-- 5. Count existing bookmarks
SELECT COUNT(*) as total_bookmarks FROM thread_bookmarks;

-- 6. Check for orphaned bookmarks (user doesn't exist)
SELECT 
    tb.user_id,
    tb.thread_id,
    tb.created_at
FROM thread_bookmarks tb
LEFT JOIN forum_users fu ON tb.user_id = fu.id
WHERE fu.id IS NULL;

-- 7. Check for orphaned bookmarks (thread doesn't exist)
SELECT 
    tb.user_id,
    tb.thread_id,
    tb.created_at
FROM thread_bookmarks tb
LEFT JOIN threads t ON tb.thread_id = t.id
WHERE t.id IS NULL;

-- 8. Verify foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'thread_bookmarks';

-- 9. Test insert (will fail if user doesn't exist)
-- Uncomment and replace with actual user_id and thread_id to test
-- INSERT INTO thread_bookmarks (user_id, thread_id)
-- VALUES ('your-user-id', 'your-thread-id')
-- ON CONFLICT (user_id, thread_id) DO NOTHING;

-- 10. Fix: Ensure RLS is properly configured with optimized policies
ALTER TABLE thread_bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "thread_bookmarks_select" ON thread_bookmarks;
DROP POLICY IF EXISTS "thread_bookmarks_insert" ON thread_bookmarks;
DROP POLICY IF EXISTS "thread_bookmarks_delete" ON thread_bookmarks;

-- Recreate policies with optimized auth checks (wrapped in SELECT)
-- This prevents re-evaluation for each row and improves performance
CREATE POLICY "thread_bookmarks_select" 
ON thread_bookmarks 
FOR SELECT 
USING ((SELECT auth.uid())::text = user_id);

CREATE POLICY "thread_bookmarks_insert" 
ON thread_bookmarks 
FOR INSERT 
WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY "thread_bookmarks_delete" 
ON thread_bookmarks 
FOR DELETE 
USING ((SELECT auth.uid())::text = user_id);

-- 11. Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON thread_bookmarks TO authenticated;
GRANT SELECT, INSERT, DELETE ON thread_bookmarks TO anon;

-- 12. Verify policies are active
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies
WHERE tablename = 'thread_bookmarks';

-- 13. Test query that the app uses
-- This simulates what the app does when loading bookmarks
-- Replace 'your-user-id' with an actual user ID to test
-- SELECT thread_id FROM thread_bookmarks WHERE user_id = 'your-user-id';

DO $$ 
BEGIN
    RAISE NOTICE 'Bookmark system verification and fix complete!';
END $$;
