-- ============================================================================
-- CREATE 5 TOPICS (SUBCATEGORIES) UNDER ANNOUNCEMENTS CATEGORY
-- ============================================================================

-- Disable RLS temporarily
ALTER TABLE public.topics DISABLE ROW LEVEL SECURITY;

-- Insert 5 topics under the announcements category
INSERT INTO public.topics (
  id,
  category_id,
  name,
  description,
  thread_count,
  post_count,
  last_activity
) VALUES
  (
    'topic-rules',
    'announcements',
    'Forum Rules',
    'Community guidelines and rules that all members must follow',
    0,
    0,
    NOW()
  ),
  (
    'topic-getting-started',
    'announcements',
    'Getting Started',
    'Guides and tutorials for new members to get started',
    0,
    0,
    NOW()
  ),
  (
    'topic-how-it-works',
    'announcements',
    'How It Works',
    'Learn about forum features, mechanics, and how to use them',
    0,
    0,
    NOW()
  ),
  (
    'topic-welcome',
    'announcements',
    'Welcome & Introductions',
    'Introduce yourself and meet other community members',
    0,
    0,
    NOW()
  ),
  (
    'topic-updates',
    'announcements',
    'Updates & News',
    'Latest announcements, updates, and important news',
    0,
    0,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for topics
DROP POLICY IF EXISTS "topics_select" ON public.topics;
CREATE POLICY "topics_select" ON public.topics 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "topics_insert" ON public.topics;
CREATE POLICY "topics_insert" ON public.topics 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "topics_update" ON public.topics;
CREATE POLICY "topics_update" ON public.topics 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Re-enable RLS
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Verify the results
SELECT 
  id,
  category_id,
  name,
  description,
  thread_count
FROM public.topics
WHERE category_id = 'announcements'
ORDER BY id;
