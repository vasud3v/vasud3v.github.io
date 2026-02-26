-- ============================================================================
-- ABSOLUTE NUCLEAR OPTION - Delete Everything with CASCADE
-- ============================================================================

-- First, let's see what we have
SELECT 'BEFORE:' as status;
SELECT id, name FROM public.categories ORDER BY id;

-- Drop and recreate the categories table to bypass all constraints
DROP TABLE IF EXISTS public.categories CASCADE;

-- Recreate categories table
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  thread_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_sticky BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate topics table (CASCADE should have dropped it, but just in case)
DROP TABLE IF EXISTS public.topics CASCADE;
CREATE TABLE public.topics (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thread_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_post_by TEXT
);

-- Insert only the general category
INSERT INTO public.categories (id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important, sort_order) 
VALUES ('general', 'General Discussion', 'General discussions and community talk', 'MessageSquare', 0, 0, NOW(), false, false, 1);

-- Recreate the foreign key constraint on threads
ALTER TABLE public.threads 
ADD CONSTRAINT threads_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;

-- Show final state
SELECT 'AFTER:' as status;
SELECT id, name, thread_count, post_count FROM public.categories ORDER BY id;
