-- Update forum_users to store custom avatar/banner directly
-- This simplifies the system and ensures avatars update everywhere

-- Add custom_avatar and custom_banner columns to forum_users if they don't exist
ALTER TABLE public.forum_users 
ADD COLUMN IF NOT EXISTS custom_avatar TEXT,
ADD COLUMN IF NOT EXISTS custom_banner TEXT;

-- Migrate existing profile_customizations data to forum_users
UPDATE public.forum_users fu
SET 
  custom_avatar = pc.custom_avatar,
  custom_banner = pc.custom_banner
FROM public.profile_customizations pc
WHERE fu.id = pc.user_id;

-- Add a comment explaining the columns
COMMENT ON COLUMN public.forum_users.custom_avatar IS 'User-uploaded custom avatar, overrides the default avatar';
COMMENT ON COLUMN public.forum_users.custom_banner IS 'User-uploaded custom banner for profile page';

-- Verify the migration
DO $$
DECLARE
  users_with_custom INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_with_custom 
  FROM public.forum_users 
  WHERE custom_avatar IS NOT NULL OR custom_banner IS NOT NULL;
  
  RAISE NOTICE 'Users with custom avatars/banners: %', users_with_custom;
END $$;

-- Enable realtime for forum_users table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_users;
