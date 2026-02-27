# Bookmark RLS Policy Fix

## Problem
Bookmarks are not saving because of Row-Level Security (RLS) policy blocking inserts.

**Error:** `new row violates row-level security policy for table "thread_bookmarks"`

## Root Cause
The `thread_bookmarks` table has RLS enabled but doesn't have the correct policies to allow authenticated users to insert/delete their own bookmarks.

## Solution

You need to add RLS policies in your Supabase dashboard:

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com
2. Select your project
3. Go to **Authentication** > **Policies**
4. Find the `thread_bookmarks` table

### Step 2: Add INSERT Policy
Create a new policy for INSERT operations:

**Policy Name:** `Users can insert their own bookmarks`

**Policy Definition:**
```sql
CREATE POLICY "Users can insert their own bookmarks"
ON thread_bookmarks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

**What this does:** Allows authenticated users to insert bookmarks where the `user_id` matches their own user ID.

### Step 3: Add DELETE Policy
Create a new policy for DELETE operations:

**Policy Name:** `Users can delete their own bookmarks`

**Policy Definition:**
```sql
CREATE POLICY "Users can delete their own bookmarks"
ON thread_bookmarks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

**What this does:** Allows authenticated users to delete only their own bookmarks.

### Step 4: Add SELECT Policy
Create a new policy for SELECT operations:

**Policy Name:** `Users can view their own bookmarks`

**Policy Definition:**
```sql
CREATE POLICY "Users can view their own bookmarks"
ON thread_bookmarks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

**What this does:** Allows authenticated users to view only their own bookmarks.

### Alternative: Quick Fix via SQL Editor

Go to **SQL Editor** in Supabase and run this:

```sql
-- Enable RLS if not already enabled
ALTER TABLE thread_bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (optional, only if you want to start fresh)
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON thread_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON thread_bookmarks;
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON thread_bookmarks;

-- Create new policies
CREATE POLICY "Users can insert their own bookmarks"
ON thread_bookmarks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
ON thread_bookmarks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own bookmarks"
ON thread_bookmarks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

## Testing After Fix

After adding the policies, test the bookmark functionality:

1. Restart your dev server (Ctrl+C, then `npm run dev`)
2. Hard refresh your browser (Ctrl+Shift+R)
3. Try bookmarking a thread
4. Check if it appears in the Bookmarks page
5. Run the verification script:
   ```bash
   node scripts/check-bookmarks-db.js
   ```

## Why This Happened

Supabase enables RLS by default on new tables for security. Without explicit policies, no operations are allowed. The bookmark feature was working in the UI (optimistic updates) but failing silently at the database level.

## Additional Notes

- The same RLS policies should be checked for `thread_watches` table if watch functionality has similar issues
- Make sure your `forum_users` table also has proper RLS policies
- Always test with actual database queries, not just UI feedback
