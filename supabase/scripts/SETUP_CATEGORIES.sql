-- ============================================================================
-- SETUP STICKY CATEGORIES FOR FORUM
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

-- Step 2: Delete any existing categories (optional - comment out if you want to keep existing)
-- DELETE FROM public.categories;

-- Step 3: Insert the sticky and regular categories
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
) VALUES
  -- STICKY + IMPORTANT CATEGORIES (shown at top with special styling)
  (
    'announcements',
    '📢 Announcements',
    'Official announcements, updates, and important news from the team',
    'Newspaper',
    0,
    0,
    NOW(),
    true,
    true,
    1,
    NOW()
  ),
  (
    'rules-guidelines',
    '📋 Rules & Guidelines',
    'Forum rules, community guidelines, and best practices - Read before posting!',
    'Shield',
    0,
    0,
    NOW(),
    true,
    true,
    2,
    NOW()
  ),
  -- STICKY CATEGORIES (shown at top)
  (
    'getting-started',
    '🚀 Getting Started',
    'New to the forum? Start here for introductions and helpful guides',
    'Rocket',
    0,
    0,
    NOW(),
    true,
    false,
    3,
    NOW()
  ),
  -- REGULAR CATEGORIES
  (
    'general',
    'General Discussion',
    'Off-topic conversations, introductions, and community talk',
    'MessageSquare',
    0,
    0,
    NOW(),
    false,
    false,
    100,
    NOW()
  ),
  (
    'tech-support',
    'Technical Support',
    'Get help with coding problems, debugging, and technical issues',
    'Wrench',
    0,
    0,
    NOW(),
    false,
    false,
    101,
    NOW()
  ),
  (
    'showcase',
    'Showcase & Projects',
    'Share your projects, get feedback, and find collaborators',
    'Rocket',
    0,
    0,
    NOW(),
    false,
    false,
    102,
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_sticky = EXCLUDED.is_sticky,
  is_important = EXCLUDED.is_important,
  sort_order = EXCLUDED.sort_order;

-- Step 4: Add INSERT and UPDATE policies for categories (so admins can manage them)
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

-- Step 6: Verify the results
SELECT 
  id,
  name,
  is_sticky,
  is_important,
  sort_order,
  thread_count,
  icon
FROM public.categories
ORDER BY 
  is_sticky DESC,
  is_important DESC,
  sort_order ASC;

-- ============================================================================
-- EXPECTED RESULTS:
-- You should see 6 categories with sticky ones at the top:
-- 1. 📢 Announcements (sticky=true, important=true)
-- 2. 📋 Rules & Guidelines (sticky=true, important=true)
-- 3. 🚀 Getting Started (sticky=true, important=false)
-- 4. General Discussion (sticky=false, important=false)
-- 5. Technical Support (sticky=false, important=false)
-- 6. Showcase & Projects (sticky=false, important=false)
-- ============================================================================
