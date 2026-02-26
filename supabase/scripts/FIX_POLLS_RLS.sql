-- Fix RLS policies for polls and related tables

-- Check if tables exist first
DO $$
BEGIN
  -- Polls table
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'polls') THEN
    DROP POLICY IF EXISTS "polls_select" ON public.polls;
    CREATE POLICY "polls_select" ON public.polls 
      FOR SELECT 
      USING (true);
    
    DROP POLICY IF EXISTS "polls_insert" ON public.polls;
    CREATE POLICY "polls_insert" ON public.polls 
      FOR INSERT 
      WITH CHECK (auth.uid() IS NOT NULL);
    
    ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Fixed RLS for polls table';
  ELSE
    RAISE NOTICE 'polls table does not exist';
  END IF;

  -- Poll options table
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'poll_options') THEN
    DROP POLICY IF EXISTS "poll_options_select" ON public.poll_options;
    CREATE POLICY "poll_options_select" ON public.poll_options 
      FOR SELECT 
      USING (true);
    
    DROP POLICY IF EXISTS "poll_options_insert" ON public.poll_options;
    CREATE POLICY "poll_options_insert" ON public.poll_options 
      FOR INSERT 
      WITH CHECK (auth.uid() IS NOT NULL);
    
    ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Fixed RLS for poll_options table';
  ELSE
    RAISE NOTICE 'poll_options table does not exist';
  END IF;

  -- Poll votes table
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'poll_votes') THEN
    DROP POLICY IF EXISTS "poll_votes_select" ON public.poll_votes;
    CREATE POLICY "poll_votes_select" ON public.poll_votes 
      FOR SELECT 
      USING (true);
    
    DROP POLICY IF EXISTS "poll_votes_insert" ON public.poll_votes;
    CREATE POLICY "poll_votes_insert" ON public.poll_votes 
      FOR INSERT 
      WITH CHECK (auth.uid() IS NOT NULL);
    
    ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Fixed RLS for poll_votes table';
  ELSE
    RAISE NOTICE 'poll_votes table does not exist';
  END IF;
END $$;

-- Verify policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('polls', 'poll_options', 'poll_votes')
ORDER BY tablename, policyname;

-- Check which tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('polls', 'poll_options', 'poll_votes')
ORDER BY tablename;
