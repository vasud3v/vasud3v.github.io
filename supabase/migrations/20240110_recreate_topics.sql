-- ============================================================================
-- Recreate topics table to fix relationship with categories
-- ============================================================================

-- Drop topics table if it exists (it should have been dropped by CASCADE)
DROP TABLE IF EXISTS public.topics CASCADE;

-- Recreate topics table with proper foreign key
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

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_topics_category ON public.topics(category_id);

-- Verify the relationship exists
SELECT 
  'Relationship verified' as status,
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conname = 'topics_category_id_fkey';
