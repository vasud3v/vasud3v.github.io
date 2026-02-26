-- ============================================================================
-- Add Sticky and Important Categories
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste and Run
-- ============================================================================

-- Temporarily disable RLS to insert categories
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Insert/Update Announcements (Sticky + Important)
INSERT INTO public.categories (
  id, name, description, icon, 
  thread_count, post_count, last_activity,
  is_sticky, is_important, sort_order, created_at
) VALUES (
  'announcements',
  'Announcements',
  'Official announcements, updates, and important news from the team',
  'Newspaper',
  0, 0, NOW(),
  true, true, 1, NOW()
) ON CONFLICT (id) DO UPDATE SET
  is_sticky = true,
  is_important = true,
  sort_order = 1,
  description = 'Official announcements, updates, and important news from the team',
  icon = 'Newspaper';

-- Insert/Update Rules & Guidelines (Sticky)
INSERT INTO public.categories (
  id, name, description, icon,
  thread_count, post_count, last_activity,
  is_sticky, is_important, sort_order, created_at
) VALUES (
  'rules-guidelines',
  'Rules & Guidelines',
  'Forum rules, community guidelines, and best practices',
  'Shield',
  0, 0, NOW(),
  true, false, 2, NOW()
) ON CONFLICT (id) DO UPDATE SET
  is_sticky = true,
  is_important = false,
  sort_order = 2,
  description = 'Forum rules, community guidelines, and best practices',
  icon = 'Shield';

-- Insert/Update Getting Started (Sticky)
INSERT INTO public.categories (
  id, name, description, icon,
  thread_count, post_count, last_activity,
  is_sticky, is_important, sort_order, created_at
) VALUES (
  'getting-started',
  'Getting Started',
  'New to the forum? Start here for introductions and helpful guides',
  'Rocket',
  0, 0, NOW(),
  true, false, 3, NOW()
) ON CONFLICT (id) DO UPDATE SET
  is_sticky = true,
  is_important = false,
  sort_order = 3,
  description = 'New to the forum? Start here for introductions and helpful guides',
  icon = 'Rocket';

-- Update sort order for existing non-sticky categories
UPDATE public.categories
SET sort_order = 100
WHERE id NOT IN ('announcements', 'rules-guidelines', 'getting-started')
  AND sort_order < 100;

-- Re-enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Verify the changes
SELECT 
  id,
  name,
  is_sticky,
  is_important,
  sort_order,
  icon
FROM public.categories
ORDER BY 
  is_sticky DESC,
  is_important DESC,
  sort_order ASC,
  name ASC;
