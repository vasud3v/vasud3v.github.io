import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnoseBookmarkIssue() {
  console.log('🔍 Diagnosing Bookmark System Issue...\n');

  try {
    // 1. Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError.message);
      return;
    }

    if (!session) {
      console.log('⚠️  No active session found. Please log in first.');
      console.log('\nTo test with authentication:');
      console.log('1. Log in to your app in the browser');
      console.log('2. Open browser console and run: localStorage.getItem("supabase.auth.token")');
      console.log('3. Copy the access_token value');
      console.log('4. Set it as SUPABASE_ACCESS_TOKEN in .env.local');
      return;
    }

    const userId = session.user.id;
    console.log('✅ Authenticated as:', session.user.email);
    console.log('   User ID:', userId);
    console.log('');

    // 2. Check if user exists in forum_users table
    console.log('📋 Checking forum_users table...');
    const { data: forumUser, error: forumUserError } = await supabase
      .from('forum_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (forumUserError) {
      console.error('❌ Error querying forum_users:', forumUserError.message);
      return;
    }

    if (!forumUser) {
      console.log('❌ ISSUE FOUND: User does not exist in forum_users table!');
      console.log('');
      console.log('This is the root cause. The bookmark system requires a forum_users record.');
      console.log('');
      console.log('To fix this, run:');
      console.log('  node scripts/sync-current-user.js');
      console.log('');
      return;
    }

    console.log('✅ User exists in forum_users:');
    console.log('   Username:', forumUser.username);
    console.log('   Role:', forumUser.role);
    console.log('');

    // 3. Check thread_bookmarks table structure
    console.log('📋 Checking thread_bookmarks table...');
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('thread_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .limit(5);

    if (bookmarksError) {
      console.error('❌ Error querying thread_bookmarks:', bookmarksError.message);
      console.log('   This might indicate a table structure issue or RLS policy problem.');
      return;
    }

    console.log(`✅ Can query thread_bookmarks (found ${bookmarks.length} bookmarks)`);
    console.log('');

    // 4. Test inserting a bookmark
    console.log('🧪 Testing bookmark insert...');
    
    // Get a thread to test with
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select('id, title')
      .limit(1)
      .single();

    if (threadsError || !threads) {
      console.log('⚠️  No threads found to test with');
      return;
    }

    const testThreadId = threads.id;
    console.log('   Using thread:', threads.title);

    // Try to insert
    const { data: insertData, error: insertError } = await supabase
      .from('thread_bookmarks')
      .insert({
        thread_id: testThreadId,
        user_id: userId,
      })
      .select();

    if (insertError) {
      if (insertError.code === '23505') {
        console.log('✅ Bookmark already exists (this is fine)');
      } else if (insertError.code === '23503') {
        console.log('❌ ISSUE FOUND: Foreign key constraint violation');
        console.log('   This means either:');
        console.log('   - The thread_id doesn\'t exist in threads table');
        console.log('   - The user_id doesn\'t exist in forum_users table');
        console.log('   Error:', insertError.message);
      } else if (insertError.code === '42501') {
        console.log('❌ ISSUE FOUND: Permission denied (RLS policy issue)');
        console.log('   Error:', insertError.message);
      } else {
        console.log('❌ Insert failed:', insertError.message);
        console.log('   Code:', insertError.code);
      }
      return;
    }

    console.log('✅ Successfully inserted test bookmark');
    console.log('');

    // Clean up test bookmark
    await supabase
      .from('thread_bookmarks')
      .delete()
      .eq('thread_id', testThreadId)
      .eq('user_id', userId);

    console.log('✅ All checks passed! Bookmark system should be working.');
    console.log('');
    console.log('If you\'re still seeing issues:');
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Check Network tab for failed API requests');
    console.log('3. Verify you\'re using the same user account');
    console.log('4. Try clearing browser cache and localStorage');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

diagnoseBookmarkIssue();
