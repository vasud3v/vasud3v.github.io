# Posts System Improvements

## Overview
This document outlines improvements to the forum posts system to enhance functionality, user experience, and maintainability.

## Current Issues Identified

### 1. Post Editing & History
- Limited edit tracking (only stores last edit timestamp)
- No edit history/changelog visible to users
- No edit reason field

### 2. Post Reactions
- Reactions stored in state but not persisted to database properly
- No real-time reaction updates
- Limited reaction types

### 3. Post Voting
- Vote state management could be more robust
- No vote change tracking
- Missing vote validation

### 4. Content Rendering
- Complex inline processing in component (performance issue)
- Repeated parsing logic
- No content caching

### 5. Post Actions
- Missing: bookmarking individual posts
- Missing: reporting posts
- Missing: post sharing with specific post anchor
- Missing: post history/revisions view

### 6. Performance
- Large posts with many embeds cause re-renders
- No virtualization for long thread views
- Image loading not optimized

## Proposed Improvements

### Phase 1: Database Schema Enhancements

#### 1.1 Post Edit History Table
```sql
CREATE TABLE post_edit_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_by TEXT NOT NULL REFERENCES forum_users(id),
  edit_reason TEXT,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL
);
```

#### 1.2 Post Bookmarks Table
```sql
CREATE TABLE post_bookmarks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES forum_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
```

#### 1.3 Post Reports Table
```sql
CREATE TABLE post_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES forum_users(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  reviewed_by TEXT REFERENCES forum_users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 1.4 Enhanced Posts Table
```sql
ALTER TABLE posts ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_edit_reason TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_by TEXT REFERENCES forum_users(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS read_time_minutes INTEGER DEFAULT 1;
```

### Phase 2: Component Improvements

#### 2.1 Separate Content Renderer Component
- Extract content parsing logic to dedicated component
- Implement memoization for parsed content
- Add lazy loading for images and embeds

#### 2.2 Post Actions Menu
- Unified action menu for all post operations
- Context-aware actions based on user permissions
- Keyboard shortcuts support

#### 2.3 Edit History Modal
- View all previous versions of a post
- Diff view between versions
- Restore previous version capability (for moderators)

#### 2.4 Post Reporting Flow
- Report modal with predefined reasons
- Custom reason input
- Anonymous reporting option

### Phase 3: Feature Enhancements

#### 3.1 Advanced Post Editing
- Auto-save drafts while editing
- Edit reason field (optional/required based on time since post)
- Preview mode before saving
- Character/word count display

#### 3.2 Post Bookmarking
- Bookmark individual posts (not just threads)
- Bookmark collections/folders
- Quick access to bookmarked posts

#### 3.3 Post Sharing
- Share with direct link to specific post
- Generate post preview card for social media
- Copy formatted quote for external use

#### 3.4 Post Analytics (for post authors)
- View count per post
- Reaction breakdown
- Vote history graph
- Best performing posts

### Phase 4: Performance Optimizations

#### 4.1 Content Caching
- Cache parsed markdown content
- Cache rendered embeds
- Invalidate cache on edit

#### 4.2 Virtual Scrolling
- Implement virtual list for threads with 100+ posts
- Load posts on-demand as user scrolls
- Maintain scroll position on navigation

#### 4.3 Image Optimization
- Lazy load images below fold
- Progressive image loading
- Thumbnail generation for large images

#### 4.4 Code Splitting
- Lazy load embed renderers
- Lazy load rich text editor
- Lazy load moderation tools

## Implementation Priority

### High Priority (Immediate)
1. Post edit history tracking
2. Improved content renderer with memoization
3. Post reporting system
4. Enhanced post actions menu

### Medium Priority (Next Sprint)
1. Post bookmarking
2. Advanced editing features (auto-save, preview)
3. Performance optimizations (caching, lazy loading)
4. Post sharing improvements

### Low Priority (Future)
1. Post analytics
2. Virtual scrolling
3. Advanced moderation tools
4. Post templates

## Technical Considerations

### Security
- Validate all user inputs
- Sanitize HTML/markdown content
- Rate limit post creation/editing
- Implement CAPTCHA for guest posts (if allowed)

### Accessibility
- Ensure keyboard navigation works
- Add ARIA labels to all interactive elements
- Support screen readers
- High contrast mode support

### Mobile Responsiveness
- Touch-friendly action buttons
- Swipe gestures for common actions
- Optimized layout for small screens
- Reduced data usage on mobile

## Success Metrics

### User Engagement
- Increase in post edits with reasons
- Reduction in duplicate reports
- Increase in post reactions
- Improved post quality scores

### Performance
- Reduce initial page load time by 30%
- Reduce time to interactive by 40%
- Improve Lighthouse score to 90+

### Moderation
- Faster report resolution time
- Reduced false positive reports
- Better content quality tracking

## Next Steps

1. Review and approve this improvement plan
2. Create database migration scripts
3. Implement Phase 1 database changes
4. Build new components for Phase 2
5. Test thoroughly with real data
6. Deploy incrementally with feature flags
7. Monitor metrics and gather feedback
8. Iterate based on user feedback
