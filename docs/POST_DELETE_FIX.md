# Post Delete Fix

## Problem
Users can click "Delete" on their own posts, see a success message, and the post disappears. However, when they reload the page, the post reappears.

## Root Cause
The RLS (Row Level Security) policy on the `posts` table only allows staff members to delete posts:

```sql
CREATE POLICY "posts_delete" ON public.posts FOR DELETE
  USING (public.is_staff(auth.uid()::text));
```

This means:
1. Frontend code allows users to delete their own posts
2. The delete operation appears to succeed locally (optimistic update)
3. The actual database DELETE fails silently due to RLS
4. On page reload, the post is still in the database and reappears

## Solution
Update the RLS policy to allow users to delete their own posts:

```sql
CREATE POLICY "posts_delete" ON public.posts FOR DELETE
USING (
  auth.uid()::text = author_id 
  OR 
  public.is_staff(auth.uid()::text)
);
```

## Quick Fix (2 minutes)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste: `supabase/scripts/FIX_POST_DELETE_RLS.sql`
3. Click **Run**
4. Done!

## What Gets Fixed

| User Type | Before | After |
|-----------|--------|-------|
| Post Author | ❌ Cannot delete (fails silently) | ✅ Can delete own posts |
| Staff (Mod/Admin) | ✅ Can delete any post | ✅ Can delete any post |
| Other Users | ❌ Cannot delete | ❌ Cannot delete |

## How It Works

### Before Fix
```
User clicks "Delete Post"
        ↓
Frontend removes post from local state (optimistic)
        ↓
Frontend calls: supabase.from('posts').delete().eq('id', postId)
        ↓
Database checks RLS policy: is_staff(auth.uid())
        ↓
User is NOT staff → DELETE fails silently
        ↓
Post remains in database
        ↓
User reloads page
        ↓
Post reappears ❌
```

### After Fix
```
User clicks "Delete Post"
        ↓
Frontend removes post from local state (optimistic)
        ↓
Frontend calls: supabase.from('posts').delete().eq('id', postId)
        ↓
Database checks RLS policy: author_id = auth.uid() OR is_staff()
        ↓
User IS the author → DELETE succeeds
        ↓
Post deleted from database
        ↓
Realtime subscription broadcasts DELETE event
        ↓
Other users see post disappear in real-time
        ↓
User reloads page
        ↓
Post stays deleted ✅
```

## Testing

### Test Post Deletion

1. **As a regular user:**
   - Create a post in any thread
   - Click the delete button on your post
   - Confirm deletion
   - Verify post disappears
   - Reload the page
   - Verify post is still gone ✅

2. **Try to delete someone else's post:**
   - Find a post by another user
   - Delete button should not appear (or deletion should fail)
   - This is correct behavior ✅

3. **As staff (moderator/admin):**
   - Can delete any post
   - This should work both before and after the fix ✅

### Verify RLS Policy

Run in Supabase SQL Editor:
```sql
-- Check the current policy
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'posts'
  AND policyname = 'posts_delete';
```

Expected output should show the policy allows both authors and staff.

## Related: Thread Deletion

Threads have a similar policy that only allows staff to delete:

```sql
CREATE POLICY "threads_delete" ON public.threads FOR DELETE
  USING (public.is_staff(auth.uid()::text));
```

**This is intentional** for most forums - you typically don't want users deleting entire threads (discussions) as it removes content for everyone.

If you DO want users to delete their own threads, uncomment the thread policy section in the fix script.

## Frontend Code

The frontend code in `src/hooks/forum/usePostsOptimized.ts` already handles deletion correctly:

```typescript
const deletePost = useCallback(async (postId: string): Promise<void> => {
  // ... validation ...
  
  // Optimistically remove from local state
  setPostsMap((prev) => {
    const updated = { ...prev };
    for (const threadId in updated) {
      updated[threadId] = updated[threadId].filter(p => p.id !== postId);
    }
    return updated;
  });
  
  try {
    // Delete from database
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
    
    // Update thread reply count
    // ...
  } catch (error) {
    // Rollback on error
    setPostsMap((prev) => {
      // ... restore post ...
    });
    throw error;
  }
}, [/* deps */]);
```

The code:
1. ✅ Removes post optimistically
2. ✅ Calls database delete
3. ✅ Updates thread stats
4. ✅ Rolls back on error
5. ✅ Handles realtime updates

The only issue was the RLS policy blocking the database delete.

## Realtime Updates

The realtime subscription in `src/hooks/forum/useRealtimeOptimized.ts` correctly handles DELETE events:

```typescript
.on('postgres_changes', {
  event: 'DELETE',
  schema: 'public',
  table: 'posts',
  filter: `thread_id=eq.${threadId}`,
}, (payload) => {
  setPostsMap((prev) => ({
    ...prev,
    [threadId]: (prev[threadId] || []).filter((p) => p.id !== payload.old.id),
  }));
})
```

When a post is deleted:
1. Database broadcasts DELETE event
2. All connected clients receive the event
3. Post is removed from their local state
4. Everyone sees the post disappear in real-time

## Security Considerations

### Why This Is Safe

1. **Users can only delete their own posts**
   - Policy checks: `auth.uid()::text = author_id`
   - No user can delete another user's posts

2. **Staff can delete any post**
   - Moderators need this ability
   - Policy checks: `is_staff(auth.uid()::text)`

3. **Cascade deletes are handled**
   - Post reactions are deleted automatically (ON DELETE CASCADE)
   - Post votes are deleted automatically
   - Post bookmarks are deleted automatically

4. **Thread stats are updated**
   - Triggers update thread reply_count
   - Topic stats are updated via triggers
   - Category stats are updated

### What About Abuse?

If you're concerned about users deleting posts to hide evidence:

1. **Add soft deletes** (mark as deleted instead of removing):
   ```sql
   ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMPTZ;
   ALTER TABLE posts ADD COLUMN deleted_by TEXT;
   ```

2. **Keep deletion history** in moderation logs

3. **Limit deletion time window**:
   ```sql
   CREATE POLICY "posts_delete" ON public.posts FOR DELETE
   USING (
     (auth.uid()::text = author_id 
      AND created_at > NOW() - INTERVAL '1 hour')
     OR 
     public.is_staff(auth.uid()::text)
   );
   ```

## Files

- **Fix Script:** `supabase/scripts/FIX_POST_DELETE_RLS.sql`
- **Migration:** `supabase/migrations/20240306_fix_post_delete_rls.sql`
- **Documentation:** `docs/POST_DELETE_FIX.md` (this file)

## Summary

The post delete feature was working correctly in the frontend code, but the database RLS policy was blocking non-staff users from deleting posts. Running the fix script updates the policy to allow users to delete their own posts while maintaining security.

Run `supabase/scripts/FIX_POST_DELETE_RLS.sql` to fix the issue immediately.
