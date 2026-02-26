-- ============================================================================
-- POSTS SYSTEM IMPROVEMENTS
-- Migration: 20240201_improve_posts_system
-- Description: Enhances the posts system with edit history, bookmarks, reports,
--              and additional metadata for better user experience
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENHANCE POSTS TABLE
-- ============================================================================

-- Add version tracking and metadata
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_edit_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT REFERENCES public.forum_users(id),
  ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS read_time_minutes INTEGER DEFAULT 1;

-- Create index for deleted posts
CREATE INDEX IF NOT EXISTS idx_posts_deleted ON public.posts(is_deleted) WHERE is_deleted = false;

-- Create index for post performance queries
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON public.posts(author_id, created_at DESC);

COMMENT ON COLUMN public.posts.version IS 'Version number incremented on each edit';
COMMENT ON COLUMN public.posts.last_edit_reason IS 'Reason provided by user for last edit';
COMMENT ON COLUMN public.posts.is_deleted IS 'Soft delete flag';
COMMENT ON COLUMN public.posts.word_count IS 'Approximate word count for analytics';
COMMENT ON COLUMN public.posts.read_time_minutes IS 'Estimated reading time in minutes';

-- ============================================================================
-- 2. POST EDIT HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.post_edit_history (
  id TEXT PRIMARY KEY DEFAULT 'edit-' || gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_by TEXT NOT NULL REFERENCES public.forum_users(id),
  edit_reason TEXT,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  changes_summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_post_edit_history_post ON public.post_edit_history(post_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_post_edit_history_editor ON public.post_edit_history(edited_by, edited_at DESC);

COMMENT ON TABLE public.post_edit_history IS 'Tracks all edits made to posts for history and audit purposes';
COMMENT ON COLUMN public.post_edit_history.changes_summary IS 'Brief summary of what changed (auto-generated or user-provided)';

-- ============================================================================
-- 3. POST BOOKMARKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.post_bookmarks (
  id TEXT PRIMARY KEY DEFAULT 'bookmark-' || gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  note TEXT,
  folder TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user ON public.post_bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_folder ON public.post_bookmarks(user_id, folder);

COMMENT ON TABLE public.post_bookmarks IS 'User bookmarks for individual posts';
COMMENT ON COLUMN public.post_bookmarks.note IS 'Optional note about why this post was bookmarked';
COMMENT ON COLUMN public.post_bookmarks.folder IS 'Folder/collection name for organizing bookmarks';

-- ============================================================================
-- 4. POST REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.post_reports (
  id TEXT PRIMARY KEY DEFAULT 'report-' || gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES public.forum_users(id),
  reason TEXT NOT NULL CHECK (reason IN (
    'spam',
    'harassment',
    'inappropriate_content',
    'misinformation',
    'off_topic',
    'duplicate',
    'other'
  )),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'under_review',
    'resolved',
    'dismissed'
  )),
  reviewed_by TEXT REFERENCES public.forum_users(id),
  reviewed_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_reports_status ON public.post_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reports_post ON public.post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_reporter ON public.post_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_reviewer ON public.post_reports(reviewed_by);

COMMENT ON TABLE public.post_reports IS 'User reports for posts that violate community guidelines';
COMMENT ON COLUMN public.post_reports.resolution_note IS 'Note from moderator about how the report was handled';

-- ============================================================================
-- 5. POST VIEWS TABLE (for analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.post_views (
  id TEXT PRIMARY KEY DEFAULT 'view-' || gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.forum_users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT,
  ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_post_views_post ON public.post_views(post_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_views_user ON public.post_views(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_views_session ON public.post_views(session_id);

COMMENT ON TABLE public.post_views IS 'Tracks post views for analytics (can be aggregated and archived)';

-- ============================================================================
-- 6. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to calculate word count and reading time
CREATE OR REPLACE FUNCTION calculate_post_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate word count (approximate)
  NEW.word_count := array_length(regexp_split_to_array(trim(NEW.content), '\s+'), 1);
  
  -- Calculate reading time (assuming 200 words per minute)
  NEW.read_time_minutes := GREATEST(1, CEIL(NEW.word_count::NUMERIC / 200));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate metrics on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_post_metrics ON public.posts;
CREATE TRIGGER trigger_calculate_post_metrics
  BEFORE INSERT OR UPDATE OF content ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_post_metrics();

-- Function to create edit history entry
CREATE OR REPLACE FUNCTION create_post_edit_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    -- Increment version
    NEW.version := OLD.version + 1;
    
    -- Insert history record
    INSERT INTO public.post_edit_history (
      post_id,
      content,
      edited_by,
      edit_reason,
      edited_at,
      version,
      word_count
    ) VALUES (
      OLD.id,
      OLD.content,
      NEW.author_id, -- In real implementation, this should be current_user_id
      NEW.last_edit_reason,
      OLD.edited_at,
      OLD.version,
      OLD.word_count
    );
    
    -- Update edited_at timestamp
    NEW.edited_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create edit history
DROP TRIGGER IF EXISTS trigger_post_edit_history ON public.posts;
CREATE TRIGGER trigger_post_edit_history
  BEFORE UPDATE OF content ON public.posts
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION create_post_edit_history();

-- Function to update report timestamp
CREATE OR REPLACE FUNCTION update_report_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update report timestamp
DROP TRIGGER IF EXISTS trigger_update_report_timestamp ON public.post_reports;
CREATE TRIGGER trigger_update_report_timestamp
  BEFORE UPDATE ON public.post_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_report_timestamp();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.post_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Post Edit History Policies
CREATE POLICY "Anyone can view edit history"
  ON public.post_edit_history FOR SELECT
  USING (true);

-- Post Bookmarks Policies
CREATE POLICY "Users can view their own bookmarks"
  ON public.post_bookmarks FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own bookmarks"
  ON public.post_bookmarks FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.post_bookmarks FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON public.post_bookmarks FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Post Reports Policies
CREATE POLICY "Users can view their own reports"
  ON public.post_reports FOR SELECT
  USING (auth.uid()::text = reporter_id);

CREATE POLICY "Moderators can view all reports"
  ON public.post_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forum_users
      WHERE id = auth.uid()::text
      AND rank IN ('Administrator', 'Moderator')
    )
  );

CREATE POLICY "Authenticated users can create reports"
  ON public.post_reports FOR INSERT
  WITH CHECK (auth.uid()::text = reporter_id);

CREATE POLICY "Moderators can update reports"
  ON public.post_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.forum_users
      WHERE id = auth.uid()::text
      AND rank IN ('Administrator', 'Moderator')
    )
  );

-- Post Views Policies (more permissive for analytics)
CREATE POLICY "Anyone can insert views"
  ON public.post_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own view history"
  ON public.post_views FOR SELECT
  USING (auth.uid()::text = user_id OR user_id IS NULL);

-- ============================================================================
-- 8. HELPER VIEWS
-- ============================================================================

-- View for post statistics
CREATE OR REPLACE VIEW post_statistics AS
SELECT 
  p.id,
  p.thread_id,
  p.author_id,
  p.created_at,
  p.word_count,
  p.read_time_minutes,
  p.upvotes,
  p.downvotes,
  p.likes,
  p.version,
  (p.upvotes - p.downvotes) as vote_score,
  COUNT(DISTINCT pr.id) as reaction_count,
  COUNT(DISTINCT pb.id) as bookmark_count,
  COUNT(DISTINCT pv.id) as view_count,
  COUNT(DISTINCT rep.id) FILTER (WHERE rep.status = 'pending') as pending_reports
FROM public.posts p
LEFT JOIN public.post_reactions pr ON pr.post_id = p.id
LEFT JOIN public.post_bookmarks pb ON pb.post_id = p.id
LEFT JOIN public.post_views pv ON pv.post_id = p.id
LEFT JOIN public.post_reports rep ON rep.post_id = p.id
WHERE p.is_deleted = false
GROUP BY p.id;

COMMENT ON VIEW post_statistics IS 'Aggregated statistics for each post';

-- View for user post analytics
CREATE OR REPLACE VIEW user_post_analytics AS
SELECT 
  p.author_id,
  COUNT(*) as total_posts,
  SUM(p.upvotes) as total_upvotes,
  SUM(p.downvotes) as total_downvotes,
  SUM(p.upvotes - p.downvotes) as net_votes,
  AVG(p.upvotes - p.downvotes) as avg_vote_score,
  SUM(p.word_count) as total_words_written,
  COUNT(*) FILTER (WHERE p.is_answer = true) as best_answers,
  COUNT(DISTINCT pr.id) as total_reactions_received
FROM public.posts p
LEFT JOIN public.post_reactions pr ON pr.post_id = p.id
WHERE p.is_deleted = false
GROUP BY p.author_id;

COMMENT ON VIEW user_post_analytics IS 'Aggregated post statistics per user';

-- ============================================================================
-- 9. INITIAL DATA MIGRATION
-- ============================================================================

-- Calculate metrics for existing posts
UPDATE public.posts
SET 
  word_count = array_length(regexp_split_to_array(trim(content), '\s+'), 1),
  read_time_minutes = GREATEST(1, CEIL(array_length(regexp_split_to_array(trim(content), '\s+'), 1)::NUMERIC / 200))
WHERE word_count = 0 OR word_count IS NULL;

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT ON public.post_edit_history TO authenticated;
GRANT ALL ON public.post_bookmarks TO authenticated;
GRANT SELECT, INSERT ON public.post_reports TO authenticated;
GRANT INSERT ON public.post_views TO authenticated;
GRANT SELECT ON public.post_views TO authenticated;

-- Grant access to views
GRANT SELECT ON post_statistics TO authenticated;
GRANT SELECT ON user_post_analytics TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('version', 'last_edit_reason', 'is_deleted', 'word_count', 'read_time_minutes');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('post_edit_history', 'post_bookmarks', 'post_reports', 'post_views');

-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_calculate_post_metrics', 'trigger_post_edit_history', 'trigger_update_report_timestamp');

-- Sample query to test post statistics view
SELECT * FROM post_statistics LIMIT 5;
