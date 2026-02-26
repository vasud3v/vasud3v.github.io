-- ============================================================================
-- UPDATE ALL POSTS WITH DETAILED, PROFESSIONAL CONTENT
-- ============================================================================

DO $$
DECLARE
  v_admin_id TEXT;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_id FROM public.forum_users WHERE rank IN ('Administrator', 'Moderator') LIMIT 1;
  
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM public.forum_users LIMIT 1;
  END IF;

  -- ========================================================================
  -- TOPIC: Forum Rules
  -- ========================================================================
  
  -- Thread: Community Guidelines - Read First!
  UPDATE public.posts SET content = 
'# Welcome to Our Community! [Shield]

Thank you for joining us. These guidelines help maintain a productive, respectful, and helpful environment where everyone can learn and grow together.

## Community Guidelines - How We Treat Each Other

### 1. Be Respectful & Constructive [CRITICAL]
Treat all members with respect, regardless of their experience level. We''re all here to learn and help each other.

**Do:**
- Disagree with ideas, not people
- Provide constructive feedback
- Be patient with beginners
- Acknowledge different perspectives

**Don''t:**
- Make personal attacks or insults
- Use hate speech or discriminatory language
- Harass or bully other members
- Dismiss questions as "stupid" or "obvious"

### 2. No Personal Information Sharing [CRITICAL]
Your privacy and safety are paramount. Never share personal information about yourself or others.

**Protected Information:**
- Real names (unless you choose to share your own)
- Physical addresses or locations
- Phone numbers or email addresses
- Social media profiles or usernames
- Workplace or school information
- Financial information

### 3. Keep Content Appropriate [CRITICAL]
This is a professional community focused on learning and collaboration.

**Not Allowed:**
- NSFW content (pornography, graphic violence)
- Illegal activities or content
- Pirated software or cracked tools
- Content that violates intellectual property rights
- Political or religious debates (unless directly relevant to the topic)

### 4. One Account Per Person [CRITICAL]
Creating multiple accounts undermines trust and fairness in our community.

**Prohibited:**
- Creating alt accounts to manipulate votes
- Using multiple accounts to evade bans
- Impersonating other users or moderators
- Sockpuppeting to support your own arguments

**If you need to change your username or have account issues, contact a moderator directly.**

### 5. English Language Primary [MODERATE]
Use English as the primary language to ensure everyone can participate and benefit from discussions.

**Acceptable:**
- Code comments in other languages
- Technical terms in their original language
- Brief translations to help non-native speakers

**Why?** This ensures maximum accessibility and allows moderators to effectively enforce rules.'
  WHERE id = 'post-rules-001-1';

  UPDATE public.posts SET content = 
'## Important Reminders

**Reporting Violations:**
If you see content that violates these rules, please use the report button [Flag] rather than engaging with the violator. This helps us maintain a positive environment.

**Our Moderation Team:**
- Reviews all reports within 24 hours
- Investigates context before taking action
- Maintains confidentiality of reporters
- Provides explanations for moderation decisions

**Your Role:**
Help us keep this community great by:
- Leading by example with respectful behavior
- Reporting violations promptly
- Supporting new members
- Contributing positively to discussions

Thank you for being part of our community! [Heart]'
  WHERE id = 'post-rules-001-2';


  -- Thread: Content Policy & Prohibited Content
  UPDATE public.posts SET content = 
'# Posting Guidelines - Creating Quality Content

These guidelines help you create posts that get better responses and help future users with similar questions.

## 6. Write Clear, Descriptive Titles [IMPORTANT]

Your title is the first thing people see. Make it count!

**Bad Examples:**
- "Help!" (Too vague)
- "Error" (What kind of error?)
- "Question about React" (Too broad)
- "URGENT!!!" (Doesn''t describe the problem)

**Good Examples:**
- "React useState not updating after async API call"
- "PostgreSQL query performance: Index not being used on JOIN"
- "TypeScript: How to type a generic function with constraints"
- "Docker container exits immediately with code 137"

**Tips:**
- Include the technology/framework name
- Describe the specific problem or question
- Keep it under 100 characters when possible
- Avoid clickbait or sensationalism

## 7. Choose the Right Category [MODERATE]

Posting in the correct category helps others find your thread and ensures you get relevant responses.

**Before Posting:**
1. Read category descriptions
2. Check if there''s a more specific subcategory
3. Use tags to add additional context
4. Look at similar threads to see where they''re posted

