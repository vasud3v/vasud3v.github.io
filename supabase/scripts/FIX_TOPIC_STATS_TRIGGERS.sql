-- ============================================================================
-- Fix Topic Stats - Auto-update thread_count, post_count, and last_activity
-- ============================================================================
-- This script creates triggers to automatically update topic statistics
-- when threads and posts are created, updated, or deleted.

-- ============================================================================
-- Function: Update topic stats when thread is created/deleted
-- ============================================================================
CREATE OR REPLACE FUNCTION update_topic_thread_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment thread count and update last activity
    UPDATE topics
    SET 
      thread_count = thread_count + 1,
      last_activity = NEW.created_at,
      last_post_by = NEW.author_id
    WHERE id = NEW.topic_id AND NEW.topic_id IS NOT NULL;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement thread count
    UPDATE topics
    SET thread_count = GREATEST(thread_count - 1, 0)
    WHERE id = OLD.topic_id AND OLD.topic_id IS NOT NULL;
    
    -- Update last_activity to the most recent thread in this topic
    UPDATE topics t
    SET last_activity = COALESCE(
      (SELECT MAX(last_reply_at) FROM threads WHERE topic_id = t.id),
      t.last_activity
    )
    WHERE id = OLD.topic_id AND OLD.topic_id IS NOT NULL;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- If thread moved to different topic
    IF OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
      -- Decrement old topic
      IF OLD.topic_id IS NOT NULL THEN
        UPDATE topics
        SET thread_count = GREATEST(thread_count - 1, 0)
        WHERE id = OLD.topic_id;
      END IF;
      
      -- Increment new topic
      IF NEW.topic_id IS NOT NULL THEN
        UPDATE topics
        SET 
          thread_count = thread_count + 1,
          last_activity = NEW.last_reply_at,
          last_post_by = NEW.last_reply_by_id
        WHERE id = NEW.topic_id;
      END IF;
    END IF;
    
    -- Update last_activity if thread was updated
    IF NEW.last_reply_at > OLD.last_reply_at AND NEW.topic_id IS NOT NULL THEN
      UPDATE topics
      SET 
        last_activity = NEW.last_reply_at,
        last_post_by = NEW.last_reply_by_id
      WHERE id = NEW.topic_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- Function: Update topic post count when post is created/deleted
-- ============================================================================
CREATE OR REPLACE FUNCTION update_topic_post_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_topic_id TEXT;
BEGIN
  -- Get the topic_id from the thread
  IF TG_OP = 'INSERT' THEN
    SELECT topic_id INTO v_topic_id FROM threads WHERE id = NEW.thread_id;
    
    IF v_topic_id IS NOT NULL THEN
      UPDATE topics
      SET 
        post_count = post_count + 1,
        last_activity = NEW.created_at,
        last_post_by = NEW.author_id
      WHERE id = v_topic_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    SELECT topic_id INTO v_topic_id FROM threads WHERE id = OLD.thread_id;
    
    IF v_topic_id IS NOT NULL THEN
      UPDATE topics
      SET post_count = GREATEST(post_count - 1, 0)
      WHERE id = v_topic_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- Drop existing triggers if they exist
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_update_topic_thread_stats ON threads;
DROP TRIGGER IF EXISTS trigger_update_topic_post_stats ON posts;

-- ============================================================================
-- Create triggers
-- ============================================================================

-- Trigger for thread changes
CREATE TRIGGER trigger_update_topic_thread_stats
  AFTER INSERT OR UPDATE OR DELETE ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_thread_stats();

-- Trigger for post changes
CREATE TRIGGER trigger_update_topic_post_stats
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_post_stats();

-- ============================================================================
-- Recalculate all topic stats from scratch (one-time fix)
-- ============================================================================
DO $$
DECLARE
  topic_record RECORD;
  thread_count_val INTEGER;
  post_count_val INTEGER;
  last_activity_val TIMESTAMPTZ;
  last_post_by_val TEXT;
BEGIN
  RAISE NOTICE 'Recalculating topic statistics...';
  
  FOR topic_record IN SELECT id FROM topics LOOP
    -- Count threads in this topic
    SELECT COUNT(*) INTO thread_count_val
    FROM threads
    WHERE topic_id = topic_record.id;
    
    -- Count posts in threads of this topic
    SELECT COUNT(p.*) INTO post_count_val
    FROM posts p
    INNER JOIN threads t ON p.thread_id = t.id
    WHERE t.topic_id = topic_record.id;
    
    -- Get last activity and the user who posted it
    SELECT last_reply_at, last_reply_by_id INTO last_activity_val, last_post_by_val
    FROM threads
    WHERE topic_id = topic_record.id
    ORDER BY last_reply_at DESC NULLS LAST
    LIMIT 1;
    
    -- Update the topic
    UPDATE topics
    SET 
      thread_count = COALESCE(thread_count_val, 0),
      post_count = COALESCE(post_count_val, 0),
      last_activity = COALESCE(last_activity_val, NOW()),
      last_post_by = last_post_by_val
    WHERE id = topic_record.id;
    
    RAISE NOTICE 'Updated topic %: % threads, % posts', 
      topic_record.id, thread_count_val, post_count_val;
  END LOOP;
  
  RAISE NOTICE '✅ Topic statistics recalculated successfully';
END $$;

-- ============================================================================
-- Verify the setup
-- ============================================================================
DO $$
BEGIN
  -- Check if triggers exist
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_topic_thread_stats'
  ) THEN
    RAISE NOTICE '✅ Trigger trigger_update_topic_thread_stats created';
  ELSE
    RAISE WARNING '❌ Trigger trigger_update_topic_thread_stats NOT created';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_topic_post_stats'
  ) THEN
    RAISE NOTICE '✅ Trigger trigger_update_topic_post_stats created';
  ELSE
    RAISE WARNING '❌ Trigger trigger_update_topic_post_stats NOT created';
  END IF;
END $$;

-- ============================================================================
-- Show current topic stats
-- ============================================================================
SELECT 
  t.id,
  t.name,
  t.thread_count,
  t.post_count,
  t.last_activity,
  t.last_post_by,
  c.name as category_name
FROM topics t
LEFT JOIN categories c ON t.category_id = c.id
ORDER BY t.category_id, t.name;
