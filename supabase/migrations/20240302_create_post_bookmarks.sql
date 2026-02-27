-- Create post_bookmarks table
CREATE TABLE IF NOT EXISTS post_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES forum_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user_id ON post_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_post_id ON post_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_created_at ON post_bookmarks(created_at DESC);

-- Enable RLS
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (auth.uid() returns TEXT, user_id is TEXT)
CREATE POLICY "Users can view their own post bookmarks"
ON post_bookmarks FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own post bookmarks"
ON post_bookmarks FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own post bookmarks"
ON post_bookmarks FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- Add comment
COMMENT ON TABLE post_bookmarks IS 'Stores user bookmarks for individual posts';
