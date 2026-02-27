# View Increment Flow Diagram

## User Journey → View Increment

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER ACTIONS                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │  Clicks thread from any page:                       │
    │  • Home page                                        │
    │  • Search results                                   │
    │  • Category page                                    │
    │  • User profile                                     │
    │  • Bookmarks                                        │
    │  • Watched threads                                  │
    │  • What's new                                       │
    │  • Admin dashboard                                  │
    │  • Analytics                                        │
    │  • Related threads sidebar                          │
    │  • Trending ticker                                  │
    └─────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │  React Router navigates to:                         │
    │  /thread/:threadId                                  │
    └─────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │  ThreadDetailPage component mounts                  │
    │  Location: src/components/forum/ThreadDetailPage.tsx│
    └─────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │  useEffect hook triggers (Line 203)                 │
    │  Waits 1 second to avoid counting bounces          │
    └─────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │  Calls Supabase RPC:                                │
    │  supabase.rpc('increment_thread_views', {           │
    │    thread_id: threadId                              │
    │  })                                                 │
    └─────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │  PostgreSQL function executes:                      │
    │  increment_thread_views(thread_id TEXT)             │
    │                                                     │
    │  Properties:                                        │
    │  • SECURITY DEFINER (bypasses RLS)                 │
    │  • SET search_path = public                        │
    └─────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │  SQL UPDATE executes:                               │
    │  UPDATE threads                                     │
    │  SET view_count = COALESCE(view_count, 0) + 1      │
    │  WHERE id = thread_id;                             │
    └─────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │  View count incremented ✅                          │
    │  threads.view_count = previous_value + 1            │
    └─────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │  Success returned to frontend                       │
    │  (or error logged to console)                       │
    └─────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ERROR SCENARIOS                              │
└─────────────────────────────────────────────────────────────────┘

Scenario 1: Function Doesn't Exist
    ↓
┌─────────────────────────────────────────────────────┐
│ Error Code: 42883                                   │
│ Message: "function increment_thread_views does not  │
│          exist"                                     │
│                                                     │
│ Solution: Run FIX_VIEW_INCREMENT_COMPLETE.sql       │
└─────────────────────────────────────────────────────┘

Scenario 2: Permission Denied
    ↓
┌─────────────────────────────────────────────────────┐
│ Error: Permission denied                            │
│                                                     │
│ Cause: Missing GRANT EXECUTE statements            │
│                                                     │
│ Solution: Run FIX_VIEW_INCREMENT_COMPLETE.sql       │
└─────────────────────────────────────────────────────┘

Scenario 3: RLS Blocking Update
    ↓
┌─────────────────────────────────────────────────────┐
│ Error: Silent failure (no error but no increment)   │
│                                                     │
│ Cause: Function missing SECURITY DEFINER            │
│                                                     │
│ Solution: Run FIX_VIEW_INCREMENT_COMPLETE.sql       │
└─────────────────────────────────────────────────────┘

Scenario 4: Syntax Error in Function
    ↓
┌─────────────────────────────────────────────────────┐
│ Error: Syntax error near "$"                        │
│                                                     │
│ Cause: Single $ instead of $$ delimiter            │
│                                                     │
│ Solution: Already fixed in migration file           │
└─────────────────────────────────────────────────────┘
```

## Component Interaction Map

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                            │
└──────────────────────────────────────────────────────────────────┘

Home Page (/)
    └─→ CategoryCardHome
        └─→ ThreadRow
            └─→ navigate(/thread/:id) ──┐
                                        │
Search Page (/search)                   │
    └─→ Search Results                  │
        └─→ navigate(/thread/:id) ──────┤
                                        │
Category Page (/category/:id)           │
    └─→ ThreadRow                       │
        └─→ navigate(/thread/:id) ──────┤
                                        │
User Profile (/user/:id)                │
    └─→ Thread List                     │
        └─→ navigate(/thread/:id) ──────┤
                                        │
Bookmarks (/bookmarks)                  │
    └─→ ThreadRow                       │
        └─→ navigate(/thread/:id) ──────┤
                                        │
Watched Threads (/watched)              │
    └─→ ThreadRow                       │
        └─→ navigate(/thread/:id) ──────┤
                                        │
What's New (/whats-new)                 │
    └─→ ThreadRow                       │
        └─→ navigate(/thread/:id) ──────┤
                                        │
Admin Dashboard (/admin)                │
    └─→ Thread List                     │
        └─→ navigate(/thread/:id) ──────┤
                                        │
Analytics (/analytics)                  │
    └─→ Top Threads                     │
        └─→ navigate(/thread/:id) ──────┤
                                        │
Post Bookmarks (/bookmarks)             │
    └─→ Post List                       │
        └─→ navigate(/thread/:id#post) ─┤
                                        │
Trending Ticker (Header)                │
    └─→ navigate(/thread/:id) ──────────┤
                                        │
Related Threads (Sidebar)               │
    └─→ navigate(/thread/:id) ──────────┤
                                        │
                                        ↓
                        ┌───────────────────────────┐
                        │   ThreadDetailPage        │
                        │   (/thread/:id)           │
                        │                           │
                        │   ✅ Increments views     │
                        └───────────────────────────┘
```

