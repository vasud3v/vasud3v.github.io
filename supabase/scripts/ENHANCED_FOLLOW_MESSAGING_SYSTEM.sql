-- ============================================================================
-- ENHANCED Follow and Messaging System with Advanced Features
-- Version 2.0 - Production Ready
-- ============================================================================

-- ============================================================================
-- CLEANUP: Drop existing objects
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON public.user_follows;
DROP TRIGGER IF EXISTS trigger_update_unread_count ON public.messages;
DROP TRIGGER IF EXISTS trigger_prevent_self_follow ON public.user_follows;
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON public.messages;
DROP TRIGGER IF EXISTS trigger_check_message_permission ON public.messages;
DROP TRIGGER IF EXISTS trigger_update_message_edited ON public.messages;

-- Drop functions
DROP FUNCTION IF EXISTS update_follower_counts() CASCADE;
DROP FUNCTION IF EXISTS update_unread_count() CASCADE;
DROP FUNCTION IF EXISTS can_message_user(TEXT) CASCADE;
DROP FUNCTION IF EXISTS prevent_self_follow() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;
DROP FUNCTION IF EXISTS check_message_permission() CASCADE;
DROP FUNCTION IF EXISTS update_message_edited_timestamp() CASCADE;
DROP FUNCTION IF EXISTS get_mutual_followers(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_conversation_with_user(TEXT) CASCADE;
DROP FUNCTION IF EXISTS mark_conversation_read(TEXT) CASCADE;
DROP FUNCTION IF EXISTS delete_conversation(TEXT) CASCADE;
DROP FUNCTION IF EXISTS block_user(TEXT) CASCADE;
DROP FUNCTION IF EXISTS unblock_user(TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_user_blocked(TEXT) CASCADE;

-- Drop policies (only if tables exist)
DO $$ 
BEGIN
  -- Drop user_follows policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_follows') THEN
    DROP POLICY IF EXISTS "Users can view their own follows" ON public.user_follows;
    DROP POLICY IF EXISTS "Users can create follow requests" ON public.user_follows;
    DROP POLICY IF EXISTS "Users can update their received follow requests" ON public.user_follows;
    DROP POLICY IF EXISTS "Users can delete their own follows" ON public.user_follows;
  END IF;

  -- Drop conversations policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
    DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
    DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
    DROP POLICY IF EXISTS "Users can delete their conversations" ON public.conversations;
  END IF;

  -- Drop conversation_participants policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversation_participants') THEN
    DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
    DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
    DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;
    DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_participants;
  END IF;

  -- Drop messages policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
    DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
    DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
    DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
  END IF;

  -- Drop user_blocks policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_blocks') THEN
    DROP POLICY IF EXISTS "Users can view their blocks" ON public.user_blocks;
    DROP POLICY IF EXISTS "Users can create blocks" ON public.user_blocks;
    DROP POLICY IF EXISTS "Users can delete their blocks" ON public.user_blocks;
  END IF;
END $$;

-- Drop tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.user_blocks CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.user_follows CASCADE;

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- User Follows Table (Enhanced)
CREATE TABLE public.user_follows (
  follower_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- User Blocks Table (NEW)
CREATE TABLE public.user_blocks (
  blocker_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Conversations Table (Enhanced)
CREATE TABLE public.conversations (
  id TEXT PRIMARY KEY DEFAULT 'conv-' || gen_random_uuid()::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_by TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Conversation Participants (Enhanced)
CREATE TABLE public.conversation_participants (
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  unread_count INTEGER NOT NULL DEFAULT 0,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  left_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages Table (Enhanced)
CREATE TABLE public.messages (
  id TEXT PRIMARY KEY DEFAULT 'msg-' || gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(TRIM(content)) > 0 AND LENGTH(content) <= 5000),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  reply_to_id TEXT REFERENCES public.messages(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- ADD COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add columns to forum_users
ALTER TABLE public.forum_users 
  ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_messages_from TEXT NOT NULL DEFAULT 'following' 
    CHECK (allow_messages_from IN ('everyone', 'following', 'none')),
  ADD COLUMN IF NOT EXISTS blocked_count INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- CREATE INDEXES (Optimized for Performance)
-- ============================================================================

-- User Follows Indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_status ON public.user_follows(status);
CREATE INDEX IF NOT EXISTS idx_user_follows_created ON public.user_follows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_follows_composite ON public.user_follows(follower_id, following_id, status);

-- User Blocks Indexes
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

-- Conversations Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON public.conversations(is_archived);

-- Conversation Participants Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_unread ON public.conversation_participants(user_id, unread_count) WHERE unread_count > 0;
CREATE INDEX IF NOT EXISTS idx_conversation_participants_pinned ON public.conversation_participants(user_id, is_pinned) WHERE is_pinned = true;

-- Messages Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_not_deleted ON public.messages(conversation_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, is_read) WHERE is_read = false AND deleted_at IS NULL;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (Enhanced with Block Support)
-- ============================================================================

-- User Follows Policies
CREATE POLICY "Users can view their own follows"
  ON public.user_follows FOR SELECT
  USING (
    (SELECT auth.uid())::text = follower_id OR 
    (SELECT auth.uid())::text = following_id
  );

CREATE POLICY "Users can create follow requests"
  ON public.user_follows FOR INSERT
  WITH CHECK (
    (SELECT auth.uid())::text = follower_id AND
    follower_id != following_id AND
    NOT EXISTS (
      SELECT 1 FROM public.user_blocks
      WHERE (blocker_id = following_id AND blocked_id = follower_id)
         OR (blocker_id = follower_id AND blocked_id = following_id)
    )
  );

CREATE POLICY "Users can update their received follow requests"
  ON public.user_follows FOR UPDATE
  USING ((SELECT auth.uid())::text = following_id);

CREATE POLICY "Users can delete their own follows"
  ON public.user_follows FOR DELETE
  USING ((SELECT auth.uid())::text = follower_id);

-- User Blocks Policies
CREATE POLICY "Users can view their blocks"
  ON public.user_blocks FOR SELECT
  USING ((SELECT auth.uid())::text = blocker_id);

CREATE POLICY "Users can create blocks"
  ON public.user_blocks FOR INSERT
  WITH CHECK (
    (SELECT auth.uid())::text = blocker_id AND
    blocker_id != blocked_id
  );

CREATE POLICY "Users can delete their blocks"
  ON public.user_blocks FOR DELETE
  USING ((SELECT auth.uid())::text = blocker_id);

-- Conversations Policies
CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id 
        AND user_id = (SELECT auth.uid())::text
        AND left_at IS NULL
    )
  );

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can delete their conversations"
  ON public.conversations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id AND user_id = (SELECT auth.uid())::text
    )
  );

-- Conversation Participants Policies
CREATE POLICY "Users can view conversation participants"
  ON public.conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id 
        AND cp.user_id = (SELECT auth.uid())::text
        AND cp.left_at IS NULL
    )
  );

CREATE POLICY "Users can join conversations"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND (
      user_id = (SELECT auth.uid())::text OR
      EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conversation_participants.conversation_id
          AND user_id = (SELECT auth.uid())::text
      )
    ) AND
    NOT EXISTS (
      SELECT 1 FROM public.user_blocks
      WHERE (blocker_id = user_id AND blocked_id = (SELECT auth.uid())::text)
    )
  );

