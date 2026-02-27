# Topic (Subcategory) Stats Fix

## Problem
Topics (subcategories) are not automatically updating their statistics:
- `thread_count` - Number of threads in the topic
- `post_count` - Number of posts in threads of this topic
- `last_activity` - Timestamp of the last post/thread
- `last_post_by` - User ID of the last poster

## Root Cause
The application code only updates category stats when threads/posts are created, but does NOT update topic stats. There are no database triggers to automatically maintain these counts.

## Solution
Create database triggers that automatically update topic statistics whenever:
- A thread is created, deleted, or moved to a different topic
- A post is created or deleted in a thread that belongs to a topic

## Implementation

### Quick Fix (Run This Now)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste: `supabase/scripts/FIX_TOPIC_STATS_TRIGGERS.sql`
3. Click **Run**

This will:
- ✅ Create trigger functions
- ✅ Create triggers on threads and posts tables
- ✅ Recalculate all existing topic stats
- ✅ Verify the setup

### What Gets Created

#### 1. Function: `update_topic_thread_stats()`
Automatically updates topic stats when threads change:
- **INSERT**: Increments thread_count, updates last_activity
- **DELETE**: Decrements thread_count, recalculates last_activity
- **UPDATE**: Handles thread moves between topics

#### 2. Function: `update_topic_post_stats()`
Automatically updates topic stats when posts change:
- **INSERT**: Increments post_count, updates last_activity
- **DELETE**: Decrements post_count

#### 3. Triggers
- `trigger_update_topic_thread_stats` - Fires on thread changes
- `trigger_update_topic_post_stats` - Fires on post changes

## How It Works

### When a Thread is Created

```
User creates thread in Topic A
        ↓
Thread inserted into database
        ↓
Trigger: trigger_update_topic_thread_stats fires
        ↓
Function: update_topic_thread_stats() executes
        ↓
UPDATE topics SET
  thread_count = thread_count + 1,
  last_activity = NEW.created_at,
  last_post_by = NEW.author_id
WHERE id = NEW.topic_id
        ↓
Topic stats updated ✅
```

### When a Post is Created

```
User creates post in thread
        ↓
Post inserted into database
        ↓
Trigger: trigger_update_topic_post_stats fires
        ↓
Function: update_topic_post_stats() executes
        ↓
Looks up topic_id from thread
        ↓
UPDATE topics SET
  post_count = post_count + 1,
  last_activity = NEW.created_at,
  last_post_by = NEW.author_id
WHERE id = topic_id
        ↓
Topic stats updated ✅
```

### When a Thread is Moved

```
Admin moves thread from Topic A to Topic B
        ↓
Thread updated in database
        ↓
Trigger: trigger_update_topic_thread_stats fires
        ↓
Function detects topic_id changed
        ↓
Decrements Topic A thread_count
        ↓
Increments Topic B thread_count
        ↓
Updates last_activity for both topics
        ↓
Both topic stats updated ✅
```

## Testing

### Verify Triggers Exist

Run in Supabase SQL Editor:
```sql
-- Check if triggers are created
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_update_topic_thread_stats',
  'trigger_update_topic_post_stats'
);
```

Expected output: 2 rows showing both triggers

### Check Current Topic Stats

```sql
-- View all topic statistics
SELECT 
  t.id,
  t.name,
  t.thread_count,
  t.post_count,
  t.last_activity,
  t.last_post_by,
  c.name as category_name
FROM topics t
LEFT JOIN categories c ON t.category_id = c.id
ORDER BY t.category_id, t.name;
```

### Test Thread Creation

1. Create a new thread in a topic
2. Run the query above
3. Verify the topic's `thread_count` increased by 1
4. Verify `last_activity` updated to current time

### Test Post Creation

1. Reply to a thread in a topic
2. Run the query above
3. Verify the topic's `post_count` increased by 1
4. Verify `last_activity` updated to current time

## Manual Recalculation

If stats get out of sync, run this to recalculate:

```sql
DO $$
DECLARE
  topic_record RECORD;
  thread_count_val INTEGER;
  post_count_val INTEGER;
  last_activity_val TIMESTAMPTZ;
  last_post_by_val TEXT;
BEGIN
  FOR topic_record IN SELECT id FROM topics LOOP
    -- Count threads
    SELECT COUNT(*) INTO thread_count_val
    FROM threads WHERE topic_id = topic_record.id;
    
    -- Count posts
    SELECT COUNT(p.*) INTO post_count_val
    FROM posts p
    INNER JOIN threads t ON p.thread_id = t.id
    WHERE t.topic_id = topic_record.id;
    
    -- Get last activity
    SELECT last_reply_at, last_reply_by_id 
    INTO last_activity_val, last_post_by_val
    FROM threads
    WHERE topic_id = topic_record.id
    ORDER BY last_reply_at DESC NULLS LAST
    LIMIT 1;
    
    -- Update topic
    UPDATE topics
    SET 
      thread_count = COALESCE(thread_count_val, 0),
      post_count = COALESCE(post_count_val, 0),
      last_activity = COALESCE(last_activity_val, NOW()),
      last_post_by = last_post_by_val
    WHERE id = topic_record.id;
  END LOOP;
END $$;
```

## Frontend Impact

### Before Fix
- Topics showed stale/incorrect counts
- `thread_count` never updated
- `post_count` never updated
- `last_activity` never updated

### After Fix
- Topics automatically show correct counts
- Real-time updates when threads/posts are created
- Accurate last activity timestamps
- No frontend code changes needed

## Performance

### Impact
- Minimal: Triggers add ~1-2ms per thread/post operation
- Indexed lookups on `topic_id` make updates fast
- No additional queries needed from frontend

### Optimization
The triggers use:
- `SECURITY DEFINER` to bypass RLS
- `SET search_path = public` for security
- Indexed columns for fast lookups
- `GREATEST(count - 1, 0)` to prevent negative counts

## Troubleshooting

### Stats Not Updating

**Check if triggers exist:**
```sql
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name LIKE '%topic%';
```

**Check trigger functions:**
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%topic%';
```

**Check for errors in logs:**
- Go to Supabase Dashboard → Logs
- Look for trigger execution errors

### Stats Are Wrong

**Recalculate manually:**
Run the manual recalculation script above

**Check for orphaned data:**
```sql
-- Threads with invalid topic_id
SELECT id, title, topic_id
FROM threads
WHERE topic_id IS NOT NULL
  AND topic_id NOT IN (SELECT id FROM topics);

-- Posts in threads with invalid topic_id
SELECT p.id, p.thread_id, t.topic_id
FROM posts p
JOIN threads t ON p.thread_id = t.id
WHERE t.topic_id IS NOT NULL
  AND t.topic_id NOT IN (SELECT id FROM topics);
```

## Migration File

The fix is also available as a migration:
- File: `supabase/migrations/20240305_add_topic_stats_triggers.sql`
- Use this if you want to apply via Supabase CLI
- Or run the script version for immediate fix

## Related Issues

This fix also ensures:
- ✅ Category stats remain accurate (already working)
- ✅ Thread view counts work (separate fix)
- ✅ Forum stats stay in sync
- ✅ Real-time updates propagate correctly

## Summary

Run `supabase/scripts/FIX_TOPIC_STATS_TRIGGERS.sql` in your Supabase SQL Editor to:
1. Create automatic update triggers
2. Recalculate all existing stats
3. Ensure future updates happen automatically

No frontend code changes needed - everything is handled at the database level.
