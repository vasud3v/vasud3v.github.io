# View Increment Enhancement Options

## Current Behavior

All thread views increment the counter, including:
- Direct page visits
- Navigation from other pages
- Opening in new tabs
- Embedded iframes (via ShareModal embed code)

## Optional Enhancement: Exclude Embedded Views

If you want embedded threads (via iframe) to NOT count as views, apply this change:

### File: `src/components/forum/ThreadDetailPage.tsx`

**Current Code (Line 203-225):**
```typescript
// Increment view count when thread is viewed
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

**Enhanced Code (Excludes Embeds):**
```typescript
// Increment view count when thread is viewed
useEffect(() => {
  if (!threadId) return;
  
  // Don't increment views for embedded threads
  const urlParams = new URLSearchParams(window.location.search);
  const isEmbedded = urlParams.get('embed') === 'true';
  
  if (isEmbedded) {
    console.log('[ThreadDetailPage] Skipping view increment for embedded thread');
    return;
  }
  
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

## Optional Enhancement: Track Unique Views

Currently, every page load increments the view count. To track unique views per user:

### Option 1: Session-Based Tracking (Client-Side)

Store viewed threads in sessionStorage to prevent multiple increments in the same session:

```typescript
// Increment view count when thread is viewed (once per session)
useEffect(() => {
  if (!threadId) return;
  
  // Check if already viewed in this session
  const viewedKey = `thread_viewed_${threadId}`;
  const alreadyViewed = sessionStorage.getItem(viewedKey);
  
  if (alreadyViewed) {
    console.log('[ThreadDetailPage] Thread already viewed in this session');
    return;
  }
  
  const incrementViewCount = async () => {
    try {
      const { error } = await supabase.rpc('increment_thread_views', { 
        thread_id: threadId 
      });
      
      if (error) {
        console.error('[ThreadDetailPage] Error incrementing view count:', error);
      } else {
        // Mark as viewed in this session
        sessionStorage.setItem(viewedKey, 'true');
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

### Option 2: Database-Based Unique Views

Create a separate table to track unique views:

**SQL Migration:**
```sql
-- Create table to track unique thread views
CREATE TABLE IF NOT EXISTS public.thread_views (
  thread_id TEXT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.forum_users(id) ON DELETE CASCADE,
  ip_address TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (thread_id, COALESCE(user_id, ip_address))
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_thread_views_thread ON public.thread_views(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_views_user ON public.thread_views(user_id);

-- Update the increment function to track unique views
CREATE OR REPLACE FUNCTION increment_thread_views_unique(
  thread_id TEXT,
  user_id TEXT DEFAULT NULL,
  ip_address TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update the view record
  INSERT INTO thread_views (thread_id, user_id, ip_address, viewed_at)
  VALUES (thread_id, user_id, ip_address, NOW())
  ON CONFLICT (thread_id, COALESCE(user_id, ip_address))
  DO UPDATE SET viewed_at = NOW();
  
  -- Update the view count (count unique viewers)
  UPDATE threads
  SET view_count = (
    SELECT COUNT(DISTINCT COALESCE(user_id, ip_address))
    FROM thread_views
    WHERE thread_views.thread_id = threads.id
  )
  WHERE id = thread_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_thread_views_unique(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_thread_views_unique(TEXT, TEXT, TEXT) TO anon;
```

**Frontend Code:**
```typescript
// Increment view count when thread is viewed (unique per user)
useEffect(() => {
  if (!threadId) return;
  
  const incrementViewCount = async () => {
    try {
      const userId = currentUser?.id || null;
      
      const { error } = await supabase.rpc('increment_thread_views_unique', { 
        thread_id: threadId,
        user_id: userId,
        ip_address: null // Could be obtained from a backend API
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
}, [threadId, currentUser]);
```

## Optional Enhancement: View Analytics

Track more detailed view analytics:

```sql
-- Create detailed view analytics table
CREATE TABLE IF NOT EXISTS public.thread_view_analytics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  thread_id TEXT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.forum_users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  time_spent_seconds INTEGER,
  is_embedded BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_thread_view_analytics_thread ON public.thread_view_analytics(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_view_analytics_user ON public.thread_view_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_view_analytics_date ON public.thread_view_analytics(viewed_at);
```

## Recommendation

For most forums, the **current simple implementation** is sufficient:
- Every page load increments the counter
- Simple and reliable
- No additional database tables needed

Consider enhancements only if:
- You need accurate unique visitor counts
- You want to exclude embedded views
- You need detailed analytics for business intelligence

## Performance Considerations

- Current implementation: 1 RPC call per thread view (very fast)
- Session-based tracking: Same performance, uses browser storage
- Database unique views: Slightly slower (2 queries instead of 1)
- Detailed analytics: Requires additional storage and processing

Choose based on your needs vs. complexity trade-off.