**Note:** Moderators may move misplaced threads without notice. This isn''t a punishment - it''s to help your thread get better visibility!

## 8. Search Before Asking [IMPORTANT]

Your question might already be answered! Searching saves everyone time.

**How to Search Effectively:**
- Use specific keywords from your error message
- Try different phrasings of your question
- Filter by category or tags
- Check both thread titles and content
- Look at closed/solved threads

**If You Find Similar Threads:**
- Read through the solutions
- If they don''t fully answer your question, link to them in your post
- Explain how your situation differs
- This shows you''ve done your homework!

## 9. Provide Context & Details [IMPORTANT]

The more information you provide, the better help you''ll receive.

**Essential Information:**
- What you''re trying to accomplish (the goal)
- What you''ve already tried
- Exact error messages (full text, not screenshots when possible)
- Relevant code snippets
- Environment details (OS, versions, dependencies)
- Steps to reproduce the issue

**Template for Questions:**
```
**Goal:** What I''m trying to achieve
**Problem:** What''s going wrong
**What I''ve Tried:** Solutions I''ve attempted
**Code:** Relevant snippets
**Environment:** OS, versions, etc.
**Error:** Full error message
```

## 10. Format Code & Errors Properly [IMPORTANT]

Proper formatting makes your post readable and helps others assist you faster.

**Use Code Blocks:**
```javascript
// Like this for code
const example = "properly formatted";
```

**For Errors:**
```
Full error message here
Including stack traces
```

**Don''t:**
- Post screenshots of code (unless showing UI issues)
- Use inline code for long snippets
- Forget to specify the language for syntax highlighting

## 11. Stay On Topic [MODERATE]

Keep discussions focused and productive.

**If Discussion Diverges:**
- Create a new thread for the new topic
- Link back to the original thread
- Summarize the context in the new thread

**Off-Topic Examples:**
- Debating programming languages in a specific tech question
- Discussing politics/religion in technical threads
- Sharing memes or jokes in serious discussions

## 12. Mark Solutions & Give Credit [MODERATE]

Help future users and show appreciation!

**When Your Question is Answered:**
- Mark the helpful reply as the solution [Check]
- Upvote helpful responses
- Post a follow-up if you modified the solution
- Thank those who helped you

**Why This Matters:**
- Helps others with the same problem find solutions quickly
- Rewards helpful community members
- Builds your reputation as a considerate member
- Closes the loop on your question'
  WHERE id = 'post-rules-002-1';


  -- Thread: Reporting & Moderation Process - Post 1
  UPDATE public.posts SET content = 
'# Community Standards - What We Don''t Allow

These rules protect the community and ensure a positive experience for everyone.

## 13. No Spam or Low-Effort Posts [IMPORTANT]

Quality over quantity. Every post should add value.

**Spam Includes:**
- Posting the same content multiple times
- Bumping old threads without new information
- One-word replies like "thanks" or "+1" (use upvote instead)
- Posting unrelated links or advertisements
- Cross-posting the same question to multiple categories

**Low-Effort Posts:**
- "Can someone help?" without describing the problem
- Posting homework questions without showing any attempt
- Asking for complete solutions without trying first
- Vague questions that require mind-reading

**Instead:**
- Use the upvote button to show agreement
- Add meaningful comments that contribute to discussion
- Show your work and specific questions
- Edit your original post instead of bumping

## 14. Self-Promotion Guidelines [IMPORTANT]

We welcome sharing your work, but there''s a right way to do it.

**Allowed:**
- Sharing your projects in the Showcase category
- Mentioning your open-source tools when relevant to a discussion
- Linking to your blog post that answers someone''s question
- Announcing major releases or updates (in appropriate categories)

**Not Allowed:**
- Spamming links to your products in every thread
- Promoting paid services without disclosure
- Affiliate links or referral codes
- Self-promotion without community contribution

**Best Practice:**
- Contribute meaningfully to the community first
- Be transparent about your affiliation
- Focus on how your project helps solve problems
- Accept feedback gracefully

## 15. No Asking for Upvotes or Reputation [CRITICAL]

Reputation should be earned through quality contributions, not manipulation.

**Prohibited:**
- Asking for upvotes in your posts
- Trading upvotes with other users
- Creating multiple accounts to upvote yourself
- Downvoting competitors or critics
- Offering rewards for upvotes

**Why This Matters:**
- Reputation indicates trustworthiness and expertise
- Manipulation undermines the entire system
- It''s unfair to members who earn reputation honestly