## Database Schema

```
┌──────────────────────────────────────────────────────────────────┐
│                    threads TABLE                                  │
├──────────────────────────────────────────────────────────────────┤
│ id                TEXT PRIMARY KEY                                │
│ title             TEXT NOT NULL                                   │
│ view_count        INTEGER NOT NULL DEFAULT 0  ← INCREMENTED HERE │
│ reply_count       INTEGER NOT NULL DEFAULT 0                      │
│ author_id         TEXT NOT NULL                                   │
│ category_id       TEXT NOT NULL                                   │
│ created_at        TIMESTAMPTZ NOT NULL                            │
│ ...                                                               │
└──────────────────────────────────────────────────────────────────┘
                              ↑
                              │
                    Updated by function
                              │
┌──────────────────────────────────────────────────────────────────┐
│            increment_thread_views(thread_id TEXT)                 │
├──────────────────────────────────────────────────────────────────┤
│ LANGUAGE: plpgsql                                                 │
│ SECURITY: DEFINER (bypasses RLS)                                 │
│ SEARCH_PATH: public                                              │
│                                                                   │
│ Logic:                                                            │
│   UPDATE threads                                                  │
│   SET view_count = COALESCE(view_count, 0) + 1                   │
│   WHERE id = thread_id;                                          │
│                                                                   │
│ Permissions:                                                      │
│   GRANT EXECUTE TO authenticated                                  │
│   GRANT EXECUTE TO anon                                          │
└──────────────────────────────────────────────────────────────────┘
```

## Timing Diagram

```
Time →

0ms     User clicks thread link
        │
        ↓
100ms   React Router navigation starts
        │
        ↓
200ms   ThreadDetailPage component mounts
        │
        ↓
300ms   useEffect hook registers
        │
        ↓
400ms   setTimeout(incrementViewCount, 1000) starts
        │
        ↓
500ms   Page renders, user sees content
        │
        ↓
1000ms  ← User must stay on page for 1 second
        │
        ↓
1400ms  incrementViewCount() executes
        │
        ↓
1450ms  RPC call to Supabase
        │
        ↓
1500ms  Database function executes
        │
        ↓
1550ms  view_count updated in database
        │
        ↓
1600ms  Success/error returned to frontend
        │
        ↓
1650ms  Console log (if error)

Note: If user leaves page before 1000ms, 
      setTimeout is cleared and view is NOT counted
```

## Security & Performance

```
┌──────────────────────────────────────────────────────────────────┐
│                    SECURITY FEATURES                              │
└──────────────────────────────────────────────────────────────────┘

✅ SECURITY DEFINER
   • Function runs with owner privileges
   • Bypasses RLS policies on threads table
   • Allows anyone to increment views

✅ SET search_path = public
   • Prevents schema injection attacks
   • Ensures function uses correct schema

✅ 1-second delay
   • Prevents counting accidental clicks
   • Reduces bot/crawler impact
   • Improves accuracy

✅ COALESCE(view_count, 0)
   • Handles NULL values safely
   • Prevents arithmetic errors

┌──────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE                                    │
└──────────────────────────────────────────────────────────────────┘

✅ Single UPDATE query
   • Fast execution (~1-5ms)
   • No additional reads needed

✅ Indexed column
   • Primary key lookup (id)
   • Instant row location

✅ No transaction overhead
   • Simple atomic operation
   • No locks or conflicts

✅ Async execution
   • Non-blocking for user
   • Fire-and-forget pattern
```

## Troubleshooting Decision Tree

```
Views not incrementing?
        │
        ↓
    Check browser console
        │
        ├─→ Error: "function does not exist"
        │   └─→ Run FIX_VIEW_INCREMENT_COMPLETE.sql
        │
        ├─→ Error: "permission denied"
        │   └─→ Run FIX_VIEW_INCREMENT_COMPLETE.sql
        │
        ├─→ No error shown
        │   │
        │   ↓
        │   Check Network tab
        │   │
        │   ├─→ RPC call not made
        │   │   └─→ Check if threadId is valid
        │   │
        │   ├─→ RPC call returns error
        │   │   └─→ Check Supabase logs
        │   │
        │   └─→ RPC call succeeds but count doesn't change
        │       └─→ Check RLS policies
        │           └─→ Ensure SECURITY DEFINER is set
        │
        └─→ Everything looks fine
            └─→ Run test script: node scripts/test-view-increment.js
```
