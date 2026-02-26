-- ============================================================================
-- CREATE REALISTIC POSTS (REPLIES) FOR THREADS
-- ============================================================================

DO $$
DECLARE
  v_user_id TEXT;
BEGIN
  -- Get the first user ID
  SELECT id INTO v_user_id FROM public.forum_users LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    
    -- Posts for "Community Guidelines - Read First!"
    INSERT INTO public.posts (id, thread_id, content, author_id, created_at, upvotes) VALUES
      ('post-rules-001-1', 't-rules-001', 
       'Welcome to our community! These rules help maintain a productive, respectful, and helpful environment for everyone.

**Community Guidelines - How we treat each other:**

1. **Be Respectful & Constructive** [CRITICAL]
   Treat all members with respect regardless of experience level. Disagree with ideas, not people. Personal attacks, harassment, hate speech, or discriminatory language will result in immediate action.

2. **No Personal Information Sharing** [CRITICAL]
   Never share personal information (real names, addresses, phone numbers, emails, social media accounts) of yourself or others. Protect your privacy and respect others'' privacy.

3. **Keep Content Appropriate** [CRITICAL]
   This is a professional community. No NSFW content, graphic violence, illegal activities, or content that violates intellectual property rights. Keep discussions work-safe.

4. **One Account Per Person** [CRITICAL]
   Creating multiple accounts to manipulate votes, evade bans, or impersonate others is prohibited. If you need to change your username, contact a moderator.

5. **English Language Primary** [MODERATE]
   Use English as the primary language for posts and threads to ensure everyone can participate. Code comments and technical terms in other languages are acceptable.', 
       v_user_id, NOW(), 15),
      
      ('post-rules-001-2', 't-rules-001',
       'Quick reminder: If you see content that violates these rules, please use the report button rather than engaging. Our moderation team reviews all reports within 24 hours. Thank you for helping keep our community safe!',
       v_user_id, NOW() + interval '2 hours', 8);
    
    -- Posts for "Content Policy & Prohibited Content"
    INSERT INTO public.posts (id, thread_id, content, author_id, created_at, upvotes) VALUES
      ('post-rules-002-1', 't-rules-002',
       '**Posting Guidelines - Creating quality content:**

6. **Write Clear, Descriptive Titles** [IMPORTANT]
   Titles should summarize your question or topic. Bad: "Help!", "Error", "Question". Good: "React useState not updating after API call", "Best practices for PostgreSQL indexing".

7. **Choose the Right Category** [MODERATE]
   Post threads in the most relevant category. Use tags to add context. Misplaced threads may be moved by moderators. Check category descriptions before posting.

8. **Search Before Asking** [IMPORTANT]
   Use the search function to check if your question has been answered. Duplicate threads clutter the forum and waste everyone''s time. Link to related threads when relevant.

9. **Provide Context & Details** [IMPORTANT]
   Include relevant information: what you''re trying to do, what you''ve tried, error messages, code snippets, environment details. The more context you provide, the better help you''ll receive.

10. **Format Code & Errors Properly** [IMPORTANT]
    Use code blocks with syntax highlighting for code snippets. Include complete error messages and stack traces. Format makes your post readable and helps others assist you faster.

11. **Stay On Topic** [MODERATE]
    Keep replies relevant to the thread topic. If discussion naturally diverges, create a new thread and link to it. Off-topic derailing disrupts productive conversations.

12. **Mark Solutions & Give Credit** [MODERATE]
    When your question is answered, mark the helpful reply as the solution. Give credit to those who help you. This helps future users with similar problems.',
       v_user_id, NOW(), 12);
    
    -- Posts for "Reporting & Moderation Process"
    INSERT INTO public.posts (id, thread_id, content, author_id, created_at, upvotes) VALUES
      ('post-rules-003-1', 't-rules-003',
       '**Community Standards - What we don''t allow:**

13. **No Spam or Low-Effort Posts** [IMPORTANT]
    Don''t post repetitive content, one-word replies, or "+1" comments. Use the upvote button instead. Contribute meaningful value to discussions.

14. **Self-Promotion Guidelines** [IMPORTANT]
    Sharing your projects is welcome in the Showcase category. Don''t spam links to your products, services, or social media. Contribute to the community before promoting.

15. **No Asking for Upvotes or Reputation** [CRITICAL]
    Don''t ask for upvotes, reputation points, or manipulate the voting system. Earn reputation through quality contributions. Vote manipulation results in penalties.

16. **Respect Intellectual Property** [CRITICAL]
    Don''t share pirated software, leaked content, or proprietary code without permission. Give proper attribution when using others'' work. Respect open-source licenses.

17. **No Backseat Moderating** [MODERATE]
    Don''t act as a moderator if you aren''t one. Use the report button to flag rule violations. Publicly calling out users or issuing warnings creates unnecessary drama.

18. **No Homework or Paid Work Requests** [IMPORTANT]
    Don''t ask others to complete your homework, assignments, or paid projects. We''ll help you learn and debug, but we won''t do your work for you.',
       v_user_id, NOW(), 10),
      
      ('post-rules-003-2', 't-rules-003',
       '**Enforcement & Consequences:**

• First Violation: Official warning via private message with explanation
• Second Violation: 3-7 day temporary suspension + content removal
• Third Violation: 30-day suspension + reputation reset
• Severe Violations: Immediate permanent ban (harassment, illegal content, doxxing)

Note: Moderators may adjust penalties based on context, intent, and violation history. Repeat offenders face escalating consequences.

**Appeals & Questions:**
If you believe a moderation decision was unfair, submit an appeal via the Moderation Appeals thread within 7 days. Appeals are reviewed by a different moderator within 48-72 hours.',
       v_user_id, NOW() + interval '1 hour', 7);
    
    -- Posts for "Welcome! Start Here"
    INSERT INTO public.posts (id, thread_id, content, author_id, created_at, upvotes) VALUES
      ('post-start-001-1', 't-start-001',
       'Welcome to the forum! Here''s what you should do first:

1. Read the forum rules (pinned in Forum Rules topic)
2. Complete your profile with an avatar
3. Introduce yourself in the Welcome topic
4. Browse existing threads to get a feel for the community
5. Post your first question or discussion

Don''t be shy - everyone here was new once. We''re a friendly community!',
       v_user_id, NOW(), 25),
      
      ('post-start-001-2', 't-start-001',
       'Pro tip: Use the search function before posting a new thread. Your question might already be answered! This helps keep the forum organized and makes it easier for everyone to find information.',
       v_user_id, NOW() + interval '1 hour', 18),
      
      ('post-start-001-3', 't-start-001',
       'If you need help navigating the forum, check out the "How It Works" topic. It has detailed guides on all features including tags, upvotes, and notifications.',
       v_user_id, NOW() + interval '3 hours', 10);
    
    -- Posts for "How to Create Your First Thread"
    INSERT INTO public.posts (id, thread_id, content, author_id, created_at, upvotes) VALUES
      ('post-start-002-1', 't-start-002',
       'Creating your first thread is easy! Here''s the process:

1. Click the "New Thread" button (usually a + icon)
2. Choose the appropriate category and topic
3. Write a clear, descriptive title
4. Add your content in the editor
5. Add relevant tags (optional but recommended)
6. Click "Post"

Your thread will appear immediately and other members can start replying!',
       v_user_id, NOW(), 20),
      
      ('post-start-002-2', 't-start-002',
       'Title tips: Make it specific and searchable. Instead of "Help needed", try "How do I reset my password?" Good titles get more views and better responses.',
       v_user_id, NOW() + interval '30 minutes', 14);
    
    -- Posts for "Forum Features Overview"
    INSERT INTO public.posts (id, thread_id, content, author_id, created_at, upvotes) VALUES
      ('post-works-001-1', 't-works-001',
       'Our forum has many features to enhance your experience:

📝 Threads & Replies: Start discussions and respond to others
⬆️ Upvotes/Downvotes: Highlight quality content
🏷️ Tags: Categorize and find threads easily
📌 Pinned Threads: Important threads stay at the top
🔥 Hot Threads: Trending discussions based on activity
👤 User Profiles: Customize your presence
🏆 Reputation System: Earn points for contributions
🔔 Notifications: Stay updated on replies and mentions

Explore each feature to get the most out of the forum!',
       v_user_id, NOW(), 30);
    
    -- Posts for "Using Tags Effectively"
    INSERT INTO public.posts (id, thread_id, content, author_id, created_at, upvotes) VALUES
      ('post-works-002-1', 't-works-002',
       'Tags help organize content and make threads discoverable. Best practices:

✓ Use 2-5 relevant tags per thread
✓ Choose existing tags when possible
✓ Be specific (use "javascript" not just "coding")
✓ Use lowercase for consistency
✗ Don''t spam tags
✗ Don''t use tags as keywords

Popular tags: #help #discussion #tutorial #question #showcase',
       v_user_id, NOW(), 16);
    
    -- Posts for "Introduce Yourself Here!"
    INSERT INTO public.posts (id, thread_id, content, author_id, created_at, upvotes) VALUES
      ('post-welcome-001-1', 't-welcome-001',
       'Hi everyone! I''m excited to join this community. I''m a developer interested in web technologies and always eager to learn. Looking forward to great discussions!',
       v_user_id, NOW(), 12),
      
      ('post-welcome-001-2', 't-welcome-001',
       'Welcome! Great to have you here. Don''t hesitate to ask questions - we''re all here to help each other grow.',
       v_user_id, NOW() + interval '15 minutes', 8),
      
      ('post-welcome-001-3', 't-welcome-001',
       'Hello from another new member! This forum seems really active and helpful. Can''t wait to contribute!',
       v_user_id, NOW() + interval '45 minutes', 6);
    
    -- Posts for "Latest Platform Updates - February 2026"
    INSERT INTO public.posts (id, thread_id, content, author_id, created_at, upvotes, is_answer) VALUES
      ('post-updates-001-1', 't-updates-001',
       'February 2026 Update - What''s New:

🎉 New Features:
• Improved search with filters
• Dark mode theme option
• Markdown support in posts
• Image upload in replies
• Thread bookmarking

🔧 Improvements:
• Faster page load times
• Better mobile responsiveness
• Enhanced notification system

🐛 Bug Fixes:
• Fixed avatar upload issues
• Resolved pagination bugs
• Corrected timestamp displays

Thanks for your continued support!',
       v_user_id, NOW(), 45, true);
    
    INSERT INTO public.posts (id, thread_id, content, author_id, created_at, upvotes) VALUES
      ('post-updates-001-2', 't-updates-001',
       'Love the dark mode! My eyes thank you 😊',
       v_user_id, NOW() + interval '20 minutes', 22),
      
      ('post-updates-001-3', 't-updates-001',
       'The markdown support is a game changer for technical discussions. Great update!',
       v_user_id, NOW() + interval '1 hour', 18);
    
    -- Posts for "Community Feedback & Suggestions"
    INSERT INTO public.posts (id, thread_id, content, author_id, created_at, upvotes) VALUES
      ('post-updates-003-1', 't-updates-003',
       'We value your feedback! Share your suggestions for improving the forum here. Popular requests we''re considering:

• Private messaging system
• Thread drafts/autosave
• Advanced user search
• Custom user badges
• Thread templates

What features would you like to see? Vote on existing suggestions or propose new ones!',
       v_user_id, NOW(), 28),
      
      ('post-updates-003-2', 't-updates-003',
       'Would love to see a private messaging feature! Sometimes you need to have one-on-one conversations.',
       v_user_id, NOW() + interval '30 minutes', 15),
      
      ('post-updates-003-3', 't-updates-003',
       '+1 for thread drafts. I often start writing a post and need to come back to it later.',
       v_user_id, NOW() + interval '2 hours', 12);
    
    -- Update reply counts for threads
    UPDATE public.threads SET reply_count = 2, last_reply_at = NOW() WHERE id = 't-rules-001';
    UPDATE public.threads SET reply_count = 1, last_reply_at = NOW() WHERE id = 't-rules-002';
    UPDATE public.threads SET reply_count = 2, last_reply_at = NOW() WHERE id = 't-rules-003';
    UPDATE public.threads SET reply_count = 3, last_reply_at = NOW() WHERE id = 't-start-001';
    UPDATE public.threads SET reply_count = 2, last_reply_at = NOW() WHERE id = 't-start-002';
    UPDATE public.threads SET reply_count = 1, last_reply_at = NOW() WHERE id = 't-works-001';
    UPDATE public.threads SET reply_count = 1, last_reply_at = NOW() WHERE id = 't-works-002';
    UPDATE public.threads SET reply_count = 3, last_reply_at = NOW() WHERE id = 't-welcome-001';
    UPDATE public.threads SET reply_count = 3, last_reply_at = NOW() WHERE id = 't-updates-001';
    UPDATE public.threads SET reply_count = 3, last_reply_at = NOW() WHERE id = 't-updates-003';
    
    -- Update post counts for topics
    UPDATE public.topics SET post_count = 5 WHERE id = 'topic-rules';
    UPDATE public.topics SET post_count = 5 WHERE id = 'topic-getting-started';
    UPDATE public.topics SET post_count = 2 WHERE id = 'topic-how-it-works';
    UPDATE public.topics SET post_count = 3 WHERE id = 'topic-welcome';
    UPDATE public.topics SET post_count = 6 WHERE id = 'topic-updates';
    
    -- Update category post count
    UPDATE public.categories SET post_count = 21 WHERE id = 'announcements';
    
    RAISE NOTICE 'Created 21 posts across multiple threads';
  ELSE
    RAISE NOTICE 'No users found';
  END IF;
END $$;

-- Add RLS policy for posts if not exists
DROP POLICY IF EXISTS "posts_select" ON public.posts;
CREATE POLICY "posts_select" ON public.posts 
  FOR SELECT 
  USING (true);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Verify results
SELECT 
  p.id,
  t.title as thread_title,
  LEFT(p.content, 50) as content_preview,
  p.upvotes,
  p.is_answer
FROM public.posts p
JOIN public.threads t ON p.thread_id = t.id
WHERE t.category_id = 'announcements'
ORDER BY p.created_at;