CREATE POLICY "Users can update their own participant record"
  ON public.conversation_participants FOR UPDATE
  USING ((SELECT auth.uid())::text = user_id);

CREATE POLICY "Users can leave conversations"
  ON public.conversation_participants FOR DELETE
  USING ((SELECT auth.uid())::text = user_id);

-- Messages Policies
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id 
        AND user_id = (SELECT auth.uid())::text
        AND left_at IS NULL
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    (SELECT auth.uid())::text = sender_id AND
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id 
        AND user_id = (SELECT auth.uid())::text
        AND left_at IS NULL
    ) AND
    NOT EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      JOIN public.user_blocks ub ON (
        (ub.blocker_id = cp.user_id AND ub.blocked_id = sender_id) OR
        (ub.blocker_id = sender_id AND ub.blocked_id = cp.user_id)
      )
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id != sender_id
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (
    (SELECT auth.uid())::text = sender_id AND
    deleted_at IS NULL AND
    created_at > NOW() - INTERVAL '24 hours'
  );

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING ((SELECT auth.uid())::text = sender_id);

-- ============================================================================
-- FUNCTIONS (Enhanced with Advanced Features)
-- ============================================================================

-- Prevent self-follow
CREATE OR REPLACE FUNCTION prevent_self_follow()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.follower_id = NEW.following_id THEN
    RAISE EXCEPTION 'Users cannot follow themselves';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
    UPDATE public.forum_users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE public.forum_users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    UPDATE public.forum_users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE public.forum_users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
    UPDATE public.forum_users SET follower_count = GREATEST(0, follower_count - 1) WHERE id = NEW.following_id;
    UPDATE public.forum_users SET following_count = GREATEST(0, following_count - 1) WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
    UPDATE public.forum_users SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
    UPDATE public.forum_users SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    updated_at = NEW.created_at,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update unread count
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    UPDATE public.conversation_participants
    SET unread_count = unread_count + 1
    WHERE conversation_id = NEW.conversation_id 
      AND user_id != NEW.sender_id
      AND left_at IS NULL
      AND NOT is_muted;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update message edited timestamp
