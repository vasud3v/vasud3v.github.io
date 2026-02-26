-- ============================================================================
-- UPDATE EXISTING RULES POSTS WITH IMPROVED CONTENT
-- ============================================================================

DO $$
BEGIN
  -- Update post for "Community Guidelines - Read First!"
  UPDATE public.posts
  SET content = 'Welcome to our community! These rules help maintain a productive, respectful, and helpful environment for everyone.

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
   Use English as the primary language for posts and threads to ensure everyone can participate. Code comments and technical terms in other languages are acceptable.'
  WHERE id = 'post-rules-001-1';

  UPDATE public.posts
  SET content = 'Quick reminder: If you see content that violates these rules, please use the report button rather than engaging. Our moderation team reviews all reports within 24 hours. Thank you for helping keep our community safe!'
  WHERE id = 'post-rules-001-2';

  -- Update post for "Content Policy & Prohibited Content"
  UPDATE public.posts
  SET content = '**Posting Guidelines - Creating quality content:**

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
    When your question is answered, mark the helpful reply as the solution. Give credit to those who help you. This helps future users with similar problems.'
  WHERE id = 'post-rules-002-1';

  -- Update or insert post for "Reporting & Moderation Process"
  UPDATE public.posts
  SET content = '**Community Standards - What we don''t allow:**

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
    Don''t ask others to complete your homework, assignments, or paid projects. We''ll help you learn and debug, but we won''t do your work for you.'
  WHERE id = 'post-rules-003-1';

  -- Insert or update second post for moderation thread
  INSERT INTO public.posts (id, thread_id, content, author_id, created_at, upvotes)
  SELECT 
    'post-rules-003-2',
    't-rules-003',
    '**Enforcement & Consequences:**

• First Violation: Official warning via private message with explanation
• Second Violation: 3-7 day temporary suspension + content removal
• Third Violation: 30-day suspension + reputation reset
• Severe Violations: Immediate permanent ban (harassment, illegal content, doxxing)

Note: Moderators may adjust penalties based on context, intent, and violation history. Repeat offenders face escalating consequences.

**Appeals & Questions:**
If you believe a moderation decision was unfair, submit an appeal via the Moderation Appeals thread within 7 days. Appeals are reviewed by a different moderator within 48-72 hours.',
    (SELECT id FROM public.forum_users LIMIT 1),
    NOW() + interval '1 hour',
    7
  WHERE NOT EXISTS (SELECT 1 FROM public.posts WHERE id = 'post-rules-003-2');

  -- Update thread reply counts
  UPDATE public.threads SET reply_count = 2, last_reply_at = NOW() WHERE id = 't-rules-001';
  UPDATE public.threads SET reply_count = 1, last_reply_at = NOW() WHERE id = 't-rules-002';
  UPDATE public.threads SET reply_count = 2, last_reply_at = NOW() WHERE id = 't-rules-003';

  RAISE NOTICE 'Updated rules posts with improved content';
END $$;

-- Verify the updates
SELECT 
  p.id,
  t.title as thread_title,
  LEFT(p.content, 80) as content_preview,
  p.upvotes
FROM public.posts p
JOIN public.threads t ON p.thread_id = t.id
WHERE t.id IN ('t-rules-001', 't-rules-002', 't-rules-003')
ORDER BY t.id, p.created_at;
