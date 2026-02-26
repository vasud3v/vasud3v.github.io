-- ============================================================================
-- Moderation System Migration
-- Adds role hierarchy, content reports, moderation logs, user warnings
-- ============================================================================

-- 1. Add role column to forum_users
ALTER TABLE public.forum_users 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member'
  CHECK (role IN ('admin', 'super_moderator', 'moderator', 'member', 'restricted'));

-- 2. Add ban-related columns to forum_users
ALTER TABLE public.forum_users
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason TEXT,
  ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_by TEXT;

-- ============================================================================
-- Content Reports
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_reports (
  id TEXT PRIMARY KEY DEFAULT 'report-' || gen_random_uuid()::text,
  reporter_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'post')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'off_topic', 'inappropriate', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by TEXT REFERENCES public.forum_users(id),
  resolved_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Moderation Logs (audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id TEXT PRIMARY KEY DEFAULT 'modlog-' || gen_random_uuid()::text,
  moderator_id TEXT NOT NULL REFERENCES public.forum_users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'post', 'user', 'category', 'report')),
  target_id TEXT NOT NULL,
  target_user_id TEXT REFERENCES public.forum_users(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- User Warnings
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_warnings (
  id TEXT PRIMARY KEY DEFAULT 'warn-' || gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  issued_by TEXT NOT NULL REFERENCES public.forum_users(id),
  reason TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_target ON public.content_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator ON public.moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created ON public.moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_warnings_user ON public.user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_users_role ON public.forum_users(role);

-- ============================================================================
-- Helper function: check if a user is staff
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_staff(check_user_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = check_user_id
    AND role IN ('admin', 'super_moderator', 'moderator')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: check if user is admin or super_mod
CREATE OR REPLACE FUNCTION public.is_admin_or_supermod(check_user_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = check_user_id
    AND role IN ('admin', 'super_moderator')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================================
-- Updated RLS Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

-- Content Reports: anyone can insert (report), staff can manage
CREATE POLICY "reports_select" ON public.content_reports FOR SELECT
  USING (auth.uid()::text = reporter_id OR public.is_staff(auth.uid()::text));
CREATE POLICY "reports_insert" ON public.content_reports FOR INSERT
  WITH CHECK (auth.uid()::text = reporter_id);
CREATE POLICY "reports_update" ON public.content_reports FOR UPDATE
  USING (public.is_staff(auth.uid()::text));

-- Moderation Logs: staff can insert, admin/supermod can view
CREATE POLICY "modlogs_select" ON public.moderation_logs FOR SELECT
  USING (public.is_admin_or_supermod(auth.uid()::text));
CREATE POLICY "modlogs_insert" ON public.moderation_logs FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()::text));

-- User Warnings: staff can manage, users can see their own
CREATE POLICY "warnings_select" ON public.user_warnings FOR SELECT
  USING (auth.uid()::text = user_id OR public.is_staff(auth.uid()::text));
CREATE POLICY "warnings_insert" ON public.user_warnings FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()::text));
CREATE POLICY "warnings_update" ON public.user_warnings FOR UPDATE
  USING (public.is_staff(auth.uid()::text));

-- Update threads: allow staff to update any thread
DROP POLICY IF EXISTS "threads_update" ON public.threads;
CREATE POLICY "threads_update" ON public.threads FOR UPDATE
  USING (auth.uid()::text = author_id OR public.is_staff(auth.uid()::text));

-- Add thread delete policy for staff
DROP POLICY IF EXISTS "threads_delete" ON public.threads;
CREATE POLICY "threads_delete" ON public.threads FOR DELETE
  USING (public.is_staff(auth.uid()::text));

-- Update posts: allow staff to update/delete any post
DROP POLICY IF EXISTS "posts_update" ON public.posts;
CREATE POLICY "posts_update" ON public.posts FOR UPDATE
  USING (auth.uid()::text = author_id OR public.is_staff(auth.uid()::text));

DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_delete" ON public.posts FOR DELETE
  USING (public.is_staff(auth.uid()::text));

-- Categories: admin can manage, anyone can read (already has select)
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
CREATE POLICY "categories_insert" ON public.categories FOR INSERT
  WITH CHECK (public.is_admin_or_supermod(auth.uid()::text));

DROP POLICY IF EXISTS "categories_update" ON public.categories;
CREATE POLICY "categories_update" ON public.categories FOR UPDATE
  USING (public.is_admin_or_supermod(auth.uid()::text));

DROP POLICY IF EXISTS "categories_delete" ON public.categories;
CREATE POLICY "categories_delete" ON public.categories FOR DELETE
  USING (public.is_admin_or_supermod(auth.uid()::text));

-- Forum users: allow admin/supermod to update any user (for role changes, bans)
DROP POLICY IF EXISTS "forum_users_update" ON public.forum_users;
CREATE POLICY "forum_users_update" ON public.forum_users FOR UPDATE
  USING (auth.uid()::text = id OR public.is_admin_or_supermod(auth.uid()::text));

-- Allow staff to insert threads on behalf of others (admin creating threads)
DROP POLICY IF EXISTS "threads_insert" ON public.threads;
CREATE POLICY "threads_insert" ON public.threads FOR INSERT
  WITH CHECK (auth.uid()::text = author_id OR public.is_staff(auth.uid()::text));

-- Allow staff to insert posts 
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
CREATE POLICY "posts_insert" ON public.posts FOR INSERT
  WITH CHECK (auth.uid()::text = author_id OR public.is_staff(auth.uid()::text));

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.moderation_logs;
