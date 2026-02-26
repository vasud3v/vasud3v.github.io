import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: join(__dirname, '../.env.local') });

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllData() {
  console.log('🗑️  Clearing all forum data...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20240113_clear_all_data.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error executing migration:', error);
      
      // Fallback: Delete using Supabase client
      console.log('\n🔄 Attempting fallback deletion method...\n');
      
      // Delete in order - posts first, then threads
      console.log('Deleting posts...');
      const { error: postsError } = await supabase.from('posts').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      if (postsError) console.error('Posts error:', postsError);
      
      console.log('Deleting user interaction data...');
      await supabase.from('bookmarks').delete().gte('user_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('watched_threads').delete().gte('user_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('thread_votes').delete().gte('user_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('post_votes').delete().gte('user_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('thread_read_status').delete().gte('user_id', '00000000-0000-0000-0000-000000000000');
      
      console.log('Deleting threads...');
      const { error: threadsError } = await supabase.from('threads').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      if (threadsError) console.error('Threads error:', threadsError);
      
      console.log('Deleting categories...');
      const { error: categoriesError } = await supabase.from('categories').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      if (categoriesError) console.error('Categories error:', categoriesError);
      
      console.log('Deleting reputation and profile data...');
      await supabase.from('reputation_events').delete().gte('user_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('profile_customizations').delete().gte('user_id', '00000000-0000-0000-0000-000000000000');
      
      console.log('Deleting forum users...');
      const { error: usersError } = await supabase.from('forum_users').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      if (usersError) console.error('Users error:', usersError);
    }

    // Verify deletion
    console.log('\n📊 Verifying deletion...\n');
    
    const { count: threadCount } = await supabase.from('threads').select('*', { count: 'exact', head: true });
    const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
    const { count: categoryCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('forum_users').select('*', { count: 'exact', head: true });

    console.log(`Threads remaining: ${threadCount || 0}`);
    console.log(`Posts remaining: ${postCount || 0}`);
    console.log(`Categories remaining: ${categoryCount || 0}`);
    console.log(`Forum users remaining: ${userCount || 0}`);

    if (threadCount === 0 && postCount === 0 && categoryCount === 0 && userCount === 0) {
      console.log('\n✅ All data successfully cleared!');
    } else {
      console.log('\n⚠️  Some data remains in the database');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

clearAllData();
