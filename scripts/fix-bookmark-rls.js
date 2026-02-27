import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBookmarkRLS() {
  console.log('\n=== Fixing Bookmark RLS Policies ===\n');
  
  console.log('⚠️  IMPORTANT: This script needs to be run with a service role key, not anon key.');
  console.log('⚠️  The anon key cannot modify RLS policies.\n');
  console.log('Please run the following SQL in your Supabase SQL Editor:\n');
  console.log('-----------------------------------------------------------\n');
  
  const sql = `
-- Fix RLS policies for thread_bookmarks table

-- Enable RLS if not already enabled
ALTER TABLE thread_bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON thread_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON thread_bookmarks;
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON thread_bookmarks;

-- Create INSERT policy
CREATE POLICY "Users can insert their own bookmarks"
ON thread_bookmarks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create DELETE policy
CREATE POLICY "Users can delete their own bookmarks"
ON thread_bookmarks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create SELECT policy
CREATE POLICY "Users can view their own bookmarks"
ON thread_bookmarks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Also fix thread_watches table (same issue likely exists)
ALTER TABLE thread_watches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own watches" ON thread_watches;
DROP POLICY IF EXISTS "Users can delete their own watches" ON thread_watches;
DROP POLICY IF EXISTS "Users can view their own watches" ON thread_watches;

CREATE POLICY "Users can insert their own watches"
ON thread_watches
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watches"
ON thread_watches
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own watches"
ON thread_watches
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
`;

  console.log(sql);
  console.log('\n-----------------------------------------------------------\n');
  console.log('Steps to fix:');
  console.log('1. Go to https://app.supabase.com');
  console.log('2. Select your project');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste the SQL above');
  console.log('5. Click "Run" to execute');
  console.log('\nAfter running the SQL, test bookmarks again!\n');
}

fixBookmarkRLS().catch(console.error);
