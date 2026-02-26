-- ============================================================================
-- CREATE SINGLE ESSENTIAL CATEGORY FOR FORUM
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste this ENTIRE file
-- 6. Click "Run" (or press Ctrl+Enter)
-- ============================================================================

-- Step 1: Temporarily disable RLS to allow inserts
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Step 2: Clear existing categories
TRUNCATE public.categories CASCADE;

-- Step 3: Insert the single category for important sticky content
INSERT INTO public.categories (
  id, 
  name, 
  description, 
  icon, 
  thread_count, 
  post_count, 
  last_activity, 
  is_sticky, 
  is_important, 
  sort_order, 
  created_at
) VALUES (
  'announcements',
  'Announcements & Info',
  'Important threads: Rules, Getting Started, System Info, and Official Announcements',
  'Pin',
  0,
  0,
  NOW(),
  true,
  true,
  1,
  NOW()
);

-- Step 4: Ensure proper RLS policies exist
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "categories_insert" ON public.categories;
CREATE POLICY "categories_insert" ON public.categories 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "categories_update" ON public.categories;
CREATE POLICY "categories_update" ON public.categories 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Step 5: Re-enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify the result
SELECT 
  id,
  name,
  description,
  is_sticky,
  is_important,
  sort_order,
  thread_count,
  icon
FROM public.categories;

-- ============================================================================
-- EXPECTED RESULT:
-- You should see 1 category:
-- - Announcements & Info (sticky=true, important=true)
-- This category will contain all important sticky threads like:
--   • Forum Rules
--   • Getting Started Guide
--   • How the Forum Works
--   • Official Announcements
-- ============================================================================


-- ============================================================================
-- CREATE 5 INITIAL STICKY THREADS IN THE ANNOUNCEMENTS CATEGORY
-- ============================================================================

-- Get the first available user ID and use it for thread creation
DO $$
DECLARE
  v_user_id TEXT;
BEGIN
  -- Get the first user ID from forum_users
  SELECT id INTO v_user_id FROM public.forum_users LIMIT 1;
  
  -- Only insert threads if we found a user
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.threads (
      id,
      title,
      excerpt,
      author_id,
      category_id,
      created_at,
      last_reply_at,
      is_pinned,
      is_locked
    ) VALUES
      (
        't-rules',
        'Forum Rules & Guidelines',
        'Please read and follow these rules to keep our community safe and welcoming for everyone.',
        v_user_id,
        'announcements',
        NOW(),
        NOW(),
        true,
        true
      ),
      (
        't-getting-started',
        'Getting Started Guide',
        'New to the forum? Start here to learn how to navigate, post, and engage with the community.',
        v_user_id,
        'announcements',
        NOW(),
        NOW(),
        true,
        true
      ),
      (
        't-how-it-works',
        'How the Forum Works',
        'Learn about categories, threads, replies, upvotes, and all the features available to you.',
        v_user_id,
        'announcements',
        NOW(),
        NOW(),
        true,
        true
      ),
      (
        't-welcome',
        'Welcome to Our Community!',
        'Official welcome message and introduction to what makes this forum special.',
        v_user_id,
        'announcements',
        NOW(),
        NOW(),
        true,
        false
      ),
      (
        't-updates',
        'Latest Updates & Announcements',
        'Stay informed about new features, changes, and important community announcements.',
        v_user_id,
        'announcements',
        NOW(),
        NOW(),
        true,
        false
      )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created 5 sticky threads with author_id: %', v_user_id;
  ELSE
    RAISE NOTICE 'No users found in forum_users table. Please create a user first, then run this script again.';
  END IF;
END $$;
