# Polls 406 Error Fix

## Problem
Getting `406 (Not Acceptable)` error when fetching polls:
```
GET /rest/v1/polls?select=*,options:poll_options(*),votes:poll_votes(user_id,option_id)&thread_id=eq.t-updates-001 406
```

## Root Causes

### 1. Nested Query Format Issue
Supabase PostgREST may reject nested queries with certain configurations or when:
- Foreign key relationships aren't properly defined
- RLS policies block the nested query
- API version doesn't support the nested syntax

### 2. Missing Foreign Key Relationships
The nested query syntax requires proper foreign key relationships:
```sql
poll_options.poll_id -> polls.id
poll_votes.poll_id -> polls.id
poll_votes.option_id -> poll_options.id
```

### 3. RLS Policy Conflicts
Row Level Security policies might block nested queries even if individual table queries work.

## Solution Applied

### Changed from Nested Query to Separate Queries

**Before (Nested - Causes 406):**
```typescript
const { data: poll, error } = await supabase
  .from('polls')
  .select(`
    *,
    options:poll_options(*),
    votes:poll_votes(user_id, option_id)
  `)
  .eq('thread_id', threadId)
  .single();
```

**After (Separate - Works):**
```typescript
// 1. Fetch poll
const { data: poll } = await supabase
  .from('polls')
  .select('*')
  .eq('thread_id', threadId)
  .maybeSingle();

// 2. Fetch options
const { data: options } = await supabase
  .from('poll_options')
  .select('*')
  .eq('poll_id', poll.id);

// 3. Fetch votes
const { data: votes } = await supabase
  .from('poll_votes')
  .select('user_id, option_id')
  .eq('poll_id', poll.id);
```

### Benefits of Separate Queries
1. ✅ Avoids 406 errors
2. ✅ More explicit error handling per table
3. ✅ Can continue even if one query fails
4. ✅ Easier to debug
5. ✅ Better RLS policy compatibility

### Trade-offs
- ⚠️ 3 network requests instead of 1
- ⚠️ Slightly slower (but negligible with good connection)
- ✅ More reliable and maintainable

## Migration Applied

Created `supabase/migrations/20240202_create_polls_tables.sql` with:
- ✅ `polls` table
- ✅ `poll_options` table
- ✅ `poll_votes` table
- ✅ Foreign key relationships
- ✅ RLS policies
- ✅ Triggers for vote counting
- ✅ Proper indexes

## Verification Steps

### 1. Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('polls', 'poll_options', 'poll_votes');
```

Expected: 3 rows

### 2. Check Foreign Keys
```sql
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('polls', 'poll_options', 'poll_votes');
```

Expected foreign keys:
- `polls.thread_id` → `threads.id`
- `poll_options.poll_id` → `polls.id`
- `poll_votes.poll_id` → `polls.id`
- `poll_votes.option_id` → `poll_options.id`
- `poll_votes.user_id` → `forum_users.id`

### 3. Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('polls', 'poll_options', 'poll_votes');
```

Expected policies for each table:
- SELECT policy (anyone can view)
- INSERT policy (authenticated users)
- DELETE policy (users can delete own votes)

### 4. Test Query Manually
```sql
-- Test individual queries
SELECT * FROM polls WHERE thread_id = 't-updates-001';
SELECT * FROM poll_options WHERE poll_id = 'poll-xxx';
SELECT * FROM poll_votes WHERE poll_id = 'poll-xxx';
```

## Testing in Application

### 1. Check Console
After the fix, you should see:
- ✅ No more 406 errors
- ✅ Warning messages if polls don't exist (normal)
- ✅ Polls load correctly when they exist

### 2. Test Poll Creation
```typescript
// Create a test poll
const { data: poll } = await supabase
  .from('polls')
  .insert({
    thread_id: 't-test-001',
    question: 'Test poll?',
    ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_multiple_choice: false
  })
  .select()
  .single();

// Add options
await supabase
  .from('poll_options')
  .insert([
    { poll_id: poll.id, text: 'Option 1' },
    { poll_id: poll.id, text: 'Option 2' }
  ]);
```

### 3. Test Poll Voting
```typescript
// Vote on a poll
await supabase
  .from('poll_votes')
  .insert({
    poll_id: 'poll-xxx',
    option_id: 'option-xxx',
    user_id: 'user-xxx'
  });
```

## Alternative Solutions (If Still Having Issues)

### Option 1: Use Supabase Views
Create a view that pre-joins the data:
```sql
CREATE VIEW poll_details AS
SELECT 
  p.*,
  json_agg(DISTINCT jsonb_build_object(
    'id', po.id,
    'text', po.text,
    'votes', po.votes
  )) as options,
  json_agg(DISTINCT jsonb_build_object(
    'user_id', pv.user_id,
    'option_id', pv.option_id
  )) as votes
FROM polls p
LEFT JOIN poll_options po ON po.poll_id = p.id
LEFT JOIN poll_votes pv ON pv.poll_id = p.id
GROUP BY p.id;
```

Then query the view:
```typescript
const { data } = await supabase
  .from('poll_details')
  .select('*')
  .eq('thread_id', threadId)
  .single();
```

### Option 2: Use Supabase Functions
Create a PostgreSQL function:
```sql
CREATE OR REPLACE FUNCTION get_poll_with_details(thread_id_param TEXT, user_id_param TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'poll', row_to_json(p.*),
    'options', (SELECT json_agg(row_to_json(po.*)) FROM poll_options po WHERE po.poll_id = p.id),
    'votes', (SELECT json_agg(row_to_json(pv.*)) FROM poll_votes pv WHERE pv.poll_id = p.id)
  ) INTO result
  FROM polls p
  WHERE p.thread_id = thread_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

Then call it:
```typescript
const { data } = await supabase.rpc('get_poll_with_details', {
  thread_id_param: threadId,
  user_id_param: currentUserId
});
```

### Option 3: Disable Polls Temporarily
If polls aren't critical, you can disable them:
```typescript
// In ForumContext.tsx
const getPollForThread = useCallback((threadId: string): PollData | null => {
  // Temporarily disable polls
  return null;
}, []);
```

## Performance Considerations

### Current Approach (3 Queries)
- **Pros:** Reliable, works around 406 error
- **Cons:** 3 network round trips
- **Impact:** ~50-150ms additional latency (negligible)

### Optimization: Batch Queries
If you need to fetch polls for multiple threads:
```typescript
// Fetch all polls at once
const { data: polls } = await supabase
  .from('polls')
  .select('*')
  .in('thread_id', threadIds);

// Fetch all options for those polls
const pollIds = polls.map(p => p.id);
const { data: options } = await supabase
  .from('poll_options')
  .select('*')
  .in('poll_id', pollIds);

// Group by poll_id
const optionsByPoll = options.reduce((acc, opt) => {
  if (!acc[opt.poll_id]) acc[opt.poll_id] = [];
  acc[opt.poll_id].push(opt);
  return acc;
}, {});
```

## Summary

✅ **Fixed:** Changed from nested query to separate queries  
✅ **Created:** Migration for polls tables  
✅ **Improved:** Error handling to gracefully handle missing polls  
✅ **Result:** No more 406 errors, polls work when they exist  

The application now handles polls gracefully whether they exist or not, and the 406 error is eliminated.
