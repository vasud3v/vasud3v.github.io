# Enhanced DM & Follow System - Testing Checklist

## Pre-Testing Setup

- [ ] SQL migration applied successfully
- [ ] No database errors in Supabase logs
- [ ] Frontend compiled without errors
- [ ] Two test accounts created

## Follow System Tests

### Basic Follow Operations
- [ ] Follow public user → Status changes to "Following"
- [ ] Follow private user → Status shows "Pending"
- [ ] Unfollow user → Status returns to "Follow"
- [ ] Accept follow request → Status changes to "Following"
- [ ] Reject follow request → Request removed
- [ ] Follower count updates correctly
- [ ] Following count updates correctly

### Block Operations
- [ ] Click "..." menu on FollowButton
- [ ] Click "Block User" → User blocked
- [ ] Blocked status shows "Unblock" button
- [ ] Cannot follow blocked user
- [ ] Cannot message blocked user
- [ ] Unblock user → Can interact again
- [ ] Blocked count updates in database

### Mutual Followers
- [ ] Mutual followers count displays
- [ ] Count updates when follow status changes
- [ ] Shows correct mutual connections

### Edge Cases
- [ ] Cannot follow yourself (button hidden)
- [ ] Cannot follow user who blocked you
- [ ] Duplicate follow prevented
- [ ] Real-time updates work (open two browsers)
- [ ] Block removes existing follows

## Messaging System Tests

### Privacy Settings
- [ ] Click settings icon in Messages page
- [ ] Modal opens with three options
- [ ] Select "Everyone" → Anyone can message
- [ ] Select "Following" → Only followers can message
- [ ] Select "None" → Nobody can message
- [ ] Settings save correctly
- [ ] Privacy enforced when starting conversation

### Basic Messaging
- [ ] Start conversation with user
- [ ] Send message → Appears in chat
- [ ] Message shows in conversation list
- [ ] Unread count increments
- [ ] Mark as read → Count resets to 0
- [ ] Real-time updates (messages appear instantly)

### Conversation Management
- [ ] Click "..." menu in conversation header
- [ ] Pin conversation → Moves to top of list
- [ ] Unpin conversation → Returns to normal order
- [ ] Mute conversation → Shows mute icon
- [ ] Unmute conversation → Icon removed
- [ ] Delete conversation → Removed from list

### Message Features
- [ ] Click reply icon on message
- [ ] Reply indicator shows
- [ ] Send reply → Shows "Replying to" context
- [ ] Click edit on own message (within 24h)
- [ ] Edit message → Shows "(edited)" label
- [ ] Delete message → Message removed
- [ ] Character counter shows (0/5000)
- [ ] Cannot send empty message
- [ ] Cannot send message > 5000 chars

### Message Editing
- [ ] Edit message within 24h → Works
- [ ] Try edit after 24h → Edit option hidden
- [ ] Edit shows inline input
- [ ] Click check → Saves edit
- [ ] Click X → Cancels edit
- [ ] Edited timestamp updates

### Pagination
- [ ] Send 60+ messages
- [ ] "Load More" button appears
- [ ] Click "Load More" → Loads older messages
- [ ] Scroll position maintained
- [ ] No duplicate messages

### Edge Cases
- [ ] Send message to blocked user → Prevented
- [ ] Receive message from blocked user → Prevented
- [ ] Empty message → Validation error
- [ ] Message too long → Validation error
- [ ] Edit after 24h → Option hidden
- [ ] Delete message → Soft delete (deleted_at set)
- [ ] Leave conversation → Soft delete (left_at set)
- [ ] All participants leave → Conversation archived

## UI/UX Tests

### FollowButton Component
- [ ] Button states correct (Follow/Following/Pending/Blocked)
- [ ] Loading states show during operations
- [ ] Icons display correctly
- [ ] Dropdown menu works
- [ ] Mutual followers count visible
- [ ] Message button shows when following

### MessagesPage Component
- [ ] Conversation list loads
- [ ] Online status indicators work
- [ ] Unread badges show
- [ ] Pin/mute icons display
- [ ] Message bubbles styled correctly
- [ ] Reply context shows
- [ ] Edit UI works
- [ ] Settings modal opens
- [ ] Mobile responsive (test on small screen)

### MessageSettingsModal Component
- [ ] Modal opens/closes
- [ ] Radio buttons work
- [ ] Icons display
- [ ] Descriptions clear
- [ ] Save button works
- [ ] Cancel button works

## Performance Tests

### Load Times
- [ ] Conversation list loads < 300ms
- [ ] Messages load < 200ms
- [ ] Follow status check < 50ms
- [ ] Block operation < 150ms
- [ ] Message send < 150ms

### Real-time Updates
- [ ] New message appears < 50ms
- [ ] Follow status updates instantly
- [ ] Unread count updates instantly
- [ ] Conversation list reorders

### Database Performance
- [ ] Check Supabase logs for slow queries
- [ ] Verify indexes being used
- [ ] No N+1 query problems
- [ ] RLS policies efficient

## Security Tests

### Authentication
- [ ] Guest cannot follow users
- [ ] Guest cannot send messages
- [ ] Guest cannot block users
- [ ] Proper error messages shown

### Authorization
- [ ] Cannot edit other's messages
- [ ] Cannot delete other's messages
- [ ] Cannot see blocked user's content
- [ ] Privacy settings enforced
- [ ] RLS policies prevent unauthorized access

### Data Validation
- [ ] SQL injection prevented
- [ ] XSS attacks prevented
- [ ] Message length validated
- [ ] Empty content rejected
- [ ] Invalid user IDs handled

## Error Handling Tests

### Network Errors
- [ ] Offline → Shows error message
- [ ] Timeout → Shows error message
- [ ] Retry works after error

### Database Errors
- [ ] Duplicate follow → Handled gracefully
- [ ] Missing user → Error shown
- [ ] Invalid conversation → Error shown

### User Errors
- [ ] Empty message → Validation message
- [ ] Message too long → Validation message
- [ ] Cannot message user → Clear error
- [ ] Cannot follow user → Clear error

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Accessibility Tests

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] ARIA labels present

## Regression Tests

### Old Features Still Work
- [ ] Basic follow/unfollow
- [ ] Basic messaging
- [ ] Conversation list
- [ ] Message sending
- [ ] User profiles
- [ ] Notifications

## Final Checks

- [ ] No console errors
- [ ] No console warnings
- [ ] No memory leaks
- [ ] No infinite loops
- [ ] Clean code (no commented code)
- [ ] Documentation updated
- [ ] All tests passed

## Test Results

Date: ___________
Tester: ___________
Environment: ___________

### Issues Found
1. 
2. 
3. 

### Notes
