# View Increment Fix Guide

## Problem
Thread views are not incrementing when users visit thread pages.

## Root Causes
1. The `increment_thread_views` function may not exist in your database
2. The function delimiter syntax was incorrect (single `$` instead of `$$`)
3. RLS policies on the `threads` table may be blocking updates

## Quick Fix (Recommended)

### Run This SQL Script

1. Open your **Supabase Dashboard** → **SQL Editor**
2. Copy and paste: `supabase/scripts/FIX_VIEW_INCREMENT_COMPLETE.sql`
3. Click **Run**
4. You should see: `✅ Function increment_thread_views created successfully`

That's it! Views should now increment properly.

### Test the Fix

Run this command to verify:

```bash
node scripts/test-view-increment.js
```

Expected output:
```
✅ Found thread: "Thread Title"
✅ Function called successfully
✅ View count incremented successfully!
```

## Technical Details

### The Function

```sql
CREATE OR REPLACE FUNCTION increment_thread_views(thread_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE threads
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = thread_id;
END;
$$;
```

### How It's Called

In `src/components/forum/ThreadDetailPage.tsx`:

```typescript
useEffect(() => {
  if (!threadId) return;
  
  const incrementViewCount = async () => {
    try {
      const { error } = await supabase.rpc('increment_thread_views', { 
        thread_id: threadId 
      });
      
      if (error) {
        console.error('[ThreadDetailPage] Error incrementing view count:', error);
      }
    } catch (err) {
      console.error('[ThreadDetailPage] Error incrementing view count:', err);
    }
  };
  
  // Increment after a short delay to avoid counting quick bounces
  const timer = setTimeout(incrementViewCount, 1000);
  return () => clearTimeout(timer);
}, [threadId]);
```

## Common Issues

### Issue 1: Function Does Not Exist (Error 42883)

**Symptom:** Console shows error code `42883` or "function does not exist"

**Solution:** Run the SQL script in Step 1 above

### Issue 2: Permission Denied

**Symptom:** Console shows "permission denied" error

**Solution:** The SQL script grants permissions to both `authenticated` and `anon` roles. Make sure to run the complete script.

### Issue 3: Views Still Not Incrementing

**Possible causes:**
1. The migration wasn't applied - run the SQL script manually
2. RLS policies are blocking the update - check your RLS policies on the `threads` table
3. The function is being called but silently failing - check Supabase logs

**Debug steps:**
1. Open browser DevTools Console
2. Navigate to a thread
3. Look for error messages starting with `[ThreadDetailPage]`
4. Check the Network tab for the RPC call to `increment_thread_views`

## Migration File Fixed

The migration file `supabase/migrations/20240303_add_increment_views_function.sql` has been updated with:
- Correct `$$` delimiter (was using single `$`)
- Added `COALESCE` to handle null view counts
- Proper error handling

## Next Steps

If views are still not incrementing after following this guide:

1. Check Supabase logs in your dashboard
2. Verify RLS policies on the `threads` table
3. Test the function directly in SQL Editor:
   ```sql
   SELECT increment_thread_views('your-thread-id-here');
   SELECT view_count FROM threads WHERE id = 'your-thread-id-here';
   ```
