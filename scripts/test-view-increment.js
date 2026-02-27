import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testViewIncrement() {
  console.log('🔍 Testing view increment functionality...\n');

  try {
    // 1. Get a sample thread
    console.log('1️⃣ Fetching a sample thread...');
    const { data: threads, error: fetchError } = await supabase
      .from('threads')
      .select('id, title, view_count')
      .limit(1);

    if (fetchError) {
      console.error('❌ Error fetching thread:', fetchError);
      return;
    }

    if (!threads || threads.length === 0) {
      console.error('❌ No threads found in database');
      return;
    }

    const thread = threads[0];
    console.log(`✅ Found thread: "${thread.title}"`);
    console.log(`   ID: ${thread.id}`);
    console.log(`   Current view count: ${thread.view_count}\n`);

    // 2. Test the increment function
    console.log('2️⃣ Testing increment_thread_views function...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('increment_thread_views', {
      thread_id: thread.id
    });

    if (rpcError) {
      console.error('❌ Error calling increment_thread_views:', rpcError);
      console.error('   Code:', rpcError.code);
      console.error('   Message:', rpcError.message);
      console.error('   Details:', rpcError.details);
      console.error('   Hint:', rpcError.hint);
      
      if (rpcError.code === '42883') {
        console.error('\n⚠️  Function does not exist! You need to run the migration:');
        console.error('   Run this SQL in your Supabase SQL Editor:');
        console.error('   supabase/scripts/FIX_VIEW_INCREMENT.sql');
      }
      return;
    }

    console.log('✅ Function called successfully\n');

    // 3. Verify the view count increased
    console.log('3️⃣ Verifying view count increased...');
    const { data: updatedThread, error: verifyError } = await supabase
      .from('threads')
      .select('view_count')
      .eq('id', thread.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }

    console.log(`   Previous view count: ${thread.view_count}`);
    console.log(`   New view count: ${updatedThread.view_count}`);

    if (updatedThread.view_count > thread.view_count) {
      console.log('✅ View count incremented successfully!\n');
    } else {
      console.log('❌ View count did not increase\n');
    }

    // 4. Check if function exists
    console.log('4️⃣ Checking if function exists in database...');
    const { data: functions, error: funcError } = await supabase.rpc('pg_get_functiondef', {
      funcid: 'increment_thread_views'
    }).catch(() => ({ data: null, error: null }));

    if (funcError || !functions) {
      console.log('⚠️  Could not verify function existence (this is normal)');
      console.log('   If the function call above failed, run:');
      console.log('   supabase/scripts/FIX_VIEW_INCREMENT.sql\n');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testViewIncrement();
