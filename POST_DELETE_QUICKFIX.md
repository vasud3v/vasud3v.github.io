# Quick Fix: Post Delete Not Working

## Problem
Users can delete their posts, but after page reload the posts reappear.

## Root Cause
RLS policy only allows staff to delete posts, not post authors.

## Solution (1 minute)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste: `supabase/scripts/FIX_POST_DELETE_RLS.sql`
3. Click **Run**
4. Done!

## What It Does

Changes the RLS policy from:
```sql
-- Only staff can delete
USING (public.is_staff(auth.uid()::text))
```

To:
```sql
-- Authors and staff can delete
USING (
  auth.uid()::text = author_id 
  OR 
  public.is_staff(auth.uid()::text)
)
```

## Test It

1. Create a post
2. Delete your post
3. Reload the page
4. Post should stay deleted ✅

## Security

✅ Users can only delete their own posts  
✅ Staff can delete any post  
✅ Users cannot delete other users' posts  
✅ Cascade deletes work correctly  

## Files

- **Fix Script:** `supabase/scripts/FIX_POST_DELETE_RLS.sql`
- **Migration:** `supabase/migrations/20240306_fix_post_delete_rls.sql`
- **Documentation:** `docs/POST_DELETE_FIX.md`

## Note on Thread Deletion

Threads can only be deleted by staff (intentional). If you want users to delete their own threads, uncomment the thread policy section in the fix script.
