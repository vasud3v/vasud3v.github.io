# Avatar & Banner Update Issue - Root Cause Analysis & Fix

## Problem Statement
User profile avatars and banners are not updating everywhere in the application after upload. The updates are saved to the database but not reflected consistently across all components.

## Root Cause Analysis

### 1. **Data Flow Issue**
The avatar/banner update flow has multiple data sources that aren't properly synchronized:

```
User uploads → updateUserProfile() → forum_users.custom_avatar/custom_banner
                                   ↓
                            Real-time subscription updates forumUser state
                                   ↓
                            BUT: Other components use different data sources
```

### 2. **Multiple Avatar Sources**
Components are pulling avatar data from different places:
- `forumUser.avatar` (from ForumContext state)
- `profileCustomizations[userId]` (local state)
- `getUserAvatar()` helper (generates default avatars)
- Direct Supabase queries in components

### 3. **Inconsistent Avatar Resolution**
Different components resolve avatars differently:

**ForumContext.tsx:**
```typescript
avatar: data.custom_avatar || data.avatar
```

**UserProfilePage.tsx:**
```typescript
avatar: getUserAvatar(data.custom_avatar || data.avatar, data.username)
```

**ThreadDetailPage.tsx (PostCard):**
```typescript
// Uses post.author.avatar directly from context
// May not have latest custom_avatar
```

### 4. **Real-time Subscription Gaps**
The real-time subscription in ForumContext updates:
- ✅ `forumUser` state (current user)
- ✅ Thread authors in `categoriesState`
- ❌ Post authors in `postsMap` (NOT UPDATED)
- ❌ Components that cache user data locally

## Issues Identified

### Issue #1: Posts Don't Update
**Location:** `postsMap` in ForumContext  
**Problem:** When a user updates their avatar, posts by that user don't reflect the change  
**Why:** Real-time subscription doesn't update `postsMap`

### Issue #2: Profile Customizations State Confusion
**Location:** `profileCustomizations` state  
**Problem:** This state is used for temporary UI updates but conflicts with database state  
**Why:** It's updated immediately but may not match what's in the database

### Issue #3: Avatar Helper Inconsistency
**Location:** `getUserAvatar()` calls  
**Problem:** Some components wrap avatars with `getUserAvatar()`, others don't  
**Why:** Inconsistent usage across codebase

### Issue #4: Cached User Data
**Location:** Various components  
**Problem:** Components fetch and cache user data locally without subscribing to updates  
**Why:** No mechanism to invalidate cached user data

## The Fix

### Step 1: Update Real-time Subscription to Include Posts

**File:** `src/context/ForumContext.tsx`

Add post author updates to the real-time subscription:

```typescript
.on(
  'postgres_changes',
  { event: 'UPDATE', schema: 'public', table: 'forum_users' },
  (payload) => {
    console.log('[ForumContext] Forum user update event:', payload);
    
    if (payload.new) {
      const updatedUser = payload.new;
      
      // Update forumUser if it's the current user
      if (authUserId && updatedUser.id === authUserId) {
        setForumUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            username: updatedUser.username,
            avatar: updatedUser.custom_avatar || updatedUser.avatar,
            banner: updatedUser.custom_banner || updatedUser.banner,
            postCount: updatedUser.post_count,
            reputation: updatedUser.reputation,
            isOnline: updatedUser.is_online,
            rank: updatedUser.rank,
          };
        });
      }
      
      // Update categories/threads
      setCategoriesState((prev) =>
        prev.map((cat) => ({
          ...cat,
          threads: cat.threads.map((thread) =>
            thread.author.id === updatedUser.id
              ? {
                  ...thread,
                  author: {
                    ...thread.author,
                    username: updatedUser.username,
                    avatar: updatedUser.custom_avatar || updatedUser.avatar,
                    reputation: updatedUser.reputation,
                    rank: updatedUser.rank,
                  },
                }
              : thread
          ),
        }))
      );
      
      // ⭐ NEW: Update posts map
      setPostsMap((prev) => {
        const updated = { ...prev };
        let hasChanges = false;
        
        for (const threadId in updated) {
          const posts = updated[threadId];
          const updatedPosts = posts.map((post) => {
            if (post.author.id === updatedUser.id) {
              hasChanges = true;
              return {
                ...post,
                author: {
                  ...post.author,
                  username: updatedUser.username,
                  avatar: updatedUser.custom_avatar || updatedUser.avatar,
                  banner: updatedUser.custom_banner || updatedUser.banner,
                  reputation: updatedUser.reputation,
                  rank: updatedUser.rank,
                },
              };
            }
            return post;
          });
          
          if (hasChanges) {
            updated[threadId] = updatedPosts;
          }
        }
        
        return hasChanges ? updated : prev;
      });
    }
  }
)
```

### Step 2: Simplify Profile Customizations

Remove the confusing `profileCustomizations` state and rely on database + real-time updates:

