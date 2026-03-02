# Enhanced System Migration Checklist

## Pre-Migration

### Backup
- [ ] Backup database: `pg_dump your_database > backup.sql`
- [ ] Backup code: `git commit -am "Pre-migration backup"`
- [ ] Note current user count: _______
- [ ] Note current message count: _______
- [ ] Note current follow count: _______

### Verify Prerequisites
- [ ] Supabase project is accessible
- [ ] Database has sufficient storage
- [ ] You have admin access to Supabase
- [ ] Node.js and npm are installed
- [ ] Frontend builds successfully: `npm run build`

## Migration Steps

### Step 1: Database Migration (5 minutes)

- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Open file: `supabase/scripts/ENHANCED_FOLLOW_MESSAGING_SYSTEM.sql`
- [ ] Copy entire content
- [ ] Paste into SQL Editor
- [ ] Click "Run" button
- [ ] Wait for completion message
- [ ] Check for errors in output
- [ ] Verify success message appears

### Step 2: Verify Database Changes (2 minutes)

Check tables exist:
- [ ] `user_blocks` table created
- [ ] `user_follows` table exists
- [ ] `conversations` table exists
- [ ] `conversation_participants` table exists
- [ ] `messages` table exists

Check new columns:
- [ ] `forum_users.follower_count` exists
- [ ] `forum_users.following_count` exists
- [ ] `forum_users.blocked_count` exists
- [ ] `forum_users.is_private` exists
- [ ] `forum_users.allow_messages_from` exists
- [ ] `conversation_participants.is_muted` exists
- [ ] `conversation_participants.is_pinned` exists
- [ ] `conversation_participants.left_at` exists
- [ ] `messages.edited_at` exists
- [ ] `messages.deleted_at` exists
- [ ] `messages.reply_to_id` exists

Check functions exist:
- [ ] `can_message_user()`
- [ ] `get_mutual_followers()`
- [ ] `block_user()`
- [ ] `unblock_user()`
- [ ] `is_user_blocked()`
- [ ] `get_conversation_with_user()`
- [ ] `mark_conversation_read()`
- [ ] `delete_conversation()`

Check triggers exist:
- [ ] `prevent_self_follow`
- [ ] `update_follower_counts`
- [ ] `update_conversation_timestamp`
- [ ] `update_unread_count`
- [ ] `update_message_edited`

### Step 3: Frontend Verification (1 minute)

- [ ] No TypeScript errors: Check IDE
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in build output
- [ ] All imports resolve correctly

### Step 4: Test Basic Features (10 minutes)

#### Follow System
- [ ] Can follow a user
- [ ] Can unfollow a user
- [ ] Follow status updates in real-time
- [ ] Follower count updates correctly
- [ ] Following count updates correctly

#### Block System
- [ ] Can block a user
- [ ] Can unblock a user
- [ ] Blocked status shows correctly
- [ ] Cannot follow blocked user
- [ ] Cannot message blocked user
- [ ] Block count updates correctly

#### Messaging System
- [ ] Can start a conversation
- [ ] Can send a message
- [ ] Message appears in chat
- [ ] Unread count updates
- [ ] Can mark as read
- [ ] Real-time updates work

#### Privacy Settings
- [ ] Settings modal opens
- [ ] Can change to "Everyone"
- [ ] Can change to "Following"
- [ ] Can change to "None"
- [ ] Settings save correctly
- [ ] Privacy is enforced

#### Conversation Management
- [ ] Can pin a conversation
- [ ] Pinned conversation stays at top
- [ ] Can mute a conversation
- [ ] Mute icon shows correctly
- [ ] Can delete a conversation
- [ ] Deleted conversation removed from list

#### Message Features
- [ ] Can reply to a message
- [ ] Reply context shows
- [ ] Can edit own message (within 24h)
- [ ] Edit shows "(edited)" label
- [ ] Can delete own message
- [ ] Deleted message removed
- [ ] Character counter works (5000 max)
- [ ] Cannot send empty message
- [ ] Cannot send message > 5000 chars

### Step 5: Test Edge Cases (5 minutes)

