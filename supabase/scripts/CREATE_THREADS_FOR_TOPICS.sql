-- ============================================================================
-- CREATE REALISTIC THREADS FOR EACH TOPIC
-- ============================================================================

DO $$
DECLARE
  v_user_id TEXT;
BEGIN
  -- Get the first user ID from forum_users
  SELECT id INTO v_user_id FROM public.forum_users LIMIT 1;
  
  -- Only insert threads if we found a user
  IF v_user_id IS NOT NULL THEN
    
    -- TOPIC: Forum Rules (3 threads)
    INSERT INTO public.threads (
      id, title, excerpt, author_id, category_id, topic_id, 
      created_at, last_reply_at, is_pinned, is_locked
    ) VALUES
      (
        't-rules-001',
        'Community Guidelines - Read First!',
        'Essential rules for respectful and productive discussions. Please read before posting.',
        v_user_id, 'announcements', 'topic-rules',
        NOW(), NOW(), true, true
      ),
      (
        't-rules-002',
        'Content Policy & Prohibited Content',
        'What you can and cannot post on this forum. Violations may result in warnings or bans.',
        v_user_id, 'announcements', 'topic-rules',
        NOW(), NOW(), true, true
      ),
      (
        't-rules-003',
        'Reporting & Moderation Process',
        'How to report violations and what to expect from our moderation team.',
        v_user_id, 'announcements', 'topic-rules',
        NOW(), NOW(), true, true
      ),
    
    -- TOPIC: Getting Started (4 threads)
      (
        't-start-001',
        'Welcome! Start Here',
        'New to the forum? This guide will help you get oriented and make your first post.',
        v_user_id, 'announcements', 'topic-getting-started',
        NOW(), NOW(), true, false
      ),
      (
        't-start-002',
        'How to Create Your First Thread',
        'Step-by-step guide to posting your first thread and engaging with the community.',
        v_user_id, 'announcements', 'topic-getting-started',
        NOW(), NOW(), true, false
      ),
      (
        't-start-003',
        'Understanding User Ranks & Reputation',
        'Learn how reputation points work and how to level up your forum rank.',
        v_user_id, 'announcements', 'topic-getting-started',
        NOW(), NOW(), false, false
      ),
      (
        't-start-004',
        'Customizing Your Profile',
        'Tips for setting up your avatar, banner, and profile information.',
        v_user_id, 'announcements', 'topic-getting-started',
        NOW(), NOW(), false, false
      ),
    
    -- TOPIC: How It Works (5 threads)
      (
        't-works-001',
        'Forum Features Overview',
        'Complete guide to all features: threads, replies, upvotes, tags, and more.',
        v_user_id, 'announcements', 'topic-how-it-works',
        NOW(), NOW(), true, false
      ),
      (
        't-works-002',
        'Using Tags Effectively',
        'How to use tags to categorize your threads and make them easier to find.',
        v_user_id, 'announcements', 'topic-how-it-works',
        NOW(), NOW(), false, false
      ),
      (
        't-works-003',
        'Upvoting & Downvoting Guide',
        'When and how to use votes to highlight quality content and helpful replies.',
        v_user_id, 'announcements', 'topic-how-it-works',
        NOW(), NOW(), false, false
      ),
      (
        't-works-004',
        'Pinned & Hot Threads Explained',
        'What makes a thread pinned, hot, or trending? Learn the algorithm behind it.',
        v_user_id, 'announcements', 'topic-how-it-works',
        NOW(), NOW(), false, false
      ),
      (
        't-works-005',
        'Notifications & Activity Feed',
        'Stay updated with replies, mentions, and activity from threads you follow.',
        v_user_id, 'announcements', 'topic-how-it-works',
        NOW(), NOW(), false, false
      ),
    
    -- TOPIC: Welcome & Introductions (3 threads)
      (
        't-welcome-001',
        'Introduce Yourself Here!',
        'New members: tell us about yourself, your interests, and what brought you here.',
        v_user_id, 'announcements', 'topic-welcome',
        NOW(), NOW(), true, false
      ),
      (
        't-welcome-002',
        'What to Expect from This Community',
        'Learn about our community culture, values, and what makes us unique.',
        v_user_id, 'announcements', 'topic-welcome',
        NOW(), NOW(), false, false
      ),
      (
        't-welcome-003',
        'Member Spotlight & Success Stories',
        'Celebrating our community members and their achievements.',
        v_user_id, 'announcements', 'topic-welcome',
        NOW(), NOW(), false, false
      ),
    
    -- TOPIC: Updates & News (5 threads)
      (
        't-updates-001',
        'Latest Platform Updates - February 2026',
        'New features, improvements, and bug fixes released this month.',
        v_user_id, 'announcements', 'topic-updates',
        NOW(), NOW(), true, false
      ),
      (
        't-updates-002',
        'Upcoming Features & Roadmap',
        'Sneak peek at what we are working on and when to expect new features.',
        v_user_id, 'announcements', 'topic-updates',
        NOW(), NOW(), true, false
      ),
      (
        't-updates-003',
        'Community Feedback & Suggestions',
        'Share your ideas for improving the forum. We are listening!',
        v_user_id, 'announcements', 'topic-updates',
        NOW(), NOW(), false, false
      ),
      (
        't-updates-004',
        'Maintenance Schedule & Downtime',
        'Planned maintenance windows and service updates.',
        v_user_id, 'announcements', 'topic-updates',
        NOW(), NOW(), false, false
      ),
      (
        't-updates-005',
        'Security & Privacy Updates',
        'Important information about security improvements and privacy policy changes.',
        v_user_id, 'announcements', 'topic-updates',
        NOW(), NOW(), false, false
      )
    ON CONFLICT (id) DO NOTHING;
    
    -- Update thread counts for each topic
    UPDATE public.topics SET thread_count = 3 WHERE id = 'topic-rules';
    UPDATE public.topics SET thread_count = 4 WHERE id = 'topic-getting-started';
    UPDATE public.topics SET thread_count = 5 WHERE id = 'topic-how-it-works';
    UPDATE public.topics SET thread_count = 3 WHERE id = 'topic-welcome';
    UPDATE public.topics SET thread_count = 5 WHERE id = 'topic-updates';
    
    -- Update category thread count
    UPDATE public.categories SET thread_count = 20 WHERE id = 'announcements';
    
    RAISE NOTICE 'Created 20 threads across 5 topics with author_id: %', v_user_id;
  ELSE
    RAISE NOTICE 'No users found. Please create a user first.';
  END IF;
END $$;

-- Verify the results
SELECT 
  t.id,
  t.title,
  t.topic_id,
  top.name as topic_name,
  t.is_pinned,
  t.is_locked
FROM public.threads t
LEFT JOIN public.topics top ON t.topic_id = top.id
WHERE t.category_id = 'announcements'
ORDER BY t.topic_id, t.created_at;
