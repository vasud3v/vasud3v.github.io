# Avatar/Banner Update Flow - Visual Guide

## Before Fix ❌

```
User uploads avatar
       ↓
updateUserProfile()
       ↓
Supabase: forum_users.custom_avatar = "new-avatar.jpg"
       ↓
Real-time subscription fires
       ↓
Updates: ✅ forumUser state
         ✅ Thread authors in categoriesState
         ❌ Post authors in postsMap (MISSING!)
       ↓
Result: Avatar shows in threads but NOT in posts
```

## After Fix ✅

```
User uploads avatar
       ↓
updateUserProfile()
       ↓
Supabase: forum_users.custom_avatar = "new-avatar.jpg"
       ↓
Real-time subscription fires
       ↓
Updates: ✅ forumUser state
         ✅ Thread authors in categoriesState
         ✅ Post authors in postsMap (FIXED!)
       ↓
Result: Avatar shows EVERYWHERE instantly
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Profile Page                        │
│  ┌──────────────┐                                           │
│  │ Upload Avatar│                                           │
│  └──────┬───────┘                                           │
└─────────┼─────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────┐
│                    ForumContext                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ updateUserProfile(userId, { avatar: "new.jpg" })     │  │
│  └──────────────────┬───────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ UPDATE forum_users                                    │  │
│  │ SET custom_avatar = 'new.jpg'                        │  │
│  │ WHERE id = 'user-123'                                │  │
│  └──────────────────┬───────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              Real-time Subscription (WebSocket)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Event: UPDATE on forum_users                         │  │
│  │ Payload: { id: 'user-123', custom_avatar: 'new.jpg' }│  │
│  └──────────────────┬───────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
          ↓           ↓           ↓
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │forumUser│ │categories│ │postsMap │
    │  State  │ │  State   │ │  State  │
    └────┬────┘ └────┬─────┘ └────┬────┘
         │           │            │
         ↓           ↓            ↓
    ┌─────────────────────────────────┐
    │    All Components Re-render     │
    │  with Updated Avatar Everywhere │
    └─────────────────────────────────┘
```

## Component Update Chain

```
Real-time Event Received
       ↓
┌──────────────────────────────────────────┐
│ 1. Update forumUser State                │
│    (Current user's profile)              │
└──────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────┐
│ 2. Update categoriesState                │
│    - Loop through all categories         │
│    - Loop through all threads            │
│    - Update matching thread.author       │
└──────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────┐
│ 3. Update postsMap (NEW!)                │
│    - Loop through all thread IDs         │
│    - Loop through all posts              │
│    - Update matching post.author         │
└──────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────┐
│ 4. React Re-renders Components           │
│    - Profile page                        │
│    - Thread list                         │
│    - Thread detail page                  │
│    - Post cards                          │
│    - User mini cards                     │
│    - Online users list                   │
└──────────────────────────────────────────┘
```

## Avatar Resolution Priority

```
┌─────────────────────────────────────────┐
│     resolveUserAvatar(user)             │
└─────────────────┬───────────────────────┘
                  │
                  ↓
         ┌────────────────┐
         │ custom_avatar? │
         └────┬───────┬───┘
              │       │
          YES │       │ NO
              ↓       ↓
         ┌────────┐  ┌────────────┐
         │ Return │  │   avatar?  │
         │  it!   │  └──┬─────┬───┘
         └────────┘     │     │
                    YES │     │ NO
                        ↓     ↓
                   ┌────────┐ ┌──────────────┐
                   │ Return │ │  Generate    │
                   │  it!   │ │  from        │
                   └────────┘ │  username    │
                              └──────┬───────┘
                                     │
                                     ↓
                              ┌──────────────┐
                              │ Return       │
                              │ generated    │
                              └──────────────┘
```

## Real-time Update Timeline

```
Time: 0ms
┌─────────────────────────────────────────┐
│ User clicks "Upload Avatar"             │
└─────────────────────────────────────────┘

Time: 50ms
┌─────────────────────────────────────────┐
│ File read as Data URL                   │
└─────────────────────────────────────────┘

Time: 100ms
┌─────────────────────────────────────────┐
│ updateUserProfile() called              │
└─────────────────────────────────────────┘

Time: 150ms
┌─────────────────────────────────────────┐
│ Supabase UPDATE query sent              │
└─────────────────────────────────────────┘

Time: 200ms
┌─────────────────────────────────────────┐
│ Database updated                        │
└─────────────────────────────────────────┘

Time: 250ms
┌─────────────────────────────────────────┐
│ Real-time event broadcast               │
└─────────────────────────────────────────┘

Time: 300ms
┌─────────────────────────────────────────┐
│ WebSocket receives event                │
└─────────────────────────────────────────┘

Time: 350ms
┌─────────────────────────────────────────┐
│ State updates triggered                 │
│ - forumUser                             │
│ - categoriesState                       │
│ - postsMap                              │
└─────────────────────────────────────────┘

Time: 400ms
┌─────────────────────────────────────────┐
│ React re-renders all affected components│
└─────────────────────────────────────────┘

Time: 450ms
┌─────────────────────────────────────────┐
│ User sees new avatar everywhere! ✨     │
└─────────────────────────────────────────┘
```

