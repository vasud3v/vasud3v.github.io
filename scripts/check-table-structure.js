import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStructure() {
  console.log('\n=== Checking Table Structure ===\n');
  
  // Check current user's auth.uid()
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    console.log('Current authenticated user:');
    console.log('  auth.uid():', user.id);
    console.log('  Type:', typeof user.id);
    console.log('');
  } else {
    console.log('⚠️  No authenticated user - please log in first\n');
  }
  
  // Check forum_users
  console.log('Checking forum_users table...');
  const { data: forumUsers, error: fuError } = await supabase
    .from('forum_users')
    .select('id, username')
    .limit(1);
  
  if (forumUsers && forumUsers.length > 0) {
    console.log('  Sample user_id:', forumUsers[0].id);
    console.log('  Type:', typeof forumUsers[0].id);
    console.log('');
  }
  
  // Check thread_bookmarks structure
  console.log('Checking thread_bookmarks table...');
  const { data: bookmarks, error: bmError } = await supabase
    .from('thread_bookmarks')
    .select('*')
    .limit(1);
  
  if (bmError) {
    console.log('  Error:', bmError.message);
  } else if (bookmarks && bookmarks.length > 0) {
    console.log('  Sample bookmark:', bookmarks[0]);
    console.log('  user_id type:', typeof bookmarks[0].user_id);
  } else {
    console.log('  No bookmarks found (table is empty)');
  }
  
  console.log('\n=== Comparison ===');
  if (user && forumUsers && forumUsers.length > 0) {
    console.log('auth.uid():', user.id);
    console.log('forum_users.id:', forumUsers[0].id);
    console.log('Match:', user.id === forumUsers[0].id);
  }
  
  console.log('\n');
}

checkStructure().catch(console.error);
