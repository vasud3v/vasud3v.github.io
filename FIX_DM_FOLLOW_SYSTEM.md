# Fix DM and Follow System

## Problem
The Direct Messages (DM) and Follow system are not working because the required database tables and policies haven't been created yet.

## Root Cause
The database migration script `supabase/scripts/APPLY_FOLLOW_MESSAGING_FIX.sql` exists but hasn't been applied to the Supabase database.

## Required Tables
The following tables need to be created:

1. **user_follows** - Stores follow relationships
2. **conversations** - Stores conversation metadata
3. **conversation_participants** - Links users to conversations
4. **messages** - Stores actual messages

## Solution

### Option 1: Apply via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/scripts/APPLY_FOLLOW_MESSAGING_FIX.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute

### Option 2: Apply via Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push
```

### Option 3: Apply via Node Script

Run the provided script:

```bash
node scripts/apply-follow-messaging-fix.js
```

## What the Script Does

### 1. Creates Tables

#### user_follows
```sql
CREATE TABLE user_follows (
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);
```

#### conversations
```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### conversation_participants
```sql
CREATE TABLE conversation_participants (
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  unread_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (conversation_id, user_id)
);
```

#### messages
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
```

### 2. Adds Columns to forum_users
- `follower_count` - Number of followers
- `following_count` - Number of users following
- `is_private` - Whether account is private (requires follow approval)

### 3. Creates Indexes
For optimal query performance on:
- Follow relationships
- Messages by conversation
- Messages by sender
- Conversation participants

### 4. Sets Up Row Level Security (RLS)

#### Follow Policies
- Users can view their own follows
- Users can create follow requests
- Users can update received follow requests
- Users can delete their own follows

#### Conversation Policies
- Users can view their conversations
- Users can create conversations
- Users can join conversations

#### Message Policies
- Users can view messages in their conversations
- Users can send messages to their conversations
- Users can update/delete their own messages

### 5. Creates Functions

#### update_follower_counts()
Automatically updates follower/following counts when:
- Follow request accepted
- Follow relationship deleted
- Follow status changed

#### update_unread_count()
Automatically updates unread message counts when:
- New message sent
- Conversation updated

#### can_message_user()
Checks if current user can message target user:
- Returns true if target is public
- Returns true if current user follows target (for private accounts)

### 6. Creates Triggers
- `trigger_update_follower_counts` - Fires on follow changes
- `trigger_update_unread_count` - Fires on new messages

### 7. Enables Realtime
Adds tables to realtime publication for live updates:
- user_follows
- messages
- conversation_participants

## Verification

After applying the script, verify it worked:

### 1. Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_follows', 'conversations', 'conversation_participants', 'messages');
```

Should return 4 rows.

### 2. Check RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_follows', 'conversations', 'conversation_participants', 'messages');
```

All should have `rowsecurity = true`.

### 3. Check Policies Exist

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_follows', 'conversations', 'conversation_participants', 'messages');
```

Should return multiple policies.

### 4. Check Functions Exist

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_follower_counts', 'update_unread_count', 'can_message_user');
```

Should return 3 functions.

## Testing the Features

### Test Follow System

1. Log in as User A
2. Navigate to User B's profile
3. Click "Follow" button
4. If User B is private, status should show "Pending"
5. If User B is public, status should show "Following"

### Test Follow Requests (Private Accounts)

1. Log in as User B (private account)
2. Navigate to `/follow-requests`
3. Should see pending request from User A
4. Click "Accept" or "Reject"
5. User A should see status update

### Test Direct Messages

1. Log in as User A
2. Navigate to User B's profile (must be following)
3. Click "Message" button
4. Should open messages page
5. Type and send a message
6. User B should receive notification
7. User B can reply

### Test Message Notifications

1. User A sends message to User B
2. User B should see unread count badge
3. User B opens conversation
4. Unread count should reset to 0

## Common Issues

### Issue 1: "relation does not exist"
**Cause:** Tables not created
**Fix:** Run the SQL script again

### Issue 2: "permission denied for table"
**Cause:** RLS policies not set up correctly
**Fix:** Check if RLS is enabled and policies exist

### Issue 3: "new row violates row-level security policy"
**Cause:** User not authenticated or policy too restrictive
**Fix:** Ensure user is logged in with valid session

### Issue 4: Follow button doesn't work
**Cause:** Missing user_follows table or RLS policy
**Fix:** Verify table exists and policies are correct

### Issue 5: Can't send messages
**Cause:** Not following user (for private accounts)
**Fix:** Follow user first, then try messaging

### Issue 6: Messages not appearing in real-time
**Cause:** Realtime not enabled for tables
**Fix:** Check realtime publication includes the tables

## Frontend Components

The following components use these features:

### Follow System
- `src/components/forum/FollowButton.tsx` - Follow/unfollow button
- `src/components/forum/FollowRequestsPage.tsx` - View/manage follow requests
- `src/components/forum/FollowingFeedPage.tsx` - Feed of followed users' activity
- `src/hooks/useFollowSystem.ts` - Follow logic hook

### Messaging System
- `src/components/forum/MessagesPage.tsx` - Main messages interface
- `src/hooks/useMessaging.ts` - Messaging logic hooks

## Database Schema Diagram

```
┌─────────────────┐
│  forum_users    │
│─────────────────│
│ id              │◄─────┐
│ username        │      │
│ follower_count  │      │
│ following_count │      │
│ is_private      │      │
└─────────────────┘      │
                         │