CREATE OR REPLACE FUNCTION update_message_edited_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.content != NEW.content THEN
    NEW.edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if user can message another user
CREATE OR REPLACE FUNCTION can_message_user(target_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id TEXT;
  target_settings TEXT;
  is_following BOOLEAN;
  is_blocked BOOLEAN;
BEGIN
  current_user_id := auth.uid()::text;
  
  -- Check if blocked
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = target_user_id AND blocked_id = current_user_id)
       OR (blocker_id = current_user_id AND blocked_id = target_user_id)
  ) INTO is_blocked;
  
  IF is_blocked THEN
    RETURN FALSE;
  END IF;
  
  -- Get target user's message settings
  SELECT allow_messages_from INTO target_settings
  FROM public.forum_users
  WHERE id = target_user_id;
  
  IF target_settings = 'everyone' THEN
    RETURN TRUE;
  ELSIF target_settings = 'none' THEN
    RETURN FALSE;
  ELSIF target_settings = 'following' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_follows
      WHERE follower_id = current_user_id
        AND following_id = target_user_id
        AND status = 'accepted'
    ) INTO is_following;
    
    RETURN is_following;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get mutual followers
CREATE OR REPLACE FUNCTION get_mutual_followers(target_user_id TEXT)
RETURNS TABLE (
  user_id TEXT,
  username TEXT,
  avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fu.id,
    fu.username,
    fu.avatar
  FROM public.forum_users fu
  WHERE fu.id IN (
    SELECT uf1.follower_id
    FROM public.user_follows uf1
    WHERE uf1.following_id = auth.uid()::text
      AND uf1.status = 'accepted'
    INTERSECT
    SELECT uf2.follower_id
    FROM public.user_follows uf2
    WHERE uf2.following_id = target_user_id
      AND uf2.status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get or create conversation with user
CREATE OR REPLACE FUNCTION get_conversation_with_user(target_user_id TEXT)
RETURNS TEXT AS $$
DECLARE
  conv_id TEXT;
  current_user_id TEXT;
BEGIN
  current_user_id := auth.uid()::text;
  
  -- Check if conversation exists
  SELECT cp1.conversation_id INTO conv_id
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2 
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = current_user_id
    AND cp2.user_id = target_user_id
    AND cp1.left_at IS NULL
    AND cp2.left_at IS NULL
  LIMIT 1;
  
  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;
  
  -- Check if user can message
  IF NOT can_message_user(target_user_id) THEN
    RAISE EXCEPTION 'You cannot message this user';
  END IF;
  
  -- Create new conversation
  INSERT INTO public.conversations DEFAULT VALUES
  RETURNING id INTO conv_id;
  
  -- Add participants
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES 
    (conv_id, current_user_id),
    (conv_id, target_user_id);
  
  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_read(conv_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.conversation_participants
  SET 
    last_read_at = NOW(),
    unread_count = 0
  WHERE conversation_id = conv_id
    AND user_id = auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Delete conversation (soft delete)
CREATE OR REPLACE FUNCTION delete_conversation(conv_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.conversation_participants
  SET left_at = NOW()
  WHERE conversation_id = conv_id
    AND user_id = auth.uid()::text;
    
  -- If all participants left, mark conversation as archived
  UPDATE public.conversations
  SET is_archived = true
  WHERE id = conv_id
    AND NOT EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conv_id AND left_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Block user
CREATE OR REPLACE FUNCTION block_user(target_user_id TEXT)
RETURNS VOID AS $$
DECLARE
  current_user_id TEXT;
BEGIN
  current_user_id := auth.uid()::text;
  
  -- Insert block
  INSERT INTO public.user_blocks (blocker_id, blocked_id)
  VALUES (current_user_id, target_user_id)
  ON CONFLICT DO NOTHING;
  
  -- Remove follow relationships
  DELETE FROM public.user_follows
  WHERE (follower_id = current_user_id AND following_id = target_user_id)
     OR (follower_id = target_user_id AND following_id = current_user_id);
  
  -- Update blocked count
  UPDATE public.forum_users
  SET blocked_count = blocked_count + 1
  WHERE id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Unblock user
CREATE OR REPLACE FUNCTION unblock_user(target_user_id TEXT)
RETURNS VOID AS $$
DECLARE
  current_user_id TEXT;
BEGIN
  current_user_id := auth.uid()::text;
  
  DELETE FROM public.user_blocks
  WHERE blocker_id = current_user_id
    AND blocked_id = target_user_id;
  
  -- Update blocked count
  UPDATE public.forum_users
  SET blocked_count = GREATEST(0, blocked_count - 1)
  WHERE id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(target_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = auth.uid()::text AND blocked_id = target_user_id)
       OR (blocker_id = target_user_id AND blocked_id = auth.uid()::text)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

CREATE TRIGGER trigger_prevent_self_follow
  BEFORE INSERT OR UPDATE ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION prevent_self_follow();

CREATE TRIGGER trigger_update_follower_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

CREATE TRIGGER trigger_update_unread_count
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_unread_count();

CREATE TRIGGER trigger_update_message_edited
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_message_edited_timestamp();

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

DO $$
BEGIN
  -- Add tables to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_follows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_blocks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_blocks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;

-- ============================================================================
-- UTILITY VIEWS (Optional - for easier querying)
-- ============================================================================

CREATE OR REPLACE VIEW user_follow_stats AS
SELECT 
  fu.id,
  fu.username,
  fu.follower_count,
  fu.following_count,
  fu.is_private,
  (
    SELECT COUNT(*) FROM public.user_follows
    WHERE following_id = fu.id AND status = 'pending'
  ) as pending_requests
FROM public.forum_users fu;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Enhanced Follow and Messaging System installed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'New Features:';
  RAISE NOTICE '- User blocking system';
  RAISE NOTICE '- Message privacy settings (everyone/following/none)';
  RAISE NOTICE '- Conversation muting and pinning';
  RAISE NOTICE '- Message replies and threading';
  RAISE NOTICE '- Message editing (24h window)';
  RAISE NOTICE '- Conversation archiving';
  RAISE NOTICE '- Mutual followers detection';
  RAISE NOTICE '- Enhanced security and validation';
  RAISE NOTICE '- Optimized indexes for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created: 5';
  RAISE NOTICE 'Functions created: 12';
  RAISE NOTICE 'Triggers created: 5';
  RAISE NOTICE 'Indexes created: 20+';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to use! 🚀';
END $$;
