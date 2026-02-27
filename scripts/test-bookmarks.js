/**
 * Bookmark System Testing Script
 * 
 * This script tests the bookmark functionality to identify issues
 * 
 * Usage: node scripts/test-bookmarks.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBookmarks() {
  console.log('🧪 Testing Bookmark System\n');

  // Test 1: Check if table exists
  console.log('1️⃣ Checking if thread_bookmarks table exists...');
  const { data: tables, error: tablesError } = await supabase
    .from('thread_bookmarks')
    .select('*')
    .limit(1);
  
  if (tablesError) {
    console.error('❌ Table check failed:', tablesError.message);
    if (tablesError.code === '42P01') {
      console.error('   Table does not exist!');
    }
    return;
  }
  console.log('✅ Table exists\n');

  // Test 2: Check authentication
  console.log('2️⃣ Checking authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ Not authenticated');
    console.log('   Please log in to the application first');
    return;
  }
  console.log('✅ Authenticated as:', user.id);
  console.log('   Email:', user.email, '\n');

  // Test 3: Check if user exists in forum_users
  console.log('3️⃣ Checking if user exists in forum_users...');
  const { data: forumUser, error: forumUserError } = await supabase
    .from('forum_users')
    .select('id, username')
    .eq('id', user.id)
    .maybeSingle();
  
  if (forumUserError) {
    console.error('❌ Error checking forum_users:', forumUserError.message);
    return;
  }
  
  if (!forumUser) {
    console.error('❌ User not found in forum_users table');
    console.log('   User needs to be created in forum_users first');
    return;
  }
  console.log('✅ Forum user exists:', forumUser.username, '\n');

  // Test 4: Get a thread to test with
  console.log('4️⃣ Finding a thread to test with...');
  const { data: threads, error: threadsError } = await supabase
    .from('threads')
    .select('id, title')
    .limit(1)
    .single();
  
  if (threadsError || !threads) {
    console.error('❌ No threads found to test with');
    return;
  }
  console.log('✅ Using thread:', threads.title);
  console.log('   Thread ID:', threads.id, '\n');

  const testThreadId = threads.id;

  // Test 5: Check current bookmarks
  console.log('5️⃣ Checking current bookmarks...');
  const { data: currentBookmarks, error: currentError } = await supabase
    .from('thread_bookmarks')
    .select('*')
    .eq('user_id', user.id);
  
  if (currentError) {
    console.error('❌ Error fetching bookmarks:', currentError.message);
    console.error('   Code:', currentError.code);
    console.error('   Details:', currentError.details);
    return;
  }
  console.log('✅ Current bookmarks:', currentBookmarks?.length || 0, '\n');

  // Test 6: Try to add a bookmark
  console.log('6️⃣ Attempting to add bookmark...');
  const { data: insertData, error: insertError } = await supabase
    .from('thread_bookmarks')
    .insert({
      user_id: user.id,
      thread_id: testThreadId,
    })
    .select();
  
  if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
    console.error('   Code:', insertError.code);
    console.error('   Details:', insertError.details);
    console.error('   Hint:', insertError.hint);
    
    // Check if it's a duplicate
    if (insertError.code === '23505') {
      console.log('   (This is expected if bookmark already exists)');
    }
  } else {
    console.log('✅ Bookmark added successfully');
    console.log('   Data:', insertData, '\n');
  }

  // Test 7: Verify bookmark exists
  console.log('7️⃣ Verifying bookmark exists...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('thread_bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .eq('thread_id', testThreadId)
    .maybeSingle();
  
  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
    return;
  }
  
  if (verifyData) {
    console.log('✅ Bookmark verified');
    console.log('   Created at:', verifyData.created_at, '\n');
  } else {
    console.error('❌ Bookmark not found after insert');
    return;
  }

  // Test 8: Try to delete bookmark
  console.log('8️⃣ Attempting to delete bookmark...');
  const { data: deleteData, error: deleteError } = await supabase
    .from('thread_bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('thread_id', testThreadId)
    .select();
  
  if (deleteError) {
    console.error('❌ Delete failed:', deleteError.message);
    console.error('   Code:', deleteError.code);
    console.error('   Details:', deleteError.details);
    return;
  }
  console.log('✅ Bookmark deleted successfully');
  console.log('   Deleted:', deleteData?.length || 0, 'row(s)\n');

  // Test 9: Verify bookmark is gone
  console.log('9️⃣ Verifying bookmark is deleted...');
  const { data: finalCheck, error: finalError } = await supabase
    .from('thread_bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .eq('thread_id', testThreadId)
    .maybeSingle();
  
  if (finalError) {
    console.error('❌ Final check failed:', finalError.message);
    return;
  }
  
  if (!finalCheck) {
    console.log('✅ Bookmark successfully removed\n');
  } else {
    console.error('❌ Bookmark still exists after delete');
    return;
  }

  // Test 10: Check RLS policies
  console.log('🔟 Checking RLS policies...');
  const { data: policies, error: policiesError } = await supabase
    .rpc('get_policies', { table_name: 'thread_bookmarks' })
    .catch(() => ({ data: null, error: { message: 'RPC not available' } }));
  
  if (policiesError) {
    console.log('⚠️  Could not check RLS policies (this is okay)');
  } else if (policies) {
    console.log('✅ RLS policies found:', policies.length);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All bookmark tests passed!');
  console.log('='.repeat(60));
  console.log('\nThe bookmark system is working correctly.');
  console.log('If bookmarks are not working in the UI, check:');
  console.log('1. Browser console for errors');
  console.log('2. Network tab for failed requests');
  console.log('3. User authentication state');
  console.log('4. Component state updates\n');
}

testBookmarks().catch(error => {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
});
