-- Create function to increment thread view count
CREATE OR REPLACE FUNCTION increment_thread_views(thread_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE threads
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = thread_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_thread_views(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_thread_views(TEXT) TO anon;