┌─────────────────┐      │
│  user_follows   │      │
│─────────────────│      │
│ follower_id     │──────┘
│ following_id    │──────┐
│ status          │      │
│ created_at      │      │
└─────────────────┘      │
                         │
                         ▼
                ┌─────────────────┐
                │  forum_users    │
                └─────────────────┘

┌─────────────────────┐
│  conversations      │
│─────────────────────│
│ id                  │◄─────┐
│ created_at          │      │
│ updated_at          │      │
└─────────────────────┘      │
                             │
┌─────────────────────────┐  │
│ conversation_participants│  │
│─────────────────────────│  │
│ conversation_id         │──┘
│ user_id                 │──┐
│ last_read_at            │  │
│ unread_count            │  │
└─────────────────────────┘  │
                             │
┌─────────────────┐          │
│  messages       │          │
│─────────────────│          │
│ id              │          │
│ conversation_id │──────────┘
│ sender_id       │──────┐
│ content         │      │
│ is_read         │      │
│ created_at      │      │
└─────────────────┘      │
                         ▼
                ┌─────────────────┐
                │  forum_users    │
                └─────────────────┘
```

## Security Considerations

### Row Level Security (RLS)
All tables have RLS enabled to ensure:
- Users can only see their own data
- Users can only modify their own records
- Follow requests require proper authorization
- Messages are private to conversation participants

### Function Security
All functions use `SECURITY DEFINER` with `search_path = public` to:
- Prevent SQL injection
- Ensure consistent behavior
- Protect against privilege escalation

### Data Validation
- Follow relationships prevent self-following
- Message content is required
- Status values are constrained
- Foreign keys ensure referential integrity

## Performance Optimization

### Indexes Created
```sql
-- Follow system
idx_user_follows_follower
idx_user_follows_following
idx_user_follows_status

-- Messaging system
idx_messages_conversation
idx_messages_sender
idx_messages_created
idx_conversation_participants_user
```

### Triggers for Denormalization
- Follower counts cached in forum_users
- Unread counts cached in conversation_participants
- Conversation updated_at maintained automatically

## Maintenance

### Recalculate Follower Counts
If counts get out of sync:

```sql
UPDATE forum_users u
SET 
  follower_count = (
    SELECT COUNT(*) FROM user_follows 
    WHERE following_id = u.id AND status = 'accepted'
  ),
  following_count = (
    SELECT COUNT(*) FROM user_follows 
    WHERE follower_id = u.id AND status = 'accepted'
  );
```

### Clean Up Old Messages
Delete messages older than 1 year:

```sql
UPDATE messages 
SET deleted_at = NOW() 
WHERE created_at < NOW() - INTERVAL '1 year' 
AND deleted_at IS NULL;
```

### Archive Old Conversations
Mark inactive conversations:

```sql
-- Add archived column if needed
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Archive conversations with no messages in 6 months
UPDATE conversations 
SET archived = true 
WHERE updated_at < NOW() - INTERVAL '6 months';
```

## Next Steps

After applying the fix:

1. ✅ Verify tables created
2. ✅ Test follow functionality
3. ✅ Test messaging functionality
4. ✅ Check realtime updates
5. ✅ Monitor for errors
6. ✅ Gather user feedback

## Support

If issues persist:
1. Check Supabase logs for errors
2. Verify RLS policies are correct
3. Ensure user is authenticated
4. Check browser console for errors
5. Review network requests in DevTools

## Conclusion

Once the SQL script is applied, both the follow system and direct messaging will work correctly with:
- ✅ Proper security (RLS)
- ✅ Real-time updates
- ✅ Optimized performance
- ✅ Data integrity
- ✅ User privacy
