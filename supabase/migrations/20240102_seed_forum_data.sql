-- ============================================================================
-- Seed Forum Users
-- ============================================================================
INSERT INTO public.forum_users (id, username, avatar, post_count, reputation, join_date, is_online, rank) VALUES
  ('u1', 'cyb3rn0va', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&q=80', 1847, 4250, '2022-03-15', true, 'Elite Hacker'),
  ('u2', 'null_ptr', 'https://images.unsplash.com/photo-1599566150163-29194dcabd9c?w=96&q=80', 923, 2180, '2022-08-01', true, 'Code Ninja'),
  ('u3', 'rootkit_dev', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=96&q=80', 3412, 7890, '2021-01-10', false, 'Administrator'),
  ('u4', 'pixel_witch', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&q=80', 567, 1340, '2023-05-22', true, 'Member'),
  ('u5', 'syntax_err0r', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&q=80', 2156, 5100, '2021-11-03', false, 'Senior Dev'),
  ('u6', 'ghost_shell', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&q=80', 789, 1890, '2023-01-15', true, 'Member'),
  ('u7', 'neon_drift', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&q=80', 1245, 3100, '2022-06-20', false, 'Moderator'),
  ('u8', 'hex_echo', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&q=80', 456, 980, '2023-09-01', true, 'Newcomer')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Seed Categories
-- ============================================================================
INSERT INTO public.categories (id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important, sort_order) VALUES
  ('cat-moderators', 'Rules & Guidelines — Must Read', 'Forum rules, community guidelines, policies, and getting-started guides. Read before posting. Only moderators can create or edit threads here.', 'Shield', 42, 1280, NOW() - INTERVAL '1 minute', true, true, 0),
  ('cat1', 'General Discussion', 'Off-topic conversations, introductions, and community talk', 'MessageSquare', 1235, 15734, NOW() - INTERVAL '5 minutes', false, false, 1),
  ('cat2', 'Technical Support', 'Get help with coding problems, debugging, and technical issues', 'Wrench', 2341, 28450, NOW() - INTERVAL '2 minutes', false, false, 2),
  ('cat3', 'Showcase & Projects', 'Share your projects, get feedback, and find collaborators', 'Rocket', 876, 9430, NOW() - INTERVAL '10 minutes', false, false, 3),
  ('cat4', 'News & Announcements', 'Latest tech news, release announcements, and industry updates', 'Newspaper', 534, 6780, NOW() - INTERVAL '15 minutes', false, false, 4)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Seed Topics
-- ============================================================================
INSERT INTO public.topics (id, category_id, name, description, thread_count, post_count, last_activity, last_post_by) VALUES
  ('topic-mod1', 'cat-moderators', 'Forum Rules', 'Core rules & posting guidelines', 12, 450, NOW() - INTERVAL '1 minute', 'rootkit_dev'),
  ('topic-mod2', 'cat-moderators', 'Policies & Legal', 'Privacy, copyright, and content policies', 8, 280, NOW() - INTERVAL '2 minutes', 'rootkit_dev'),
  ('topic-mod3', 'cat-moderators', 'Getting Started', 'Welcome guides & FAQs for new members', 10, 350, NOW() - INTERVAL '3 minutes', 'neon_drift'),
  ('topic-mod4', 'cat-moderators', 'Moderation Info', 'How moderation works & appeal process', 12, 200, NOW() - INTERVAL '4 minutes', 'syntax_err0r'),
  ('topic1', 'cat1', 'Introductions', 'Say hello to the community', 310, 3200, NOW() - INTERVAL '3 minutes', 'hex_echo'),
  ('topic2', 'cat1', 'Off-Topic', 'Anything goes', 636, 8200, NOW() - INTERVAL '5 minutes', 'pixel_witch'),
  ('topic3', 'cat1', 'Feedback & Suggestions', 'Help us improve', 289, 4334, NOW() - INTERVAL '10 minutes', 'cyb3rn0va'),
  ('topic5', 'cat2', 'Frontend Development', 'React, Vue, Angular, CSS & more', 678, 8900, NOW() - INTERVAL '2 minutes', 'null_ptr'),
  ('topic6', 'cat2', 'Backend & APIs', 'Node, Python, Go, REST, GraphQL', 892, 11200, NOW() - INTERVAL '4 minutes', 'syntax_err0r'),
  ('topic7', 'cat2', 'DevOps & Infrastructure', 'Docker, K8s, CI/CD, cloud', 445, 5340, NOW() - INTERVAL '6 minutes', 'ghost_shell'),
  ('topic8', 'cat2', 'Database & SQL', 'Postgres, MySQL, Redis, Mongo', 326, 3010, NOW() - INTERVAL '8 minutes', 'neon_drift'),
  ('topic9', 'cat3', 'Project Showcases', 'Show off your finished work', 445, 5670, NOW() - INTERVAL '10 minutes', 'rootkit_dev'),
  ('topic10', 'cat3', 'Work In Progress', 'Get early feedback', 234, 2340, NOW() - INTERVAL '15 minutes', 'pixel_witch'),
  ('topic11', 'cat3', 'Collaboration Requests', 'Find teammates', 112, 890, NOW() - INTERVAL '20 minutes', 'hex_echo'),
  ('topic12', 'cat3', 'Open Source Projects', 'Community-driven repos', 85, 530, NOW() - INTERVAL '30 minutes', 'cyb3rn0va'),
  ('topic13', 'cat4', 'Release Notes', 'New versions & changelogs', 156, 2340, NOW() - INTERVAL '15 minutes', 'null_ptr'),
  ('topic14', 'cat4', 'Industry News', 'Tech world updates', 223, 3100, NOW() - INTERVAL '30 minutes', 'syntax_err0r'),
  ('topic15', 'cat4', 'Community Events', 'Meetups, hackathons, jams', 89, 890, NOW() - INTERVAL '45 minutes', 'neon_drift'),
  ('topic16', 'cat4', 'Forum Updates', 'Platform news & maintenance', 66, 450, NOW() - INTERVAL '60 minutes', 'rootkit_dev')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Seed Threads
-- ============================================================================
INSERT INTO public.threads (id, title, excerpt, author_id, category_id, topic_id, created_at, last_reply_at, last_reply_by_id, reply_count, view_count, is_pinned, is_locked, is_hot, has_unread, tags, upvotes, downvotes) VALUES
  ('t-mod1', '[PINNED] Forum Rules — Read Before Posting (Updated 2024)', 'Essential rules every member must follow. Violations may result in warnings or bans. Last updated January 2024.', 'u3', 'cat-moderators', 'topic-mod1', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 hour', 'u1', 45, 12480, true, true, false, false, ARRAY['rules', 'pinned'], 1248, 124),
  ('t-mod2', '[PINNED] Community Guidelines & Code of Conduct', 'Be respectful, constructive, and inclusive. This code of conduct applies to all community interactions.', 'u3', 'cat-moderators', 'topic-mod1', NOW() - INTERVAL '28 days', NOW() - INTERVAL '2 hours', 'u7', 28, 8920, true, true, false, false, ARRAY['guidelines', 'pinned'], 892, 89),
  ('t-mod3', '[PINNED] Posting Etiquette — How to Ask Great Questions', 'Tips for writing effective posts: include code snippets, error messages, and what you''ve tried so far.', 'u3', 'cat-moderators', 'topic-mod1', NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 hours', 'u2', 67, 15340, true, true, false, false, ARRAY['etiquette', 'pinned'], 1534, 153),
  ('t-mod4', '[PINNED] Content Policy — What Is & Isn''t Allowed', 'Guidelines on acceptable content including links, images, code sharing, and commercial content.', 'u3', 'cat-moderators', 'topic-mod2', NOW() - INTERVAL '20 days', NOW() - INTERVAL '4 hours', 'u5', 19, 6780, true, true, false, false, ARRAY['policy', 'pinned'], 678, 67),
  ('t-mod5', '[PINNED] Moderation Actions & Appeal Process', 'How warnings, temporary bans, and permanent bans work. Learn how to appeal a moderation decision.', 'u3', 'cat-moderators', 'topic-mod4', NOW() - INTERVAL '18 days', NOW() - INTERVAL '5 hours', 'u7', 34, 5430, true, true, false, false, ARRAY['moderation', 'pinned'], 543, 54),
  ('t-mod6', '[PINNED] User Ranks, Reputation & Privileges Explained', 'Rank progression from Newcomer to Elite Hacker. Understand how reputation points are earned.', 'u3', 'cat-moderators', 'topic-mod3', NOW() - INTERVAL '15 days', NOW() - INTERVAL '6 hours', 'u1', 52, 9870, true, true, false, false, ARRAY['ranks', 'pinned'], 987, 98),
  ('t-mod7', 'Anti-Spam Policy — Zero Tolerance for Self-Promotion', 'No unsolicited ads, affiliate links, or repetitive self-promotion. First offense = warning, second = ban.', 'u3', 'cat-moderators', 'topic-mod2', NOW() - INTERVAL '12 days', NOW() - INTERVAL '7 hours', 'u2', 8, 3240, true, true, false, false, ARRAY['spam', 'policy'], 324, 32),
  ('t-mod8', 'Privacy Policy & Data Handling Practices', 'How we collect, store, and protect your data. GDPR compliance and data deletion requests.', 'u3', 'cat-moderators', 'topic-mod2', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 hours', 'u7', 11, 4560, false, true, false, false, ARRAY['privacy', 'policy'], 456, 45),
  ('t-mod9', 'FAQ — Frequently Asked Questions About the Forum', 'Answers to the most commonly asked questions about account setup, features, and troubleshooting.', 'u3', 'cat-moderators', 'topic-mod3', NOW() - INTERVAL '8 days', NOW() - INTERVAL '9 hours', 'u5', 73, 18900, true, true, false, false, ARRAY['faq', 'pinned'], 1890, 189),
  ('t-mod10', 'New Member Welcome Guide — Getting Started', 'Your complete onboarding guide: profile setup, first post tips, navigation walkthrough, and more.', 'u3', 'cat-moderators', 'topic-mod3', NOW() - INTERVAL '6 days', NOW() - INTERVAL '10 hours', 'u1', 91, 22340, true, true, false, false, ARRAY['welcome', 'guide'], 2234, 223),
  ('t-mod11', 'Copyright & Intellectual Property Guidelines', 'Rules about sharing code, images, and content that belongs to others. Fair use and attribution.', 'u3', 'cat-moderators', 'topic-mod2', NOW() - INTERVAL '4 days', NOW() - INTERVAL '11 hours', 'u2', 6, 2890, false, true, false, false, ARRAY['copyright', 'legal'], 289, 28),
  ('t-mod12', 'Thread Tagging & Categorization Best Practices', 'How to properly tag and categorize your threads for maximum visibility and searchability.', 'u3', 'cat-moderators', 'topic-mod4', NOW() - INTERVAL '2 days', NOW() - INTERVAL '12 hours', 'u7', 15, 4120, false, true, false, false, ARRAY['tagging', 'guide'], 412, 41),
  ('t1', 'Welcome to the new forum! Read the rules before posting', 'Welcome everyone! We''ve completely redesigned the forum with a fresh look. Make sure to review the updated rules before jumping in.', 'u3', 'cat1', 'topic1', NOW() - INTERVAL '20 days', NOW() - INTERVAL '30 minutes', 'u1', 156, 4820, true, false, true, false, ARRAY['announcement'], 482, 48),
  ('t2', 'What''s your daily driver IDE in 2024?', 'Curious what everyone is using these days. I recently switched from VS Code to Zed and the speed difference is insane.', 'u4', 'cat1', 'topic2', NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 hour', 'u6', 89, 2340, false, false, true, true, ARRAY['discussion'], 234, 23),
  ('t3', 'Introduce yourself — new members thread', 'New here? Drop a quick intro! Tell us about your stack, what you''re working on, and what brought you to this community.', 'u1', 'cat1', 'topic1', NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 hours', 'u8', 234, 5670, true, false, false, false, ARRAY['community'], 567, 56),
  ('t4', 'The great tabs vs spaces debate (2024 edition)', 'It''s 2024 and we still can''t agree. Let''s settle this once and for all with a poll and some heated arguments.', 'u5', 'cat1', 'topic2', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 hours', 'u2', 312, 8900, false, false, true, true, ARRAY['fun'], 890, 89),
  ('t5', 'Best mechanical keyboards for programming?', 'Looking for recommendations. Currently using a cheap membrane board and my wrists are starting to complain.', 'u7', 'cat1', 'topic3', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 hours', 'u4', 67, 1890, false, false, false, true, ARRAY['hardware'], 189, 18),
  ('t6', '[SOLVED] TypeScript generic constraints with conditional types', 'Struggling with inferring the correct type when combining generics with conditional types. Found the solution using infer keyword.', 'u2', 'cat2', 'topic5', NOW() - INTERVAL '12 days', NOW() - INTERVAL '5 hours', 'u3', 23, 890, false, false, false, false, ARRAY['typescript', 'solved'], 89, 8),
  ('t7', 'Docker compose networking issue — containers can''t communicate', 'Running 3 containers in the same compose file but they can''t reach each other by service name. Tried custom networks, still failing.', 'u6', 'cat2', 'topic7', NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 hours', 'u4', 45, 1560, false, false, false, true, ARRAY['docker'], 156, 15),
  ('t8', 'React 19 — useOptimistic hook not working as expected', 'The new useOptimistic hook in React 19 seems to revert state changes even when the server action succeeds. Anyone else seeing this?', 'u8', 'cat2', 'topic5', NOW() - INTERVAL '6 days', NOW() - INTERVAL '7 hours', 'u1', 34, 2100, false, false, true, false, ARRAY['react'], 210, 21),
  ('t9', 'Need help: PostgreSQL query optimization for 10M+ rows', 'My JOIN query takes 45 seconds on a 10M row table. Already have indexes but EXPLAIN shows sequential scans. Need optimization advice.', 'u5', 'cat2', 'topic8', NOW() - INTERVAL '4 days', NOW() - INTERVAL '8 hours', 'u3', 18, 670, false, false, false, false, ARRAY['sql', 'performance'], 67, 6),
  ('t10', 'Rust borrow checker driving me insane — lifetime help', 'Cannot return a reference to a local variable even though the data lives long enough. Lifetime annotations aren''t helping.', 'u7', 'cat2', 'topic6', NOW() - INTERVAL '3 days', NOW() - INTERVAL '9 hours', 'u2', 56, 1980, false, false, false, true, ARRAY['rust'], 198, 19),
  ('t11', 'I built a real-time collaborative code editor in Rust + WASM', 'After 4 months of work, my collaborative editor is live. It uses CRDTs for conflict resolution and compiles to WASM for the browser.', 'u3', 'cat3', 'topic9', NOW() - INTERVAL '14 days', NOW() - INTERVAL '10 hours', 'u5', 78, 3400, false, false, true, true, ARRAY['project', 'rust'], 340, 34),
  ('t12', 'My minimalist terminal-based task manager (open source)', 'A TUI task manager built with Go and Bubble Tea. Supports vim keybindings, due dates, and syncs with GitHub issues.', 'u1', 'cat3', 'topic12', NOW() - INTERVAL '10 days', NOW() - INTERVAL '11 hours', 'u7', 34, 1230, false, false, false, false, ARRAY['project', 'open-source'], 123, 12),
  ('t13', 'AI-powered commit message generator — feedback wanted', 'Built a CLI tool that analyzes your git diff and generates meaningful commit messages. Uses local LLM so no API costs.', 'u4', 'cat3', 'topic10', NOW() - INTERVAL '7 days', NOW() - INTERVAL '12 hours', 'u8', 21, 890, false, false, false, false, ARRAY['ai', 'project'], 89, 8),
  ('t14', 'NeoVim config that took me 6 months to perfect', 'My ultimate NeoVim setup with LSP, Telescope, TreeSitter, and custom keymaps. Full config available on GitHub.', 'u6', 'cat3', 'topic9', NOW() - INTERVAL '5 days', NOW() - INTERVAL '13 hours', 'u2', 156, 5670, false, false, true, false, ARRAY['neovim', 'dotfiles'], 567, 56),
  ('t15', 'Bun 1.2 released — 3x faster than Node in benchmarks', 'The latest Bun release brings native S3 support, Postgres client, and dramatic performance improvements across the board.', 'u3', 'cat4', 'topic13', NOW() - INTERVAL '3 days', NOW() - INTERVAL '14 hours', 'u1', 89, 4560, true, false, true, false, ARRAY['bun', 'release'], 456, 45),
  ('t16', 'GitHub Copilot now supports full codebase context', 'GitHub just announced Copilot can now understand your entire repo structure. Early tests show much better suggestions.', 'u2', 'cat4', 'topic14', NOW() - INTERVAL '2 days', NOW() - INTERVAL '15 hours', 'u5', 67, 3200, false, false, false, true, ARRAY['ai', 'github'], 320, 32),
  ('t17', 'Linux kernel 6.8 — what''s new for developers', 'Kernel 6.8 brings improved io_uring, better RISC-V support, and new BPF features. Here''s a breakdown of what matters.', 'u6', 'cat4', 'topic14', NOW() - INTERVAL '1 day', NOW() - INTERVAL '16 hours', 'u3', 34, 1890, false, false, false, false, ARRAY['linux'], 189, 18),
  ('t18', 'Forum maintenance scheduled for this weekend', 'We''ll be migrating to new servers this Saturday 2AM-6AM UTC. Expect brief downtime. All data will be preserved.', 'u3', 'cat4', 'topic16', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '17 hours', 'u3', 12, 450, true, true, false, false, ARRAY['meta'], 45, 4)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Seed Forum Stats
-- ============================================================================
INSERT INTO public.forum_stats (id, total_threads, total_posts, total_users, active_users, new_posts_today, newest_member, online_users) VALUES
  (1, 5028, 61674, 12453, 342, 187, 'hex_echo', 89)
ON CONFLICT (id) DO UPDATE SET
  total_threads = EXCLUDED.total_threads,
  total_posts = EXCLUDED.total_posts,
  total_users = EXCLUDED.total_users,
  active_users = EXCLUDED.active_users,
  new_posts_today = EXCLUDED.new_posts_today,
  newest_member = EXCLUDED.newest_member,
  online_users = EXCLUDED.online_users;

-- ============================================================================
-- Seed Polls
-- ============================================================================
INSERT INTO public.polls (id, thread_id, question, total_votes, ends_at, is_multiple_choice) VALUES
  ('poll-t2', 't2', 'What''s your primary IDE/Editor in 2024?', 737, NOW() + INTERVAL '5 days', false),
  ('poll-t4', 't4', 'Tabs or Spaces?', 1235, NOW() + INTERVAL '2 days', false),
  ('poll-t8', 't8', 'Which React 19 feature are you most excited about?', 514, NOW() + INTERVAL '7 days', true),
  ('poll-t14', 't14', 'What NeoVim package manager do you prefer?', 568, NOW() - INTERVAL '1 day', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.poll_options (id, poll_id, text, votes, sort_order) VALUES
  ('p-t2-1', 'poll-t2', 'VS Code', 234, 0),
  ('p-t2-2', 'poll-t2', 'NeoVim', 156, 1),
  ('p-t2-3', 'poll-t2', 'JetBrains (IntelliJ/WebStorm)', 189, 2),
  ('p-t2-4', 'poll-t2', 'Zed', 78, 3),
  ('p-t2-5', 'poll-t2', 'Sublime Text', 23, 4),
  ('p-t2-6', 'poll-t2', 'Helix', 45, 5),
  ('p-t2-7', 'poll-t2', 'Other', 12, 6),
  ('p-t4-1', 'poll-t4', 'Tabs — As nature intended', 412, 0),
  ('p-t4-2', 'poll-t4', 'Spaces (2) — Clean and consistent', 356, 1),
  ('p-t4-3', 'poll-t4', 'Spaces (4) — The balanced approach', 289, 2),
  ('p-t4-4', 'poll-t4', 'I don''t care, my formatter handles it', 178, 3),
  ('p-t8-1', 'poll-t8', 'Server Components', 145, 0),
  ('p-t8-2', 'poll-t8', 'useOptimistic hook', 89, 1),
  ('p-t8-3', 'poll-t8', 'use() hook', 112, 2),
  ('p-t8-4', 'poll-t8', 'Actions & form handling', 134, 3),
  ('p-t8-5', 'poll-t8', 'Document metadata', 34, 4),
  ('p-t14-1', 'poll-t14', 'lazy.nvim', 345, 0),
  ('p-t14-2', 'poll-t14', 'packer.nvim', 89, 1),
  ('p-t14-3', 'poll-t14', 'vim-plug', 56, 2),
  ('p-t14-4', 'poll-t14', 'rocks.nvim', 78, 3)
ON CONFLICT (id) DO NOTHING;