**Earn Reputation By:**
- Providing helpful, accurate answers
- Creating quality content
- Being respectful and constructive
- Helping newcomers
- Contributing consistently over time

## 16. Respect Intellectual Property [CRITICAL]

Respect the work and rights of others.

**Never Share:**
- Pirated software or cracks
- Leaked proprietary code
- Copyrighted content without permission
- API keys, passwords, or credentials
- Confidential information from your workplace

**Always:**
- Give proper attribution when using others'' work
- Respect open-source licenses (MIT, GPL, Apache, etc.)
- Link to original sources
- Ask permission before sharing someone else''s code
- Use code snippets for educational purposes only

**Fair Use:**
- Small code snippets for learning/debugging are generally okay
- Always cite the source
- Don''t copy entire projects or libraries

## 17. No Backseat Moderating [MODERATE]

Let the moderation team handle rule enforcement.

**Don''t:**
- Tell users they''re breaking rules in public
- Issue warnings or threats
- Demand posts be deleted
- Act as if you have authority you don''t have

**Do:**
- Use the report button [Flag] to flag violations
- Provide helpful corrections politely
- Link to relevant rules if asked
- Trust the moderation team to handle it

**Why?**
- Public call-outs create drama and derail discussions
- You might not have full context
- Moderators are trained to handle situations fairly
- It makes the community feel hostile

## 18. No Homework or Paid Work Requests [IMPORTANT]

We''re here to help you learn, not do your work for you.

**Not Allowed:**
- "Can someone complete this assignment for me?"
- Posting entire homework problems without any attempt
- Asking for someone to build your project for free
- Requesting solutions to take-home interview tests

**We Will Help You:**
- Understand concepts you''re struggling with
- Debug code you''ve written
- Review your approach and suggest improvements
- Point you to learning resources

**How to Ask for Help:**
- Show what you''ve tried
- Explain where you''re stuck
- Ask specific questions about concepts
- Be honest that it''s for school/work (we can still help!)

