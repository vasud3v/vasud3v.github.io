# Bookmark System Debugging Guide

## Quick Diagnosis

### Step 1: Check Browser Console
Open the thread page and try to bookmark. Check console for:
```
[toggleBookmark] START
[toggleBookmark] Action: ADD or REMOVE
[toggleBookmark] Optimistic update applied
[toggleBookmark] Inserting into database... or Deleting from database...
[toggleBookmark] Insert result: or Delete result:
[toggleBookmark] SUCCESS
```

### Step 2: Common Issues

#### Issue 1: No authUserId
**Symptom**: Console shows `[toggleBookmark] No authUserId, aborting`
**Cause**: User not authenticated or auth state not loaded
**Fix**: 
- Check if user is logged in
- Check AuthContext is providing authUserId
- Verify `useAuth()` hook returns user data

#### Issue 2: Database Error
**Symptom**: Console shows `[toggleBookmark] ERROR:` with database error
**Causes**:
1. **Foreign key violation**: User doesn't exist in `forum_users` table
2. **RLS policy blocking**: User doesn't have permission
3. **Table doesn't exist**: Migration not run

**Fix**:
```sql
-- Check if user exists in forum_users
SELECT * FROM forum_users WHERE id = 'your-user-id';

-- If not, user needs to be created first
-- This should happen automatically on signup
```

#### Issue 3: Optimistic Update Works But Database Fails
**Symptom**: Bookmark appears to work but disappears on refresh
**Cause**: Database operation failing silently
**Fix**: Check Network tab for failed requests

### Step 3: Run Test Script

```bash
node scripts/test-bookmarks.js
```

This will test:
- Table exists
- User is authenticated
- User exists in forum_users
- Can insert bookmark
- Can delete bookmark
- RLS policies are correct

### Step 4: Run SQL Verification

Run `supabase/scripts/FIX_BOOKMARK_SYSTEM.sql` in Supabase SQL editor.

This will:
- Verify table structure
- Check RLS policies
- Fix any policy issues
- Grant necessary permissions

## Manual Testing

### Test in Supabase SQL Editor

```sql
-- 1. Check your user ID
SELECT auth.uid();

-- 2. Check if you exist in forum_users
SELECT * FROM forum_users WHERE id = auth.uid()::text;

-- 3. Try to insert a bookmark
INSERT INTO thread_bookmarks (user_id, thread_id)
VALUES (
  auth.uid()::text,
  (SELECT id FROM threads LIMIT 1)
)
ON CONFLICT (user_id, thread_id) DO NOTHING
RETURNING *;

-- 4. Check if bookmark was created
SELECT * FROM thread_bookmarks WHERE user_id = auth.uid()::text;

-- 5. Try to delete the bookmark
DELETE FROM thread_bookmarks 
WHERE user_id = auth.uid()::text 
AND thread_id = (SELECT id FROM threads LIMIT 1)
RETURNING *;
```

## Expected Behavior

### When Adding Bookmark:
1. Click bookmark icon
2. Icon changes immediately (optimistic update)
3. Database insert happens in background
4. If successful: bookmark persists
5. If failed: icon reverts and error shown

### When Removing Bookmark:
1. Click bookmark icon
2. Icon changes immediately (optimistic update)
3. Database delete happens in background
4. If successful: bookmark removed
5. If failed: icon reverts and error shown

## Code Flow

```typescript
// 1. User clicks bookmark button
onClick={() => toggleBookmark(threadId)}

// 2. toggleBookmark function runs
const toggleBookmark = async (threadId: string) => {
  // 3. Check authentication
  if (!authUserId) return;
  
  // 4. Optimistic update (immediate UI change)
  setBookmarkedThreads(prev => {
    const next = new Set(prev);
    wasBookmarked ? next.delete(threadId) : next.add(threadId);
    return next;
  });
  
  // 5. Database operation
  if (wasBookmarked) {
    await supabase.from('thread_bookmarks').delete()...
  } else {
    await supabase.from('thread_bookmarks').insert()...
  }
  
  // 6. If error: rollback optimistic update
  catch (error) {
    setBookmarkedThreads(prev => {
      // Revert the change
    });
  }
}
```

## Troubleshooting Checklist

- [ ] User is logged in
- [ ] User exists in `forum_users` table
- [ ] `thread_bookmarks` table exists
- [ ] RLS is enabled on `thread_bookmarks`
- [ ] RLS policies allow SELECT, INSERT, DELETE
- [ ] `authUserId` is available in component
- [ ] No console errors
- [ ] Network requests succeed (check Network tab)
- [ ] Bookmarks persist after page refresh

## Common Fixes

### Fix 1: User Not in forum_users
```sql
-- This should be automatic, but if needed:
INSERT INTO forum_users (
  id, username, avatar, email, 
  post_count, reputation, join_date, is_online
)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', email),
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id,
  email,
  0, 0, created_at, false
FROM auth.users
WHERE id = 'your-user-id'
ON CONFLICT (id) DO NOTHING;
```

### Fix 2: Reset RLS Policies
Run the `FIX_BOOKMARK_SYSTEM.sql` script.

### Fix 3: Clear Stale State
```typescript
// In browser console
localStorage.clear();
// Then refresh page
```

## Verification

After fixes, verify:

1. **Load bookmarks on page load:**
```typescript
// Should see in console when page loads
console.log('Loaded bookmarks:', bookmarkedThreads.size);
```

2. **Add bookmark:**
```typescript
// Should see in console
[toggleBookmark] START
[toggleBookmark] Action: ADD
[toggleBookmark] SUCCESS
```

3. **Remove bookmark:**
```typescript
// Should see in console
[toggleBookmark] START
[toggleBookmark] Action: REMOVE
[toggleBookmark] SUCCESS
```

4. **Persist after refresh:**
- Add bookmark
- Refresh page
- Bookmark should still be there

## Still Not Working?

If bookmarks still don't work after all checks:

1. **Export debug info:**
```typescript
// In browser console
console.log({
  authUserId: 'check auth context',
  bookmarkedThreads: Array.from(bookmarkedThreads),
  currentUser: currentUser
});
```

2. **Check Supabase logs:**
- Go to Supabase Dashboard
- Check Logs section
- Look for errors related to thread_bookmarks

3. **Verify database connection:**
```typescript
// In browser console
const { data, error } = await supabase
  .from('thread_bookmarks')
  .select('count');
console.log({ data, error });
```

## Success Indicators

✅ Console shows successful bookmark operations
✅ Network tab shows 200/201 responses
✅ Bookmarks persist after page refresh
✅ No errors in console
✅ Icon state matches database state

---

**Last Updated**: 2026-02-27
**Status**: Debugging Guide
