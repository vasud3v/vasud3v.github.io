import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookmarks() {
  console.log('Checking bookmarks in database...\n');

  // Get all bookmarks (as admin/anon can see all with current policy)
  const { data, error } = await supabase
    .from('thread_bookmarks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} bookmarks in database:\n`);
  
  if (data.length === 0) {
    console.log('No bookmarks found. The table is empty.');
  } else {
    data.forEach((bookmark, index) => {
      console.log(`${index + 1}. Bookmark ID: ${bookmark.id}`);
      console.log(`   User ID: ${bookmark.user_id}`);
      console.log(`   Thread ID: ${bookmark.thread_id}`);
      console.log(`   Created: ${bookmark.created_at}`);
      console.log('');
    });
  }
}

checkBookmarks();