**Example:**
[X] "Write a function to sort an array for my homework"
[Check] "I''m trying to implement bubble sort for homework. My code works but I don''t understand why we need the inner loop. Here''s what I have..."'
  WHERE id = 'post-rules-003-1';


  -- Thread: Reporting & Moderation Process - Post 2
  INSERT INTO public.posts (id, thread_id, content, author_id, created_at, upvotes)
  VALUES ('post-rules-003-2', 't-rules-003',
'# Enforcement & Consequences

We enforce rules fairly and consistently to maintain a healthy community.

## Progressive Discipline System

Our approach is educational first, punitive only when necessary.

### First Violation [WARNING]
**What Happens:**
- Official warning via private message
- Explanation of which rule was violated
- Guidance on how to avoid future violations
- Content may be edited or removed

**Your Response:**
- Read and understand the warning
- Ask questions if anything is unclear
- Adjust your behavior going forward
- No permanent record if no further violations

### Second Violation [TEMPORARY SUSPENSION]
**What Happens:**
- 3-7 day temporary suspension (depending on severity)
- Violating content removed
- Cannot post, reply, or vote during suspension
- Warning added to your account record

**Your Response:**
- Use the time to review community guidelines
- Reflect on the pattern of behavior
- Return with a fresh start
- One more chance to be a positive member

### Third Violation [EXTENDED SUSPENSION]
**What Happens:**
- 30-day suspension
- Reputation points reduced
- All violating content removed
- Permanent mark on account record
- Final warning before permanent ban

**Your Response:**
- Seriously consider if this community is right for you
- Understand that one more violation = permanent ban
- Demonstrate changed behavior upon return

### Severe Violations [IMMEDIATE BAN]
Some violations are so serious they warrant immediate permanent bans:

**Zero Tolerance:**
- Harassment, doxxing, or threats
- Sharing illegal content
- Hate speech or discrimination
- Intentional malicious behavior
- Evading bans with alt accounts

**No Appeals:**
These bans are permanent and typically not appealable.

## Context Matters

Moderators consider:
- **Intent:** Was it malicious or a mistake?
- **History:** First offense or repeat violator?
- **Severity:** Minor infraction or serious violation?
- **Impact:** Did it harm other members?
- **Response:** Did you acknowledge and apologize?

**Example:**
- Accidentally posting in wrong category = gentle redirect
- Repeatedly ignoring category guidelines after warnings = suspension

## Special Circumstances

### Account Compromised
If your account was hacked:
- Contact moderators immediately
- Provide evidence if possible
- We''ll investigate and may reverse actions
- Change your password immediately

### Misunderstandings
If you genuinely didn''t understand a rule:
- Explain your perspective respectfully
- We may reduce or remove penalties
- Ignorance isn''t always an excuse, but we''re reasonable

### Cultural Differences
We understand different cultures have different norms:
- Let us know if something was a cultural misunderstanding
- We''ll explain our community standards
- We expect you to adapt to our guidelines

---

# Appeals & Questions

## How to Appeal a Moderation Decision

If you believe a decision was unfair or made in error:

### Step 1: Wait 24 Hours
- Let emotions settle
- Review the rules objectively
- Gather your thoughts and evidence

### Step 2: Submit an Appeal
**Where:** Moderation Appeals thread (or PM senior moderator)
**When:** Within 7 days of the decision
**Include:**
- Your username and the action being appealed
- Why you believe the decision was wrong
- Any evidence supporting your case
- A respectful, calm tone

### Step 3: Review Process
- Different moderator reviews your appeal
- Investigation within 48-72 hours
- Decision is final (no appeals of appeals)
- You''ll receive a detailed response

### What We Look For:
[Check] New evidence we didn''t have
[Check] Misunderstanding of context
[Check] Technical errors in our process
[Check] Disproportionate penalty

[X] "I disagree with the rule"
[X] "Other people do it too"
[X] "It was just a joke"
[X] "I''m sorry, please forgive me" (without addressing the issue)

## Asking Questions About Rules

**For Clarification:**
- Post in this thread
- Send a private message to moderators
- We''re happy to explain our reasoning

**Don''t:**
- Argue about rules in public threads
- Derail discussions with rule debates
- Demand rule changes
- Threaten to leave if rules aren''t changed

## Rule Changes

Rules evolve based on community needs:
- Suggest changes in the Feedback thread
- Explain the problem you''re trying to solve
- Propose specific solutions
- Be open to discussion

**Major changes are announced with:**
- Advance notice (usually 2 weeks)
- Explanation of reasoning
- Opportunity for community input
- Grace period for adjustment

---

## Moderator Accountability

Our moderators are held to high standards:
- Must follow the same rules as everyone else
- Actions are logged and reviewable
- Senior moderators oversee decisions
- Community feedback is taken seriously

**If you have concerns about a moderator:**
- Contact a senior moderator or admin
- Provide specific examples
- We investigate all complaints
- Moderators can be removed for abuse

---

## Final Thoughts

**Our Goal:** Create a welcoming, helpful, and productive community where everyone can learn and grow.

**Your Role:** Follow the guidelines, treat others with respect, and contribute positively.

**Together:** We build something valuable for everyone.

Thank you for being part of our community! If you have questions about anything in this thread, please ask. We''re here to help. [Heart]

---

*Last Updated: February 2026 | Version 3.0*
*Questions? Contact the moderation team*'
  , v_admin_id, NOW() + interval '1 hour', 7)
  ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    upvotes = EXCLUDED.upvotes;


  -- ========================================================================
  -- TOPIC: Getting Started
  -- ========================================================================
  
  -- Thread: Welcome! Start Here
  UPDATE public.posts SET content = 
'# Welcome to Our Community! [PartyPopper]

We''re thrilled to have you here! This guide will help you get oriented and make the most of your experience.

## Your First Steps

### 1. Complete Your Profile
Make yourself known to the community:
- **Avatar:** Upload a profile picture or use our avatar generator
- **Bio:** Tell us about yourself (optional but encouraged)
- **Interests:** Add tags for topics you''re interested in
- **Location:** Share your timezone (helps with collaboration)

**Why it matters:** A complete profile helps others understand your background and makes the community feel more personal.

### 2. Read the Forum Rules
Before posting, familiarize yourself with our guidelines:
- Navigate to the "Forum Rules" topic
- Read through all three threads
- Bookmark them for future reference
- Ask questions if anything is unclear

**Pro tip:** Understanding the rules prevents accidental violations and helps you contribute effectively.

### 3. Introduce Yourself
Head to the "Welcome & Introductions" topic and tell us:
- Your name (or username)
- Your background (student, professional, hobbyist)
- What brings you here
- What you hope to learn or contribute
- Fun fact about yourself (optional!)

**Example:**
"Hi! I''m Alex, a self-taught developer learning web development. I''m here to ask questions about React and help others where I can. Fun fact: I learned to code while traveling around the world! [Globe]"

