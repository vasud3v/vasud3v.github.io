-- Ensure forum_users table has realtime enabled and custom columns exist

-- Add custom columns if they don't exist
ALTER TABLE public.forum_users 
ADD COLUMN IF NOT EXISTS custom_avatar TEXT,
ADD COLUMN IF NOT EXISTS custom_banner TEXT;

-- Drop the publication if it exists and recreate it
DO $$
BEGIN
  -- Try to add the table to the publication
  -- This will fail silently if already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_users;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'forum_users already in supabase_realtime publication';
  END;
END $$;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'forum_users';

-- Show current columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'forum_users' 
AND column_name IN ('custom_avatar', 'custom_banner', 'avatar', 'banner');
