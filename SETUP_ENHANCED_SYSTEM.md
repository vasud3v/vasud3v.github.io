# Enhanced DM & Follow System - Setup Guide

## Quick Setup (5 minutes)

### Step 1: Apply Database Migration

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Open the file `supabase/scripts/ENHANCED_FOLLOW_MESSAGING_SYSTEM.sql`
4. Copy all content
5. Paste into SQL Editor
6. Click "Run"
7. Wait for success message

### Step 2: Verify Installation

The enhanced hooks are already integrated into your components:

✅ `FollowButton.tsx` - Now uses `useFollowSystemEnhanced`
✅ `MessagesPage.tsx` - Now uses `useMessagingEnhanced`
✅ `MessageSettingsModal.tsx` - New component for privacy settings

### Step 3: Test Features

#### Follow System
- Block/unblock users from FollowButton dropdown
- View mutual followers count
- Block status prevents all interactions

#### Messaging System
- Click settings icon in Messages page
- Set privacy: Everyone / Following / None
- Pin/mute/delete conversations from dropdown
- Reply to messages (click reply icon)
- Edit messages (24h window, click edit)
- Delete messages (soft delete)
- Load more messages (pagination)

## New Features Available

### FollowButton Component
```tsx
<FollowButton
  targetUserId={userId}
  currentUserId={currentUserId}
  showMessageButton={true}
  showBlockButton={true}        // NEW: Shows block option
  showMutualFollowers={true}    // NEW: Shows mutual count
/>
```

### MessagesPage Component
- Settings button (top right)
- Pin conversations (stays at top)
- Mute conversations (no notifications)
- Reply to messages (thread view)
- Edit messages (24h window)
- Delete messages (soft delete)
- Load more (pagination)
- Character counter (5000 max)

## What Changed

### Database
- Added `user_blocks` table
- Added `allow_messages_from` column to `forum_users`
- Added conversation management columns (`is_muted`, `is_pinned`, `left_at`)
- Added message features (`reply_to_id`, `edited_at`, `deleted_at`)
- Added 12 database functions
- Added 5 triggers
- Added 20+ indexes

### Frontend
- `useFollowSystemEnhanced` replaces `useFollowSystem`
- `useMessagingEnhanced` replaces `useMessaging`
- `useConversationMessagesEnhanced` replaces `useConversationMessages`
- New `MessageSettingsModal` component
- Enhanced UI with dropdown menus
- Block/unblock functionality
- Message editing/deleting
- Reply threading
- Conversation management

## Troubleshooting

### "relation already exists"
Tables already created - safe to ignore or drop and recreate.

### "permission denied"
Check RLS policies, ensure user is authenticated.

### "cannot follow user"
Check if blocked, verify not self-follow.

### "cannot message user"
Check privacy settings, verify follow status, check block status.

### Follower counts incorrect
Run this SQL:
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

## Performance Notes

- All queries optimized with indexes
- Pagination prevents large data loads
- Real-time updates via Supabase subscriptions
- Denormalized counts for fast access

## Security

- All tables have RLS policies
- Block status checked at database level
- Privacy settings enforced by functions
- 24h edit window enforced by trigger
- Message length validated (5000 chars)

## Next Steps

1. Run the SQL migration
2. Test all features
3. Customize UI as needed
4. Monitor performance
5. Gather user feedback

## Support

See `ENHANCED_SYSTEM_DOCUMENTATION.md` for complete technical documentation.