### 4. Browse Existing Threads
Get a feel for the community:
- Check out popular threads in your areas of interest
- Read through solved questions to learn
- See how experienced members format their posts
- Notice the tone and style of helpful responses

**Categories to explore:**
- General Discussion: Casual conversations
- Technical Support: Get help with specific problems
- Showcase: See what others are building
- Tutorials: Learn new skills

### 5. Ask Your First Question
When you''re ready to post:
- Choose the right category
- Write a clear, descriptive title
- Provide context and details
- Format code properly
- Be patient waiting for responses

**Remember:** Everyone was new once. Don''t be afraid to ask "beginner" questions!

## Understanding the Forum

### Reputation System
Earn reputation points by:
- Posting helpful answers
- Creating quality threads
- Receiving upvotes
- Having your answers marked as solutions

**Ranks:**
- Newcomer: 0-50 points
- Member: 51-200 points
- Regular: 201-500 points
- Veteran: 501-1000 points
- Expert: 1000+ points

### Thread Status
- [Flame] **Hot:** Trending discussions with lots of activity
- [Pin] **Pinned:** Important threads that stay at the top
- [CheckCircle] **Solved:** Questions that have accepted answers
- [Lock] **Locked:** Closed to new replies (usually archived)

### Voting System
- **Upvote [ArrowUp]:** Content is helpful, accurate, or valuable
- **Downvote [ArrowDown]:** Content is incorrect, unhelpful, or violates rules
- Use votes to highlight quality content
- Don''t downvote just because you disagree

## Getting Help

### How to Ask Good Questions
1. **Search first:** Your question might already be answered
2. **Be specific:** Vague questions get vague answers
3. **Show your work:** What have you tried?
4. **Provide context:** Environment, versions, error messages
5. **Format properly:** Use code blocks and proper markdown

### What to Expect
- **Response time:** Usually within a few hours, sometimes minutes
- **Multiple perspectives:** Different members may suggest different approaches
- **Follow-up questions:** We might ask for more details
- **Learning opportunity:** We teach, not just give answers

### If You''re Not Getting Responses
- Wait at least 24 hours before bumping
- Check if your question is clear and detailed
- Make sure you''re in the right category
- Consider rewording your title
- Add more context or examples

## Contributing to the Community

### Ways to Help Others
Even as a beginner, you can contribute:
- Answer questions in areas you know
- Share resources you''ve found helpful
- Test solutions others propose
- Provide feedback on projects in Showcase
- Welcome new members
- Report rule violations

### Building Reputation
Quality over quantity:
- One great answer > ten mediocre ones
- Take time to write clear, complete responses
- Include examples and explanations
- Follow up if the solution works
- Edit your posts to improve them

### Community Etiquette
- **Be patient:** Not everyone responds immediately
- **Be kind:** Remember there''s a human behind every username
- **Be humble:** We''re all learning
- **Be grateful:** Thank those who help you
- **Be constructive:** Criticism should be helpful, not hurtful

## Common Mistakes to Avoid

### [X] Don''t:
- Post "urgent" or "please help" without details
- Expect others to do your homework
- Get defensive when receiving feedback
- Spam multiple categories with the same question
- Argue with moderators publicly
- Share personal information

### [Check] Do:
- Take time to write clear, detailed posts
- Show appreciation for help received
- Mark solutions when your question is answered
- Edit your posts to add updates
- Search before asking
- Follow the community guidelines

## Resources

### Helpful Threads
- Forum Rules & Guidelines
- How to Format Code
- Markdown Guide
- Category Descriptions
- FAQ

### External Resources
- Our Discord server (link in profile)
- Community GitHub (for open-source projects)
- Monthly newsletter (subscribe in settings)
- Video tutorials (YouTube channel)

## Need More Help?

If you''re stuck or confused:
- Reply to this thread with your question
- Send a private message to moderators
- Check the FAQ thread
- Ask in the General Discussion category

**We''re here to help you succeed!**

Welcome aboard, and happy learning! [Rocket]'
  WHERE id = 'post-start-001-1';


  UPDATE public.posts SET content = 
'## Pro Tips for New Members [Lightbulb]

### Search Like a Pro
The search function is your best friend:
- Use specific keywords from error messages
- Try different phrasings
- Filter by category and tags
- Check both titles and content
- Look at solved threads first

**Example:**
Instead of searching "react error", try "react useEffect dependency array warning"

### Make Connections
The community is more than just Q&A:
- Follow members whose content you find helpful
- Participate in discussions, not just questions
- Share interesting articles or resources
- Join community events or challenges
- Collaborate on open-source projects

