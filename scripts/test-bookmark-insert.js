import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBookmarkInsert() {
  const userId = '18910603-bbff-4144-9414-20b019fc4b0a';
  
  console.log('\n=== Testing Bookmark Insert ===\n');
  
  // 1. Check if user exists in forum_users
  console.log('1. Checking if user exists in forum_users...');
  const { data: forumUser, error: userError } = await supabase
    .from('forum_users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (userError) {
    console.error('❌ User not found in forum_users:', userError.message);
    return;
  }
  console.log('✅ User found:', forumUser.username);
  
  // 2. Get a thread to bookmark
  console.log('\n2. Getting a thread to test with...');
  const { data: threads, error: threadsError } = await supabase
    .from('threads')
    .select('id, title')
    .limit(1);
  
  if (threadsError || !threads || threads.length === 0) {
    console.error('❌ No threads found');
    return;
  }
  
  const testThread = threads[0];
  console.log('✅ Using thread:', testThread.title);
  console.log('   Thread ID:', testThread.id);
  
  // 3. Try to insert a bookmark
  console.log('\n3. Attempting to insert bookmark...');
  const { data: insertData, error: insertError } = await supabase
    .from('thread_bookmarks')
    .insert({
      thread_id: testThread.id,
      user_id: userId,
    })
    .select();
  
  if (insertError) {
    console.error('❌ Insert failed:', insertError);
    console.error('   Code:', insertError.code);
    console.error('   Details:', insertError.details);
    console.error('   Hint:', insertError.hint);
    return;
  }
  
  console.log('✅ Bookmark inserted successfully!');
  console.log('   Data:', insertData);
  
  // 4. Verify it's in the database
  console.log('\n4. Verifying bookmark in database...');
  const { data: bookmarks, error: selectError } = await supabase
    .from('thread_bookmarks')
    .select('*')
    .eq('user_id', userId)
    .eq('thread_id', testThread.id);
  
  if (selectError) {
    console.error('❌ Select failed:', selectError.message);
    return;
  }
  
  if (bookmarks && bookmarks.length > 0) {
    console.log('✅ Bookmark verified in database!');
    console.log('   Count:', bookmarks.length);
  } else {
    console.log('❌ Bookmark not found in database after insert!');
  }
  
  // 5. Clean up - delete the test bookmark
  console.log('\n5. Cleaning up test bookmark...');
  const { error: deleteError } = await supabase
    .from('thread_bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('thread_id', testThread.id);
  
  if (deleteError) {
    console.error('❌ Delete failed:', deleteError.message);
  } else {
    console.log('✅ Test bookmark deleted');
  }
  
  console.log('\n=== Test Complete ===\n');
}

testBookmarkInsert().catch(console.error);