- [ ] Cannot follow yourself
- [ ] Cannot block yourself
- [ ] Cannot message blocked user
- [ ] Cannot message user who blocked you
- [ ] Privacy settings enforced
- [ ] Edit after 24h prevented
- [ ] Duplicate follow prevented
- [ ] Real-time updates work across browsers

### Step 6: Performance Check (2 minutes)

- [ ] Conversation list loads < 300ms
- [ ] Messages load < 200ms
- [ ] Follow/unfollow < 100ms
- [ ] Block/unblock < 150ms
- [ ] Send message < 150ms
- [ ] No slow query warnings in Supabase logs

### Step 7: Security Verification (3 minutes)

- [ ] Guest cannot follow users
- [ ] Guest cannot send messages
- [ ] Guest cannot block users
- [ ] Cannot edit other's messages
- [ ] Cannot delete other's messages
- [ ] RLS policies working correctly

## Post-Migration

### Data Integrity Check

Run these queries in Supabase SQL Editor:

```sql
-- Check for orphaned follows
SELECT COUNT(*) FROM user_follows 
WHERE follower_id NOT IN (SELECT id FROM forum_users)
   OR following_id NOT IN (SELECT id FROM forum_users);
-- Should be 0

-- Check for self-follows
SELECT COUNT(*) FROM user_follows 
WHERE follower_id = following_id;
-- Should be 0

-- Check for self-blocks
SELECT COUNT(*) FROM user_blocks 
WHERE blocker_id = blocked_id;
-- Should be 0

-- Verify follower counts
SELECT u.id, u.username, u.follower_count,
       (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id AND status = 'accepted') as actual_count
FROM forum_users u
WHERE u.follower_count != (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id AND status = 'accepted')
LIMIT 10;
-- Should be empty

-- Check message integrity
SELECT COUNT(*) FROM messages 
WHERE conversation_id NOT IN (SELECT id FROM conversations);
-- Should be 0
```

Results:
- [ ] No orphaned follows
- [ ] No self-follows
- [ ] No self-blocks
- [ ] Follower counts accurate
- [ ] No orphaned messages

### Update Documentation

- [ ] Update README if needed
- [ ] Document any custom changes
- [ ] Update API documentation
- [ ] Update user guides

### Monitoring Setup

- [ ] Enable Supabase logging
- [ ] Set up error tracking
- [ ] Monitor query performance
- [ ] Track user engagement

### Cleanup (Optional)

- [ ] Remove old hook files:
  - `src/hooks/useFollowSystem.ts`
  - `src/hooks/useMessaging.ts`
- [ ] Remove old documentation files
- [ ] Clean up unused imports
- [ ] Remove commented code

## Rollback Plan (If Needed)

### If Migration Fails

1. Stop all operations
2. Restore database backup:
   ```bash
   psql your_database < backup.sql
   ```
3. Revert code changes:
   ```bash
   git reset --hard HEAD~1
   ```
4. Investigate error logs
5. Fix issues
6. Try migration again

### If Issues Found After Migration

1. Document the issue
2. Check if it's a data issue or code issue
3. For data issues:
   - Run corrective SQL queries
   - Verify with test queries
4. For code issues:
   - Fix the code
   - Redeploy
   - Test thoroughly

## Success Criteria

Migration is successful when:
- [ ] All database objects created
- [ ] All tests pass
- [ ] No errors in logs
- [ ] Performance is acceptable
- [ ] Security is verified
- [ ] Users can use all features
- [ ] Real-time updates work
- [ ] Data integrity maintained

## Sign-off

- Migration Date: _______________
- Performed By: _______________
- Database Backup Location: _______________
- Issues Encountered: _______________
- Resolution: _______________
- Status: ☐ Success ☐ Failed ☐ Partial

## Notes

_Add any additional notes, observations, or issues here:_

---

## Support

If you encounter issues:
1. Check `ENHANCED_SYSTEM_DOCUMENTATION.md`
2. Review Supabase logs
3. Check browser console
4. Verify RLS policies
5. Test in isolation
6. Create detailed bug report

## Next Steps After Migration

1. Monitor for 24 hours
2. Gather user feedback
3. Optimize based on usage patterns
4. Plan additional features
5. Update documentation as needed

---

**Version:** 2.0
**Last Updated:** 2024