### Stay Updated
Don''t miss important information:
- Enable notifications for threads you''re interested in
- Check the "What''s New" section regularly
- Subscribe to category RSS feeds
- Follow us on social media
- Join our newsletter

### Level Up Your Skills
Use the forum as a learning tool:
- Read through popular solved questions
- Study how experts explain concepts
- Try to answer questions before reading responses
- Learn from your mistakes
- Teach others what you''ve learned

Remember: The more you put into this community, the more you''ll get out of it! [Sparkles]'
  WHERE id = 'post-start-001-2';

  UPDATE public.posts SET content = 
'## Quick Reference: Forum Features

### Markdown Formatting
Make your posts look professional:

**Bold text:** `**bold**` → **bold**
*Italic text:* `*italic*` → *italic*
`Inline code:` `` `code` `` → `code`

**Code blocks:**
```
\`\`\`javascript
const example = "code block";
\`\`\`
```

**Links:** `[text](url)` → [text](url)
**Images:** `![alt](url)`
**Lists:** Use `-` or `1.` for bullets/numbers
**Quotes:** Start line with `>`

### Keyboard Shortcuts
- `Ctrl/Cmd + Enter`: Submit post
- `Ctrl/Cmd + B`: Bold text
- `Ctrl/Cmd + I`: Italic text
- `Ctrl/Cmd + K`: Insert link
- `Ctrl/Cmd + /`: Show all shortcuts

### Thread Actions
- **Watch:** Get notifications for new replies
- **Bookmark:** Save for later reading
- **Share:** Copy link to share elsewhere
- **Report:** Flag rule violations
- **Edit:** Fix typos or add updates (within 24 hours)

### User Actions
- **Follow:** See their activity in your feed
- **Message:** Send private message
- **Mention:** Use @username to notify them
- **Block:** Hide content from specific users

### Mobile App
Download our mobile app for:
- Push notifications
- Offline reading
- Quick replies
- Better image handling
- Dark mode

Available on iOS and Android!

---

**Still have questions?** Ask away! We''re here to help you get started. [Smile]'
  WHERE id = 'post-start-001-3';


  -- Thread: How to Create Your First Thread
  UPDATE public.posts SET content = 
'# How to Create Your First Thread [FileEdit]

Creating a great thread increases your chances of getting helpful responses. Here''s everything you need to know.

## Before You Post

### 1. Search Thoroughly
Avoid duplicate threads:
- Use the search bar with specific keywords
- Check the FAQ and pinned threads
- Look through recent posts in the category
- Search external resources (Stack Overflow, documentation)

**If you find similar threads:**
- Read through them completely
- If they don''t fully answer your question, reference them in your post
- Explain how your situation differs

### 2. Choose the Right Category
Categories help organize content and ensure the right people see your thread.

**Main Categories:**
- **General Discussion:** Off-topic, introductions, casual chat
- **Technical Support:** Specific problems needing solutions
- **Tutorials & Guides:** Share knowledge and how-tos
- **Showcase:** Share your projects and get feedback
- **Feature Requests:** Suggest improvements to the forum

**Subcategories (Topics):**
Each category has topics for more specific organization. Browse them before posting.

### 3. Gather Your Information
Have these ready before you start writing:
- Clear description of your goal or problem
- Relevant code snippets
- Error messages (full text)
- Environment details (OS, versions, dependencies)
- What you''ve already tried
- Screenshots (if showing UI issues)

## Writing Your Thread

### Step 1: Craft a Great Title
Your title should be specific and searchable.

**Formula:** `[Technology] Brief description of problem/question`

**Examples:**
[Check] "[React] useState hook not triggering re-render after API call"
[Check] "[Python] How to handle multiple exceptions in try-except block"
[Check] "[Docker] Container exits with code 137 on M1 Mac"
[Check] "[SQL] Optimize query with multiple JOINs and subqueries"

[X] "Help needed"
[X] "Why doesn''t this work?"
[X] "Question about JavaScript"
[X] "URGENT!!!"

**Tips:**
- Keep it under 100 characters
- Include the technology/framework
- Be specific about the issue
- Avoid sensationalism
- Make it searchable

### Step 2: Write a Clear Description

**Structure your post:**

1. **Introduction (1-2 sentences)**
   - What you''re trying to accomplish
   - Brief context

2. **The Problem**
   - What''s going wrong
   - When it happens
   - What you expected vs. what actually happens

