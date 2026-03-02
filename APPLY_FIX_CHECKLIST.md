# Apply DM & Follow System Fix - Checklist

## Pre-Flight Check

- [ ] Have access to Supabase Dashboard
- [ ] Know your project URL
- [ ] Have service role key (if using script)
- [ ] Backup database (optional but recommended)

## Apply the Fix

### Option A: Supabase Dashboard (Recommended)

- [ ] Open https://app.supabase.com
- [ ] Select your project
- [ ] Click "SQL Editor" in sidebar
- [ ] Click "New Query"
- [ ] Open `supabase/scripts/APPLY_FOLLOW_MESSAGING_FIX.sql`
- [ ] Copy entire file contents (Ctrl+A, Ctrl+C)
- [ ] Paste into SQL Editor
- [ ] Click "Run" button (or Ctrl+Enter)
- [ ] Wait for "Success" message
- [ ] Verify no errors in output

### Option B: Node Script

- [ ] Ensure `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Run: `node scripts/apply-follow-messaging-fix.js`
- [ ] Check output for success messages
- [ ] Verify tables created

### Option C: Supabase CLI

- [ ] Install Supabase CLI
- [ ] Run: `supabase login`
- [ ] Run: `supabase link --project-ref YOUR_REF`
- [ ] Run: `supabase db push`
- [ ] Verify migration applied

## Verify Installation

### Check Tables Created

- [ ] Open Supabase Dashboard → Table Editor
- [ ] Verify `user_follows` table exists
- [ ] Verify `conversations` table exists
- [ ] Verify `conversation_participants` table exists
- [ ] Verify `messages` table exists

### Check Columns Added

- [ ] Open `forum_users` table
- [ ] Verify `follower_count` column exists
- [ ] Verify `following_count` column exists
- [ ] Verify `is_private` column exists

### Check RLS Policies

- [ ] Click on `user_follows` table
- [ ] Click "Policies" tab
- [ ] Verify 4 policies exist
- [ ] Repeat for other tables

## Test Follow System

### Basic Follow

- [ ] Log in as User A
- [ ] Navigate to User B's profile
- [ ] Verify "Follow" button appears
- [ ] Click "Follow" button
- [ ] Verify status changes to "Following" or "Pending"
- [ ] Check User B's follower count increased

### Unfollow

- [ ] Click "Unfollow" button
- [ ] Verify status changes back
- [ ] Check follower count decreased

### Private Account

- [ ] Make User B's account private (if feature available)
- [ ] Follow User B as User A
- [ ] Verify status shows "Pending"
- [ ] Log in as User B
- [ ] Go to `/follow-requests`
- [ ] Verify request appears
- [ ] Click "Accept"
- [ ] Verify User A now shows "Following"

## Test Messaging System

### Start Conversation

- [ ] Log in as User A
- [ ] Follow User B (if not already)
- [ ] Navigate to User B's profile
- [ ] Verify "Message" button appears
- [ ] Click "Message" button
- [ ] Verify redirected to `/messages`
- [ ] Verify conversation created

### Send Message

- [ ] Type a test message
- [ ] Click "Send" button
- [ ] Verify message appears in chat
- [ ] Verify timestamp shows

### Receive Message

- [ ] Log in as User B
- [ ] Go to `/messages`
- [ ] Verify conversation appears
- [ ] Verify unread count shows
- [ ] Click conversation
- [ ] Verify message from User A appears
- [ ] Verify unread count resets

### Real-time Updates

- [ ] Keep User B's messages page open
- [ ] In another browser/incognito, log in as User A
- [ ] Send message to User B
- [ ] Verify User B sees message appear instantly
- [ ] Verify no page refresh needed

## Test Follow Requests Page

- [ ] Log in as user with private account
- [ ] Have another user send follow request
- [ ] Navigate to `/follow-requests`
- [ ] Verify page loads without errors
- [ ] Verify pending request appears
- [ ] Verify user info displays correctly
- [ ] Click "Accept" on a request
- [ ] Verify request disappears
- [ ] Verify follower count updated

## Test Following Feed

- [ ] Follow several users
- [ ] Navigate to `/following-feed`
- [ ] Verify page loads
- [ ] Verify shows activity from followed users
- [ ] Verify updates in real-time

## Check for Errors

### Browser Console

- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Perform follow action
- [ ] Verify no errors
- [ ] Send a message
- [ ] Verify no errors

### Network Tab

- [ ] Open DevTools → Network tab
- [ ] Perform follow action
- [ ] Check request status (should be 200/201)
- [ ] Send message
- [ ] Check request status
- [ ] Verify no 400/500 errors

### Supabase Logs

- [ ] Open Supabase Dashboard
- [ ] Go to Logs section
- [ ] Filter by "Errors"
- [ ] Verify no RLS policy errors
- [ ] Verify no permission errors

## Performance Check

- [ ] Follow/unfollow should be instant (< 1 second)
- [ ] Messages should send quickly (< 1 second)
- [ ] Real-time updates should be fast (< 1 second)
- [ ] Page loads should be smooth
- [ ] No lag or freezing

## Edge Cases

### Self-Follow Prevention

- [ ] Try to follow yourself
- [ ] Verify button doesn't appear or is disabled

### Duplicate Follow Prevention

- [ ] Follow a user
- [ ] Try to follow again
- [ ] Verify handled gracefully

### Message Without Follow

- [ ] Try to message user you don't follow (private account)
- [ ] Verify error message or disabled button

### Deleted User

- [ ] Follow a user
- [ ] Delete that user (admin action)
- [ ] Verify follow relationship cleaned up

## Rollback Plan (If Needed)

If something goes wrong:

### Rollback Tables

```sql
-- Only if you need to start over
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_follows CASCADE;

-- Remove added columns
ALTER TABLE forum_users 
  DROP COLUMN IF EXISTS follower_count,
  DROP COLUMN IF EXISTS following_count,
  DROP COLUMN IF EXISTS is_private;
```

### Reapply

- [ ] Fix any issues
- [ ] Run migration script again
- [ ] Verify tables created
- [ ] Test again

## Post-Installation

### Documentation

- [ ] Update team on new features
- [ ] Document any custom changes
- [ ] Note any issues encountered

### Monitoring

- [ ] Set up error monitoring
- [ ] Track usage metrics
- [ ] Monitor database performance
- [ ] Watch for user feedback

### Optimization

- [ ] Review query performance
- [ ] Check index usage
- [ ] Monitor real-time connections
- [ ] Optimize if needed

## Success Criteria

All checks passed when:

- ✅ All 4 tables created
- ✅ All columns added to forum_users
- ✅ RLS policies active
- ✅ Follow button works
- ✅ Unfollow works
- ✅ Follow requests work
- ✅ Messages can be sent
- ✅ Messages received in real-time
- ✅ Unread counts update
- ✅ No console errors
- ✅ No network errors
- ✅ No Supabase log errors
- ✅ Performance is good
- ✅ Edge cases handled

## Completion

- [ ] All tests passed
- [ ] No errors found
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Team notified
- [ ] Monitoring in place

## Notes

Record any issues or observations:

```
Date: ___________
Applied by: ___________
Method used: ___________
Issues encountered: ___________
Resolution: ___________
```

---

**Status:** [ ] Not Started | [ ] In Progress | [ ] Complete | [ ] Failed

**Time Taken:** _____ minutes

**Overall Result:** [ ] Success ✅ | [ ] Partial ⚠️ | [ ] Failed ❌
