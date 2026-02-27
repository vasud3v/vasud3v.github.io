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

async function testWithAuthSession() {
  console.log('\n=== Testing Bookmark with Auth Session ===\n');
  
  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.log('❌ No active session found');
    console.log('   You need to be logged in to the app');
    console.log('   The script cannot access your browser session\n');
    console.log('SOLUTION:');
    console.log('1. Make sure you are logged in to the app in your browser');
    console.log('2. The issue is that RLS policies check auth.uid()');
    console.log('3. This script uses anon key which has no auth context');
    console.log('4. You MUST run the SQL to disable RLS or fix policies\n');
    return;
  }
  
  console.log('✅ Found active session');
  console.log('   User ID:', session.user.id);
  console.log('   Email:', session.user.email);
  
  // Try to insert bookmark
  const { data: threads } = await supabase
    .from('threads')
    .select('id, title')
    .limit(1);
  
  if (!threads || threads.length === 0) {
    console.log('❌ No threads found');
    return;
  }
  
  const testThread = threads[0];
  console.log('\n📌 Testing with thread:', testThread.title);
  
  const { data, error } = await supabase
    .from('thread_bookmarks')
    .insert({
      thread_id: testThread.id,
      user_id: session.user.id,
    })
    .select();
  
  if (error) {
    console.log('\n❌ Insert failed:', error.message);
    console.log('   Code:', error.code);
    
    if (error.code === '42501') {
      console.log('\n🔒 RLS POLICY IS BLOCKING THE INSERT');
      console.log('\nYou need to run ONE of these SQL commands in Supabase:\n');
      console.log('OPTION 1 - Disable RLS (for testing):');
      console.log('  ALTER TABLE thread_bookmarks DISABLE ROW LEVEL SECURITY;\n');
      console.log('OPTION 2 - Fix RLS policies (proper solution):');
      console.log('  See FIX_BOOKMARKS_PROPER.sql\n');
    }
  } else {
    console.log('\n✅ Bookmark inserted successfully!');
    console.log('   Data:', data);
    
    // Clean up
    await supabase
      .from('thread_bookmarks')
      .delete()
      .eq('user_id', session.user.id)
      .eq('thread_id', testThread.id);
    console.log('✅ Test bookmark cleaned up');
  }
}

testWithAuthSession().catch(console.error);
