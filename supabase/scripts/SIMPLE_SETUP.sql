-- Copy and paste this ENTIRE content into Supabase SQL Editor and click Run

-- Disable RLS
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Clear existing (optional)
TRUNCATE public.categories CASCADE;

-- Insert categories
INSERT INTO public.categories (id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important, sort_order, created_at) VALUES
('announcements', 'Announcements', 'Official announcements and news', 'Newspaper', 0, 0, NOW(), true, true, 1, NOW()),
('rules', 'Rules & Guidelines', 'Forum rules and guidelines', 'Shield', 0, 0, NOW(), true, true, 2, NOW()),
('getting-started', 'Getting Started', 'New member introductions', 'Rocket', 0, 0, NOW(), true, false, 3, NOW()),
('general', 'General Discussion', 'General conversations', 'MessageSquare', 0, 0, NOW(), false, false, 100, NOW()),
('tech-support', 'Technical Support', 'Get technical help', 'Wrench', 0, 0, NOW(), false, false, 101, NOW());

-- Add policies
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
CREATE POLICY "categories_insert" ON public.categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "categories_update" ON public.categories;
CREATE POLICY "categories_update" ON public.categories FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Re-enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Show results
SELECT id, name, is_sticky, is_important, sort_order FROM public.categories ORDER BY is_sticky DESC, sort_order;
