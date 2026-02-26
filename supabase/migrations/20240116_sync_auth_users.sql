-- Sync existing auth.users to forum_users
-- This ensures all authenticated users have a forum_users record

-- Insert forum_users records for any auth.users that don't have one
INSERT INTO public.forum_users (id, username, avatar, post_count, reputation, is_online, rank, join_date)
SELECT 
  au.id::text,
  COALESCE(
    au.raw_user_meta_data->>'username',
    SPLIT_PART(au.email, '@', 1),
    'user_' || SUBSTRING(au.id::text, 1, 8)
  ) as username,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || 
    COALESCE(
      au.raw_user_meta_data->>'username',
      SPLIT_PART(au.email, '@', 1),
      'user_' || SUBSTRING(au.id::text, 1, 8)
    ) || '&backgroundColor=1a1a1a' as avatar,
  0 as post_count,
  0 as reputation,
  true as is_online,
  'Newcomer' as rank,
  au.created_at as join_date
FROM auth.users au
LEFT JOIN public.forum_users fu ON au.id::text = fu.id
WHERE fu.id IS NULL;

-- Verify the sync
DO $$
DECLARE
  auth_count INTEGER;
  forum_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO forum_count FROM public.forum_users;
  
  RAISE NOTICE 'Auth users: %', auth_count;
  RAISE NOTICE 'Forum users: %', forum_count;
  
  IF auth_count = forum_count THEN
    RAISE NOTICE 'All auth users synced successfully!';
  ELSE
    RAISE WARNING 'Mismatch: % auth users but % forum users', auth_count, forum_count;
  END IF;
END $$;
