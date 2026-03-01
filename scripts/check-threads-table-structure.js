import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkThreadsTableStructure() {
  console.log('\n📊 Checking threads table structure...\n');

  try {
    // Get a sample thread with all fields
    const { data: thread, error } = await supabase
      .from('threads')
      .select('*')
      .eq('title', 'testing')
      .single();

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (!thread) {
      console.log('⚠️  No thread found with title "testing"');
      return;
    }

    console.log('✅ Thread data from database:');
    console.log('   Title:', thread.title);
    console.log('   Thumbnail:', thread.thumbnail);
    console.log('   Banner:', thread.banner);
    console.log('\n📋 All fields in thread:');
    Object.keys(thread).sort().forEach(key => {
      const value = thread[key];
      const preview = typeof value === 'string' && value.length > 50 
        ? value.substring(0, 50) + '...' 
        : value;
      console.log(`   ${key}: ${preview}`);
    });

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkThreadsTableStructure();
