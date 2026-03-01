import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixSupabaseStorageBanners() {
  console.log('🔍 Finding threads with Supabase Storage banners...\n');

  try {
    // Find all threads with banners pointing to Supabase Storage
    const { data: threads, error } = await supabase
      .from('threads')
      .select('id, title, banner')
      .not('banner', 'is', null)
      .like('banner', '%supabase.co/storage%');

    if (error) {
      console.error('❌ Error fetching threads:', error);
      return;
    }

    if (!threads || threads.length === 0) {
      console.log('✅ No threads found with Supabase Storage banners');
      return;
    }

    console.log(`📊 Found ${threads.length} thread(s) with Supabase Storage banners:\n`);

    for (const thread of threads) {
      console.log(`Thread: ${thread.title}`);
      console.log(`  ID: ${thread.id}`);
      console.log(`  Banner URL: ${thread.banner}`);
      console.log('');
    }

    console.log('\n⚠️  Options to fix:');
    console.log('1. Set banner to NULL (remove broken banners)');
    console.log('2. Keep as-is and let users re-upload');
    console.log('\nRecommendation: Set to NULL so users can re-upload working banners\n');

    // Uncomment the following to automatically remove broken banners:
    /*
    console.log('🔧 Removing broken banners...\n');
    
    for (const thread of threads) {
      const { error: updateError } = await supabase
        .from('threads')
        .update({ banner: null })
        .eq('id', thread.id);

      if (updateError) {
        console.error(`❌ Failed to update thread ${thread.id}:`, updateError);
      } else {
        console.log(`✅ Removed banner from: ${thread.title}`);
      }
    }
    
    console.log('\n✅ All broken banners removed!');
    */

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixSupabaseStorageBanners();
