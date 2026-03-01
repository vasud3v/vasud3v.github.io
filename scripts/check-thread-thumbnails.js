import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkThreadThumbnails() {
  console.log('\n📊 Checking Thread Thumbnails in Database...\n');

  try {
    // Get all threads with their thumbnails
    const { data: threads, error } = await supabase
      .from('threads')
      .select('id, title, thumbnail, author_id, author:forum_users!threads_author_id_fkey(username)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (!threads || threads.length === 0) {
      console.log('⚠️  No threads found in database');
      return;
    }

    console.log(`✅ Found ${threads.length} recent threads:\n`);
    
    threads.forEach((thread, index) => {
      const author = Array.isArray(thread.author) ? thread.author[0] : thread.author;
      console.log(`${index + 1}. "${thread.title}"`);
      console.log(`   Author: ${author?.username || 'Unknown'}`);
      console.log(`   Thumbnail: ${thread.thumbnail ? '✓ YES' : '✗ NO'}`);
      if (thread.thumbnail) {
        console.log(`   URL: ${thread.thumbnail.substring(0, 80)}...`);
      }
      console.log('');
    });

    // Count threads with thumbnails
    const { count: withThumbnails } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .not('thumbnail', 'is', null);

    const { count: total } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📈 Statistics:`);
    console.log(`   Total threads: ${total}`);
    console.log(`   With thumbnails: ${withThumbnails}`);
    console.log(`   Without thumbnails: ${total - withThumbnails}`);

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkThreadThumbnails();
