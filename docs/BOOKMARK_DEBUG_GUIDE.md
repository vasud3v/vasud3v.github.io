# Bookmark Functionality Debug Guide

## Changes Made

### 1. Fixed User ID Consistency
- **Problem**: Was using `currentUser.id` for insert/delete but `authUserId` for loading
- **Solution**: Now consistently uses `authUserId` (from Supabase Auth) everywhere

### 2. Added Comprehensive Logging
All bookmark operations now log to console:
- User ID being used
- Thread ID being bookmarked
- Current bookmark state
- Database operation results
- Any errors with full details

### 3. Created Bookmarks Page
- New page at `/bookmarks` to view all bookmarked threads
- Shows empty state if no bookmarks
- Added "Bookmarks" link in navigation (only for authenticated users)

### 4. Added Toast Notifications
- Shows "Thread bookmarked" when adding
- Shows "Bookmark removed" when removing
- Shows error messages if operation fails

## How to Debug

### Step 1: Open Browser Console
Press F12 and go to Console tab

### Step 2: Try to Bookmark a Thread
Click the bookmark icon on any thread

### Step 3: Check Console Output
You should see logs like:
```
[Bookmarks] Loading bookmarks for user: <user-id>
[Bookmarks] Loaded bookmarks: X threads
[Bookmark] Toggle bookmark: { threadId: '...', authUserId: '...', wasBookmarked: false, ... }
[Bookmark] Optimistic update - new size: 1
[Bookmark] Inserting bookmark to database...
[Bookmark] Insert successful: [{ id: '...', thread_id: '...', user_id: '...' }]
```

### Step 4: Check for Errors
If you see errors, they will show:
- The exact error message
- The error code
- The operation that failed

## Common Issues

### Issue 1: "No authUserId"
**Symptom**: Console shows `[Bookmark] No authUserId, cannot bookmark`
**Cause**: User is not properly authenticated
**Solution**: Log out and log back in

### Issue 2: RLS Policy Error
**Symptom**: Error message about "policy" or "permission denied"
**Cause**: Row Level Security policies not set up correctly
**Solution**: Run the SQL script: `supabase/scripts/CREATE_MISSING_TABLES.sql`

### Issue 3: Foreign Key Error
**Symptom**: Error about "violates foreign key constraint"
**Cause**: User ID doesn't exist in `forum_users` table
**Solution**: Make sure user has a record in `forum_users` table

### Issue 4: Duplicate Key Error
**Symptom**: Error about "duplicate key value violates unique constraint"
**Cause**: Trying to bookmark the same thread twice
**Solution**: This shouldn't happen with optimistic updates, but if it does, refresh the page

## Database Schema

The `thread_bookmarks` table structure:
```sql
CREATE TABLE public.thread_bookmarks (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES threads(id),
  user_id TEXT NOT NULL REFERENCES forum_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);
```

## RLS Policies

```sql
-- Anyone can view bookmarks
CREATE POLICY "thread_bookmarks_select" 
  ON thread_bookmarks FOR SELECT 
  USING (true);

-- Authenticated users can insert their own bookmarks
CREATE POLICY "thread_bookmarks_insert" 
  ON thread_bookmarks FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only delete their own bookmarks
CREATE POLICY "thread_bookmarks_delete" 
  ON thread_bookmarks FOR DELETE 
  USING (auth.uid()::text = user_id);
```

## Testing Checklist

- [ ] User is logged in (check auth state)
- [ ] Console shows user ID when bookmarking
- [ ] Optimistic update works (bookmark icon changes immediately)
- [ ] Database insert succeeds (check console logs)
- [ ] Bookmark appears on `/bookmarks` page
- [ ] Unbookmarking works (removes from database)
- [ ] Page refresh maintains bookmark state

## Next Steps

1. Try bookmarking a thread
2. Check the browser console for detailed logs
3. Share any error messages you see
4. Check if the bookmark appears on `/bookmarks` page
5. Try refreshing the page to see if bookmark persists
