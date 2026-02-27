# Quick Fix: Views Not Incrementing

## The Problem
Thread view counts aren't increasing when users visit threads.

## The Solution

### 1. Run This SQL (2 minutes)

Open **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Drop and recreate the function
DROP FUNCTION IF EXISTS increment_thread_views(TEXT);

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_thread_views(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_thread_views(TEXT) TO anon;
```

### 2. Test It

```bash
node scripts/test-view-increment.js
```

### 3. Verify in Browser

1. Open any thread in your forum
2. Wait 1 second
3. Refresh the page
4. View count should increase by 1

## What Was Wrong?

1. **Syntax Error**: Function used single `$` instead of `$$` delimiter
2. **Missing Function**: Migration may not have been applied
3. **RLS Bypass**: Function needs `SECURITY DEFINER` to bypass RLS policies

## Still Not Working?

Check browser console for errors:
- Open DevTools (F12)
- Go to Console tab
- Look for `[ThreadDetailPage] Error incrementing view count`

If you see errors, run the diagnostic:
```bash
# In Supabase SQL Editor
-- Run: supabase/scripts/CHECK_VIEW_INCREMENT_SETUP.sql
```

## Files Updated

- ✅ `supabase/migrations/20240303_add_increment_views_function.sql` - Fixed syntax
- ✅ `supabase/scripts/FIX_VIEW_INCREMENT_COMPLETE.sql` - Complete fix script
- ✅ `scripts/test-view-increment.js` - Test script
- ✅ `docs/VIEW_INCREMENT_FIX.md` - Detailed guide
