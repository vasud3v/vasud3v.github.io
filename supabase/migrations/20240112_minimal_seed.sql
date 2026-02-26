-- ============================================================================
-- Minimal Seed Data for Testing
-- This creates just enough data to test the forum functionality
-- ============================================================================

-- Insert a few test users (if they don't exist)
INSERT INTO public.forum_users (id, username, avatar, post_count, reputation, is_online, rank) VALUES
  ('test-user-1', 'TestUser1', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&q=80', 10, 150, true, 'Member'),
  ('test-user-2', 'TestUser2', 'https://images.unsplash.com/photo-1599566150163-29194dcabd9c?w=96&q=80', 25, 320, true, 'Member'),
  ('test-user-3', 'TestUser3', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=96&q=80', 50, 780, false, 'Senior Member')
ON CONFLICT (id) DO NOTHING;

-- Insert a test category
INSERT INTO public.categories (id, name, description, icon, thread_count, post_count, last_activity) VALUES
  ('test-cat-1', 'General Discussion', 'General topics and discussions', 'MessageSquare', 0, 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert a test topic
INSERT INTO public.topics (id, category_id, name, description, thread_count, post_count, last_activity) VALUES
  ('test-topic-1', 'test-cat-1', 'General', 'General discussions', 0, 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert a test thread
INSERT INTO public.threads (
  id, title, excerpt, author_id, category_id, topic_id, 
  created_at, last_reply_at, last_reply_by_id, reply_count, view_count,
  is_pinned, is_locked, is_hot, has_unread, upvotes, downvotes
) VALUES
  (
    'test-thread-1',
    'Welcome to the Forum!',
    'This is a test thread to verify the forum is working correctly.',
    'test-user-1',
    'test-cat-1',
    'test-topic-1',
    NOW(),
    NOW(),
    'test-user-1',
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    0
  )
ON CONFLICT (id) DO NOTHING;

-- Insert a test post (initial post for the thread)
INSERT INTO public.posts (
  id, thread_id, content, author_id, created_at, 
  likes, upvotes, downvotes, is_answer
) VALUES
  (
    'test-post-1',
    'test-thread-1',
    'Welcome to the forum! This is a test post to verify everything is working correctly.',
    'test-user-1',
    NOW(),
    0,
    0,
    0,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- Update category counts
UPDATE public.categories 
SET thread_count = 1, post_count = 1 
WHERE id = 'test-cat-1';

-- Update topic counts
UPDATE public.topics 
SET thread_count = 1, post_count = 1 
WHERE id = 'test-topic-1';