```typescript
// REMOVE this state:
// const [profileCustomizations, setProfileCustomizations] = useState<...>({});

// UPDATE updateUserProfile to not use local state:
const updateUserProfile = useCallback(async (userId: string, updates: { avatar?: string; banner?: string }) => {
  if (!isAuthenticated || !currentUser?.id) {
    console.warn('[ForumContext] Cannot update profile: user not authenticated');
    return;
  }
  
  if (userId !== currentUser.id) {
    console.warn('[ForumContext] Cannot update profile: can only update own profile');
    return;
  }

  // Persist to Supabase forum_users table
  try {
    const updateData: any = {};
    if (updates.avatar !== undefined) {
      updateData.custom_avatar = updates.avatar || null;
    }
    if (updates.banner !== undefined) {
      updateData.custom_banner = updates.banner || null;
    }

    const { error } = await supabase
      .from('forum_users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('[ForumContext] Failed to save profile:', error);
      throw error;
    } else {
      console.log('[ForumContext] Profile saved successfully');
      // Real-time subscription will handle the update
    }
  } catch (err) {
    console.error('[ForumContext] Error persisting profile:', err);
    throw err;
  }
}, [isAuthenticated, currentUser]);

// UPDATE getUserProfile to fetch from database:
const getUserProfile = useCallback(async (userId: string): Promise<{ avatar?: string; banner?: string }> => {
  try {
    const { data, error } = await supabase
      .from('forum_users')
      .select('custom_avatar, custom_banner, avatar, banner')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return {
      avatar: data.custom_avatar || data.avatar,
      banner: data.custom_banner || data.banner,
    };
  } catch (err) {
    console.error('[ForumContext] Error fetching user profile:', err);
    return {};
  }
}, []);
```

### Step 3: Standardize Avatar Resolution

Create a single helper function for avatar resolution:

**File:** `src/lib/avatar.ts`

```typescript
export function resolveUserAvatar(user: {
  custom_avatar?: string | null;
  avatar?: string;
  username: string;
}): string {
  // Priority: custom_avatar > avatar > generated
  if (user.custom_avatar) {
    return user.custom_avatar;
  }
  if (user.avatar) {
    return user.avatar;
  }
  return getUserAvatar(null, user.username);
}
```

Use this consistently everywhere:

```typescript
// In ForumContext when fetching users:
avatar: resolveUserAvatar({
  custom_avatar: data.custom_avatar,
  avatar: data.avatar,
  username: data.username
})

// In components:
<img src={resolveUserAvatar(user)} alt={user.username} />
```

### Step 4: Fix UserProfilePage Local State

**File:** `src/components/forum/UserProfilePage.tsx`

Remove the local profile customization fetch and rely on real-time updates:

```typescript
// REMOVE this useEffect that fetches from profile_customizations
// It's redundant and causes confusion

// REMOVE these lines:
const profileCustom = useMemo(() => {
  if (!userId) return {};
  return getUserProfile(userId);
}, [userId, getUserProfile]);

const currentAvatar = profileCustom.avatar || user?.avatar || '';
const currentBanner = profileCustom.banner || '';

// REPLACE with direct user state:
const currentAvatar = user?.avatar || '';
const currentBanner = user?.banner || '';
```

### Step 5: Ensure Database Columns Exist

Verify the migration has been run:

```sql
-- Check if custom_avatar and custom_banner exist in forum_users
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'forum_users' 
AND column_name IN ('custom_avatar', 'custom_banner');
```

If not, run:
```sql
ALTER TABLE public.forum_users 
ADD COLUMN IF NOT EXISTS custom_avatar TEXT,
ADD COLUMN IF NOT EXISTS custom_banner TEXT;
```

## Testing Checklist

After applying the fix:

- [ ] Upload avatar on profile page
- [ ] Check avatar updates in:
  - [ ] Profile page header
  - [ ] Thread list (thread author)
  - [ ] Thread detail page (post author)
  - [ ] User profile mini cards
  - [ ] Online users list
  - [ ] Leaderboard
- [ ] Upload banner on profile page
- [ ] Check banner updates in profile page
- [ ] Test with multiple browser tabs open
- [ ] Test with another user viewing your profile
- [ ] Check browser console for errors
- [ ] Verify database has correct values

## Implementation Priority

1. **High Priority** - Step 1: Update real-time subscription for posts
2. **High Priority** - Step 3: Standardize avatar resolution
3. **Medium Priority** - Step 4: Fix UserProfilePage
4. **Low Priority** - Step 2: Simplify profile customizations (can be done later)

## Expected Outcome

After implementing these fixes:
- ✅ Avatar/banner updates propagate to all components immediately
- ✅ Real-time updates work across browser tabs
- ✅ No stale cached data
- ✅ Consistent avatar resolution everywhere
- ✅ Single source of truth (database + real-time)

## Migration Path

1. Apply Step 1 first (real-time subscription update)
2. Test thoroughly
3. Apply Step 3 (standardize avatar resolution)
4. Test again
5. Apply Step 4 (fix UserProfilePage)
6. Final testing
7. Consider Step 2 for future refactoring
