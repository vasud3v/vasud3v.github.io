# Fix Post Relationships Script

This script fixes existing posts to work with the threaded view by setting up proper parent-child relationships.

## What It Does

1. **Analyzes all existing posts** in your database
2. **Detects quoted posts** - If a post quotes another user (e.g., `> **@username** wrote:`), it links to that user's post
3. **Links chronologically** - If no quote is found, it links to the previous post in the thread
4. **Skips original posts** - The first post in each thread remains a root-level post

## How to Run

### Step 1: Install dependencies (if not already installed)
```bash
npm install
```

### Step 2: Make sure your .env.local file has Supabase credentials
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Step 3: Run the script
```bash
node scripts/fix-post-relationships.js
```

## What You'll See

```
🔧 Fixing Post Relationships for Threaded View

Found 5 threads to process

📝 Processing thread: Welcome to the Forum!
   Found 10 posts
   ✓ Post 1 is the original post (no parent)
   → Post 2 linked to previous post (chronological)
   → Post 3 quotes @john, linking to their post
   → Post 4 linked to previous post (chronological)
   ...
   ✅ Updated 9 posts with reply_to relationships

📝 Processing thread: How to use this forum?
   Found 5 posts
   ...

✅ Done! All post relationships have been fixed.

💡 Now try switching to Threaded view in the forum to see nested replies!
```

## After Running

1. Refresh your forum page
2. Open any thread
3. Click the "Threaded" button
4. You should now see posts indented based on their relationships!

## Example Result

### Before (Flat only):
```
Post #1 - Original
Post #2 - Reply
Post #3 - Reply
Post #4 - Reply
```

### After (Threaded view):
```
Post #1 - Original
  Post #2 - Reply to #1
    Post #3 - Reply to #2
  Post #4 - Reply to #1
```

## Strategies Used

1. **Quote Detection**: If a post contains `> **@username** wrote:`, it's linked to that user's most recent post
2. **Chronological Linking**: If no quote is found, the post is linked to the immediately previous post
3. **Smart Ordering**: Posts are processed in chronological order to maintain conversation flow

## Safety

- ✅ Only updates posts that don't already have `reply_to` set
- ✅ Doesn't modify post content
- ✅ Doesn't delete anything
- ✅ Can be run multiple times safely

## Troubleshooting

### "Missing Supabase credentials"
Make sure your `.env.local` file exists and has the correct values.

### "Error fetching posts"
Check that your Supabase connection is working and the database schema is correct.

### Posts still look flat
1. Check browser console for logs: `[ThreadedPostList] Posts with replyTo: X`
2. If X is 0, the script didn't run successfully
3. Try running the script again
4. Hard refresh the page (Ctrl+Shift+R)

## Manual Alternative

If you prefer to do this manually in SQL:

```sql
-- Link all posts to the previous post in the same thread (simple approach)
WITH ranked_posts AS (
  SELECT 
    id,
    thread_id,
    LAG(id) OVER (PARTITION BY thread_id ORDER BY created_at) as prev_post_id
  FROM posts
)
UPDATE posts
SET reply_to = ranked_posts.prev_post_id
FROM ranked_posts
WHERE posts.id = ranked_posts.id
  AND posts.reply_to IS NULL
  AND ranked_posts.prev_post_id IS NOT NULL;
```

This will link each post to the one before it chronologically.
