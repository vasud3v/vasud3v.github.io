import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAuthUsers() {
  console.log('🔄 Syncing auth users to forum_users...\n');

  try {
    // Get current authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Error getting auth user:', authError);
      console.log('\n💡 Make sure you are logged in');
      return;
    }

    if (!authUser) {
      console.log('⚠️  No authenticated user found. Please log in first.');
      return;
    }

    console.log(`✅ Found authenticated user: ${authUser.email}`);
    console.log(`   User ID: ${authUser.id}\n`);

    // Check if forum_users record exists
    const { data: existingUser, error: checkError } = await supabase
      .from('forum_users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking forum_users:', checkError);
      return;
    }

    if (existingUser) {
      console.log('✅ Forum user record already exists');
      console.log(`   Username: ${existingUser.username}`);
      console.log(`   Reputation: ${existingUser.reputation}`);
      console.log(`   Posts: ${existingUser.post_count}`);
      return;
    }

    // Create forum_users record
    console.log('📝 Creating forum_users record...\n');
    
    const username = authUser.user_metadata?.username || 
                    authUser.email?.split('@')[0] || 
                    `user_${authUser.id.substring(0, 8)}`;

    const { data: newUser, error: insertError } = await supabase
      .from('forum_users')
      .insert({
        id: authUser.id,
        username: username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=1a1a1a`,
        post_count: 0,
        reputation: 0,
        is_online: true,
        rank: 'Newcomer',
        join_date: authUser.created_at
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating forum_users record:', insertError);
      return;
    }

    console.log('✅ Forum user record created successfully!');
    console.log(`   Username: ${newUser.username}`);
    console.log(`   Avatar: ${newUser.avatar}`);
    console.log(`   Rank: ${newUser.rank}`);

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

syncAuthUsers();
