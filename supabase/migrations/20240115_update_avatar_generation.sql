-- Update avatar generation to use DiceBear API instead of Unsplash
-- This migration updates the trigger function to generate avatars based on username

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Determine username
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1),
    'user_' || SUBSTRING(NEW.id::text, 1, 8)
  );
  
  -- Insert a new forum_users record for the newly created auth user
  -- Using DiceBear API for avatar generation based on username
  INSERT INTO public.forum_users (id, username, avatar, post_count, reputation, is_online, rank)
  VALUES (
    NEW.id,
    user_name,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || user_name || '&backgroundColor=1a1a1a',
    0,
    0,
    true,
    'Newcomer'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users with Unsplash avatars to use generated avatars
UPDATE public.forum_users
SET avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || username || '&backgroundColor=1a1a1a'
WHERE avatar LIKE '%unsplash%';
