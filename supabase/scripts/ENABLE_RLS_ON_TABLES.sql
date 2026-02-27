-- Enable RLS on tables that have policies but RLS is disabled
-- This fixes the Supabase linter errors

-- Enable RLS on profile_customizations
ALTER TABLE public.profile_customizations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on thread_bookmarks
ALTER TABLE public.thread_bookmarks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on thread_watches
ALTER TABLE public.thread_watches ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('profile_customizations', 'thread_bookmarks', 'thread_watches')
ORDER BY tablename;
