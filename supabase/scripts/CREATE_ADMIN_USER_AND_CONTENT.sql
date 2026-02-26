-- ============================================================================
-- CREATE MULTIPLE MODERATOR/ADMIN USERS AND DISTRIBUTE CONTENT
-- ============================================================================

DO $$
DECLARE
  v_admin_id TEXT := 'admin-system';
  v_mod1_id TEXT := 'mod-sarah';
  v_mod2_id TEXT := 'mod-james';
  v_mod3_id TEXT := 'mod-alex';
  v_user_ids TEXT[] := ARRAY[v_admin_id, v_mod1_id, v_mod2_id, v_mod3_id];
  v_thread_ids TEXT[];
  v_post_ids TEXT[];
  v_idx INTEGER;
BEGIN
  -- Create admin user
  INSERT INTO public.forum_users (
    id,
    username,
    avatar,
    post_count,
    reputation,
    rank,
    join_date,
    is_online
  ) VALUES (
    v_admin_id,
    'Forum Admin',
    'https://api.dicebear.com/7.x/bottts/svg?seed=admin&backgroundColor=4f46e5',
    50,
    1000,
    'Administrator',
    NOW() - interval '1 year',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar = EXCLUDED.avatar,
    rank = EXCLUDED.rank;

  -- Create moderator 1
  INSERT INTO public.forum_users (
    id,
    username,
    avatar,
    post_count,
    reputation,
    rank,
    join_date,
    is_online
  ) VALUES (
    v_mod1_id,
    'Sarah',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah&backgroundColor=ec4899',
    30,
    750,
    'Moderator',
    NOW() - interval '8 months',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar = EXCLUDED.avatar,
    rank = EXCLUDED.rank;

  -- Create moderator 2
  INSERT INTO public.forum_users (
    id,
    username,
    avatar,
    post_count,
    reputation,
    rank,
    join_date,
    is_online
  ) VALUES (
    v_mod2_id,
    'James',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=james&backgroundColor=10b981',
    25,
    680,
    'Moderator',
    NOW() - interval '6 months',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar = EXCLUDED.avatar,
    rank = EXCLUDED.rank;

  -- Create moderator 3
  INSERT INTO public.forum_users (
    id,
    username,
    avatar,
    post_count,
    reputation,
    rank,
    join_date,
    is_online
  ) VALUES (
    v_mod3_id,
    'Alex',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=alex&backgroundColor=f59e0b',
    20,
    620,
    'Moderator',
    NOW() - interval '5 months',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar = EXCLUDED.avatar,
    rank = EXCLUDED.rank;

  -- Get all thread IDs from announcements category
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_thread_ids
  FROM public.threads
  WHERE category_id = 'announcements';

  -- Distribute threads among moderators
  IF v_thread_ids IS NOT NULL THEN
    FOR v_idx IN 1..array_length(v_thread_ids, 1) LOOP
      UPDATE public.threads
      SET author_id = v_user_ids[((v_idx - 1) % 4) + 1]
      WHERE id = v_thread_ids[v_idx];
    END LOOP;
  END IF;

  -- Get all post IDs from announcements threads
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_post_ids
  FROM public.posts
  WHERE thread_id IN (SELECT id FROM public.threads WHERE category_id = 'announcements');

  -- Distribute posts among moderators
  IF v_post_ids IS NOT NULL THEN
    FOR v_idx IN 1..array_length(v_post_ids, 1) LOOP
      UPDATE public.posts
      SET author_id = v_user_ids[((v_idx - 1) % 4) + 1]
      WHERE id = v_post_ids[v_idx];
    END LOOP;
  END IF;

  -- Update post counts for all moderators
  UPDATE public.forum_users
  SET post_count = (
    SELECT COUNT(*) FROM public.posts WHERE author_id = forum_users.id
  ) + (
    SELECT COUNT(*) FROM public.threads WHERE author_id = forum_users.id
  )
  WHERE id = ANY(v_user_ids);

  RAISE NOTICE 'Created 4 moderators and distributed content among them';
END $$;

-- Verify the results - show all moderators
SELECT 
  u.username,
  u.rank,
  u.reputation,
  u.is_online,
  COUNT(DISTINCT t.id) as thread_count,
  COUNT(DISTINCT p.id) as post_count
FROM public.forum_users u
LEFT JOIN public.threads t ON t.author_id = u.id
LEFT JOIN public.posts p ON p.author_id = u.id
WHERE u.rank IN ('Administrator', 'Moderator')
GROUP BY u.id, u.username, u.rank, u.reputation, u.is_online
ORDER BY u.reputation DESC;

-- Show sample threads with different authors
SELECT 
  t.id,
  t.title,
  u.username as author,
  u.rank
FROM public.threads t
JOIN public.forum_users u ON t.author_id = u.id
WHERE t.category_id = 'announcements'
ORDER BY t.created_at
LIMIT 10;