3. **What You''ve Tried**
   - Solutions you''ve attempted
   - Why they didn''t work
   - Resources you''ve consulted

4. **Code & Environment**
   - Relevant code snippets (not your entire codebase)
   - Error messages
   - Environment details

5. **Question**
   - Specific question you need answered
   - What would help you move forward

**Example Template:**
```
I''m building a [project type] using [technology] and trying to [goal].

**Problem:**
When I [action], I get [error/unexpected behavior]. I expected [expected result].

**What I''ve Tried:**
- [Solution 1]: Didn''t work because [reason]
- [Solution 2]: Partially worked but [issue]
- Consulted [documentation/resource]

**Code:**
\`\`\`language
// Relevant code here
\`\`\`

**Error:**
\`\`\`
Full error message
\`\`\`

**Environment:**
- OS: [operating system]
- [Technology]: [version]
- [Other relevant tools/versions]

**Question:**
[Specific question]
```

### Step 3: Format Properly

**Use Markdown:**
- Headers for sections (`## Header`)
- Code blocks with language specification
- Bold for emphasis (`**important**`)
- Lists for multiple items
- Quotes for error messages or citations

**Code Formatting:**
```javascript
// Always specify the language
function example() {
  return "properly formatted";
}
```

**Don''t:**
- Post screenshots of code (unless showing UI)
- Use inline code for long snippets
- Forget to close code blocks
- Mix tabs and spaces inconsistently

### Step 4: Add Tags
Tags help categorize your thread:
- Use 2-5 relevant tags
- Choose existing tags when possible
- Be specific (e.g., "react-hooks" not just "react")
- Include the technology name
- Add difficulty level if relevant (beginner, intermediate, advanced)

**Example tags:**
`javascript`, `react`, `hooks`, `async`, `debugging`

### Step 5: Preview and Review
Before posting:
- Use the preview function
- Check formatting
- Read through for clarity
- Verify code blocks render correctly
- Check for typos and grammar
- Ensure all information is included

## After Posting

### Respond to Questions
Community members may ask for clarification:
- Check back within a few hours
- Answer follow-up questions promptly
- Provide additional information if requested
- Be patient and polite

### Update Your Thread
If you discover new information:
- Edit your original post to add updates
- Use "Edit:" or "Update:" to mark changes
- Don''t delete important context
- Keep the thread current

### Mark the Solution
When someone solves your problem:
- Mark their reply as the solution [Check]
- Upvote helpful responses
- Post a follow-up explaining what worked
- Thank those who helped

### Close the Loop
Even if you solve it yourself:
- Post your solution
- Explain what you learned
- Help future users with the same problem
- Mark your own answer as the solution

## Common Mistakes

### [X] Avoid These:
1. **Vague titles:** "Help with code"
2. **No code:** "My program doesn''t work"
3. **Too much code:** Pasting your entire project
4. **No formatting:** Wall of text with no structure
5. **Demanding urgency:** "URGENT NEED HELP NOW"
6. **Multiple posts:** Posting the same question in multiple categories
7. **No follow-up:** Never responding to helpers
8. **Deleting solved threads:** Others can''t learn from them

### [Check] Do This Instead:
1. **Specific titles:** "[React] useState not updating"
2. **Include code:** Minimal, relevant snippets
3. **Right amount:** Just enough to reproduce the issue
4. **Good formatting:** Headers, code blocks, lists
5. **Be patient:** "Looking for guidance on..."
6. **One post:** Choose the best category
7. **Engage:** Respond to all helpers
8. **Keep threads:** Mark as solved instead

## Examples

### Bad Thread:
**Title:** "Help!"
**Content:** "My code doesn''t work. Please help urgently!"

**Why it''s bad:**
- No information about the problem
- No code
- No context
- Demanding tone

### Good Thread:
**Title:** "[Python] TypeError when parsing JSON response from API"

**Content:**
```
I''m building a weather app that fetches data from OpenWeatherMap API. When I try to parse the JSON response, I get a TypeError.

**Problem:**
When I call `json.loads(response)`, I get:
\`\`\`
TypeError: the JSON object must be str, bytes or bytearray, not Response
\`\`\`

**What I''ve Tried:**
- Checked the API documentation - response should be JSON
- Verified the API key is correct
- Tried `response.text` but got a different error

**Code:**
\`\`\`python
import requests
import json

response = requests.get(url, params=params)
data = json.loads(response)  # Error happens here
\`\`\`

**Environment:**
- Python 3.9
- requests 2.28.0
- Ubuntu 22.04

**Question:**
How do I properly parse the JSON response from the requests library?
```

