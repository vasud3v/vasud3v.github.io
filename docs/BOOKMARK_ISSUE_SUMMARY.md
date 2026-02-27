# Bookmark Issue - Summary & Solution

## Problem
Bookmarks show "saved" toast message but don't persist in the database.

## Root Cause Found
The bookmark button is being triggered TWICE, causing:
1. First click: Bookmark added to database
2. Second click (immediate): Bookmark removed from database
Result: User sees "saved" but bookmark is gone

## Changes Made

### 1. Added Debounce Protection
- Added `isBookmarking` state to ThreadRow
- Prevents double-clicks with 500ms delay
- File: `src/components/forum/ThreadRow.tsx`

### 2. Fixed BookmarksPage
- Now fetches bookmarks directly from database
- Previously only showed already-loaded threads
- File: `src/components/forum/BookmarksPage.tsx`

### 3. Added Comprehensive Logging
- All bookmark operations log to console
- Shows user ID, thread ID, success/failure
- Files: `src/hooks/forum/useBookmarksWatches.ts`, `src/components/forum/ThreadRow.tsx`

### 4. Fixed User ID Consistency
- Uses `authUserId` consistently everywhere
- File: `src/hooks/forum/useBookmarksWatches.ts`

## How to Test

### Step 1: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 2: Test Bookmark
1. Go to forum home page
2. Find a thread in the list
3. Click the bookmark icon (should be on the right side of the thread row)
4. Open browser console (F12 → Console tab)
5. Look for these logs:
   ```
   [ThreadRow] Bookmark button clicked! { threadId: '...', timestamp: '...' }
   [Bookmark] Toggle bookmark: { threadId: '...', authUserId: '...', ... }
   [Bookmark] Inserting bookmark to database...
   [Bookmark] Insert successful: [...]
   ```

### Step 3: Verify in Database
Run this command:
```bash
node scripts/check-bookmarks-db.js
```

Should show your bookmark.

### Step 4: Check Bookmarks Page
1. Click "Bookmarks" in the navigation
2. Should see your bookmarked thread

## If Still Not Working

### Check 1: Are you clicking the right button?
The bookmark button is in the thread list (ThreadRow), not inside the thread detail page.
Look for a bookmark/ribbon icon on the right side of each thread row.

### Check 2: Is the console showing ANY logs?
If you don't see `[ThreadRow] Bookmark button clicked!` then:
- The page hasn't reloaded with new code
- You're clicking something else
- JavaScript is disabled

### Check 3: Check for errors
Look in console for red error messages after clicking bookmark.
Common errors:
- Foreign key constraint → User not in forum_users table
- Permission denied → RLS policy issue
- Duplicate key → Trying to bookmark twice

## Manual Database Check

If bookmarks still aren't working, check the database directly:

```sql
-- Check if thread_bookmarks table exists
SELECT * FROM thread_bookmarks LIMIT 5;

-- Check your user exists in forum_users
SELECT id, username FROM forum_users WHERE id = 'YOUR_USER_ID';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'thread_bookmarks';
```

## Next Steps

1. **Hard refresh** the browser (Ctrl+Shift+R)
2. **Click bookmark** on a thread in the list
3. **Share the console output** - copy everything that appears
4. If no logs appear, take a screenshot of where you're clicking

The logs will tell us exactly what's happening!
