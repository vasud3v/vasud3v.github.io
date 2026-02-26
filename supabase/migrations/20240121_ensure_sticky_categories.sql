-- ============================================================================
-- Ensure Sticky Categories Exist
-- ============================================================================
-- This migration ensures categories exist and marks important ones as sticky
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Temporarily disable RLS
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- First, let's create/update the important sticky categories
-- Announcements (Sticky + Important)
INSERT INTO public.categories (
  id, name, description, icon, 
  thread_count, post_count, last_activity,
  is_sticky, is_important, sort_order, created_at
) VALUES (
  'announcements',
  '📢 Announcements',
  'Official announcements, updates, and important news from the team',
  'Newspaper',
  0, 0, NOW(),
  true, true, 1, NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = '📢 Announcements',
  is_sticky = true,
  is_important = true,
  sort_order = 1;

-- Rules & Guidelines (Sticky + Important)
INSERT INTO public.categories (
  id, name, description, icon,
  thread_count, post_count, last_activity,
  is_sticky, is_important, sort_order, created_at
) VALUES (
  'rules-guidelines',
  '📋 Rules & Guidelines',
  'Forum rules, community guidelines, and best practices - Read before posting!',
  'Shield',
  0, 0, NOW(),
  true, true, 2, NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = '📋 Rules & Guidelines',
  is_sticky = true,
  is_important = true,
  sort_order = 2;

-- Getting Started (Sticky)
INSERT INTO public.categories (
  id, name, description, icon,
  thread_count, post_count, last_activity,
  is_sticky, is_important, sort_order, created_at
) VALUES (
  'getting-started',
  '🚀 Getting Started',
  'New to the forum? Start here for introductions and helpful guides',
  'Rocket',
  0, 0, NOW(),
  true, false, 3, NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = '🚀 Getting Started',
  is_sticky = true,
  is_important = false,
  sort_order = 3;

-- Also update the existing moderator category if it exists
UPDATE public.categories
SET 
  is_sticky = true,
  is_important = true,
  sort_order = 0
WHERE id = 'cat-moderators';

-- Create General Discussion if it doesn't exist
INSERT INTO public.categories (
  id, name, description, icon,
  thread_count, post_count, last_activity,
  is_sticky, is_important, sort_order, created_at
) VALUES (
  'general',
  'General Discussion',
  'Off-topic conversations, introductions, and community talk',
  'MessageSquare',
  0, 0, NOW(),
  false, false, 100, NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create Technical Support if it doesn't exist
INSERT INTO public.categories (
  id, name, description, icon,
  thread_count, post_count, last_activity,
  is_sticky, is_important, sort_order, created_at
) VALUES (
  'tech-support',
  'Technical Support',
  'Get help with coding problems, debugging, and technical issues',
  'Wrench',
  0, 0, NOW(),
  false, false, 101, NOW()
) ON CONFLICT (id) DO NOTHING;

-- Update sort order for all other non-sticky categories
UPDATE public.categories
SET sort_order = 100 + (
  SELECT COUNT(*) 
  FROM public.categories c2 
  WHERE c2.id < public.categories.id 
  AND c2.is_sticky = false
)
WHERE is_sticky = false 
AND sort_order < 100;

-- Re-enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Show results
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