## Multi-Tab Synchronization

```
Tab 1 (Profile Page)          Tab 2 (Thread Page)
       │                             │
       │ Upload avatar               │
       ↓                             │
  Update DB                          │
       │                             │
       ↓                             │
  WebSocket ──────────────────────→  WebSocket
  receives event                     receives event
       │                             │
       ↓                             ↓
  Update state                   Update state
       │                             │
       ↓                             ↓
  Re-render                      Re-render
       │                             │
       ↓                             ↓
  New avatar ✅                  New avatar ✅
```

## State Update Logic

```javascript
// Simplified version of what happens

// 1. Real-time event received
const updatedUser = payload.new;

// 2. Update forumUser
if (updatedUser.id === currentUserId) {
  setForumUser({
    ...forumUser,
    avatar: updatedUser.custom_avatar || updatedUser.avatar
  });
}

// 3. Update thread authors
setCategoriesState(categories.map(cat => ({
  ...cat,
  threads: cat.threads.map(thread => 
    thread.author.id === updatedUser.id
      ? { ...thread, author: { ...thread.author, avatar: updatedUser.custom_avatar } }
      : thread
  )
})));

// 4. Update post authors (THE FIX!)
setPostsMap(postsMap => {
  const updated = {};
  for (const threadId in postsMap) {
    updated[threadId] = postsMap[threadId].map(post =>
      post.author.id === updatedUser.id
        ? { ...post, author: { ...post.author, avatar: updatedUser.custom_avatar } }
        : post
    );
  }
  return updated;
});
```

## Testing Scenarios

### Scenario 1: Single Tab
```
1. Open profile page
2. Upload avatar
3. Navigate to thread with your posts
4. ✅ Avatar should be updated in all posts
```

### Scenario 2: Multiple Tabs
```
Tab 1: Profile page
Tab 2: Thread page with your posts

1. In Tab 1: Upload avatar
2. Switch to Tab 2
3. ✅ Avatar should update automatically (no refresh)
```

### Scenario 3: Another User Viewing
```
User A: Uploads avatar
User B: Viewing User A's posts

1. User A uploads avatar
2. User B's page
3. ✅ User A's avatar updates in real-time
```

### Scenario 4: Offline/Online
```
1. Go offline
2. Upload avatar (will fail)
3. Go online
4. Upload avatar
5. ✅ Avatar updates everywhere
```

## Performance Considerations

```
┌─────────────────────────────────────────┐
│ Real-time Event                         │
│ Size: ~500 bytes                        │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│ State Updates                           │
│ - forumUser: O(1)                       │
│ - categories: O(n * m) where            │
│   n = categories, m = threads           │
│ - postsMap: O(t * p) where              │
│   t = threads, p = posts per thread     │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│ React Re-renders                        │
│ Only affected components re-render      │
│ Thanks to React's reconciliation        │
└─────────────────────────────────────────┘

Typical Performance:
- Event processing: < 50ms
- State updates: < 100ms
- Re-renders: < 200ms
- Total: < 350ms (imperceptible to user)
```

## Troubleshooting Guide

### Avatar not updating?

```
Check 1: Is WebSocket connected?
┌─────────────────────────────────────────┐
│ Browser DevTools > Network > WS         │
│ Should see active WebSocket connection  │
└─────────────────────────────────────────┘
         │
         ↓ YES
Check 2: Is real-time event firing?
┌─────────────────────────────────────────┐
│ Browser Console                         │
│ Look for: "[ForumContext] Forum user    │
│            update event:"               │
└─────────────────────────────────────────┘
         │
         ↓ YES
Check 3: Is database updated?
┌─────────────────────────────────────────┐
│ SELECT custom_avatar FROM forum_users   │
│ WHERE id = 'your-id'                    │
└─────────────────────────────────────────┘
         │
         ↓ YES
Check 4: Is state updating?
┌─────────────────────────────────────────┐
│ Add console.log in state update         │
│ Verify postsMap is being updated        │
└─────────────────────────────────────────┘
```

## Summary

The fix ensures that when a user updates their avatar/banner:

1. ✅ Database is updated immediately
2. ✅ Real-time event is broadcast
3. ✅ All state is updated (including posts!)
4. ✅ All components re-render
5. ✅ Changes appear everywhere instantly
6. ✅ Works across multiple tabs
7. ✅ No page refresh needed

The key was adding the postsMap update to the real-time subscription handler!