**Why it''s good:**
- Clear, specific title
- Explains the goal
- Shows the exact error
- Includes relevant code
- Lists what was tried
- Provides environment details
- Asks a specific question

## Need Help?

If you''re unsure about anything:
- Ask in this thread
- Check the FAQ
- Look at highly-rated threads as examples
- Contact a moderator

**Remember:** Everyone''s first post is nerve-wracking. Just do your best, and the community will help you improve! [Sparkles]'
  WHERE id = 'post-start-002-1';


  UPDATE public.posts SET content = 
'## Title Writing Masterclass [Target]

Your title is the most important part of your thread. Here''s how to make it great:

### The Anatomy of a Perfect Title

**Format:** `[Technology] Action/Problem + Context`

**Components:**
1. **Technology tag:** [React], [Python], [Docker]
2. **Action verb:** "How to", "Why does", "Getting"
3. **Specific problem:** The actual issue
4. **Key context:** Version, environment, or scenario

### Title Templates

**For Questions:**
- "[Tech] How to [action] when [condition]"
- "[Tech] Why does [behavior] happen in [scenario]"
- "[Tech] Best practice for [task] with [constraint]"

**For Errors:**
- "[Tech] [ErrorType] when [action]"
- "[Tech] [Error message] after [change]"
- "[Tech] Getting [error] on [environment]"

**For Discussions:**
- "[Tech] Comparison: [Option A] vs [Option B] for [use case]"
- "[Tech] Is [approach] still relevant in [year/version]"
- "[Tech] Pros and cons of [technique]"

### Real Examples

**Before → After:**

[X] "React question"
[Check] "[React] How to prevent useEffect from running on initial render"

[X] "Error in my code"
[Check] "[Node.js] EADDRINUSE error when restarting Express server"

[X] "Need help with database"
[Check] "[PostgreSQL] Slow query performance with JOIN on large tables"

[X] "Which is better?"
[Check] "[JavaScript] Comparison: async/await vs Promises for error handling"

### Title Checklist

Before posting, verify your title:
- [ ] Includes technology/framework name
- [ ] Describes the specific problem
- [ ] Is searchable (others could find it)
- [ ] Under 100 characters
- [ ] No ALL CAPS or excessive punctuation
- [ ] No "urgent", "help", "please"
- [ ] Makes sense without reading the post

### SEO Tips

Make your title discoverable:
- Use exact error messages when possible
- Include version numbers if relevant
- Use common terminology
- Think about what you''d search for
- Include the platform/OS if relevant

**Example:**
"[React Native] Image not displaying on iOS 16 but works on Android"

This title will help anyone with the same issue find your thread!

---

**Practice makes perfect!** Don''t worry if your first few titles aren''t perfect. The community will help you improve. [TrendingUp]'
  WHERE id = 'post-start-002-2';


  -- ========================================================================
  -- Update thread reply counts
  -- ========================================================================
  
  UPDATE public.threads SET reply_count = 2, last_reply_at = NOW() WHERE id = 't-rules-001';
  UPDATE public.threads SET reply_count = 1, last_reply_at = NOW() WHERE id = 't-rules-002';
  UPDATE public.threads SET reply_count = 2, last_reply_at = NOW() WHERE id = 't-rules-003';
  UPDATE public.threads SET reply_count = 3, last_reply_at = NOW() WHERE id = 't-start-001';
  UPDATE public.threads SET reply_count = 2, last_reply_at = NOW() WHERE id = 't-start-002';

  RAISE NOTICE 'Successfully updated all posts with detailed, professional content';
  
END $$;

-- ============================================================================
-- Verify the updates
-- ============================================================================

SELECT 
  t.title as thread_title,
  COUNT(p.id) as post_count,
  MAX(LENGTH(p.content)) as longest_post
FROM public.threads t
LEFT JOIN public.posts p ON p.thread_id = t.id
WHERE t.category_id = 'announcements'
GROUP BY t.id, t.title
ORDER BY t.created_at;

-- Show sample of updated content
SELECT 
  p.id,
  t.title as thread,
  LEFT(p.content, 100) as preview,
  LENGTH(p.content) as content_length,
  p.upvotes
FROM public.posts p
JOIN public.threads t ON p.thread_id = t.id
WHERE t.category_id = 'announcements'
ORDER BY t.created_at, p.created_at
LIMIT 10;
