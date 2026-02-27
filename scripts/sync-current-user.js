/**
 * This script ensures the currently logged-in user exists in forum_users table
 * Run this if bookmarks aren't working
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Need SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncUser() {
  console.log('Syncing auth users to forum_users table...\n');

  // Get all auth users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }

  console.log(`Found ${users.length} auth users\n`);

  for (const user of users) {
    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
    
    console.log(`Checking user: ${user.email} (${user.id})`);

    // Check if user exists in forum_users
    const { data: existing } = await supabase
      .from('forum_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) {
      console.log('  ✅ Already exists in forum_users\n');
      continue;
    }

    // Create forum_users record
    console.log('  ⚠️  Missing from forum_users, creating...');
    const { error: insertError } = await supabase
      .from('forum_users')
      .insert({
        id: user.id,
        username: username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        post_count: 0,
        reputation: 0,
        join_date: user.created_at,
        is_online: false,
        rank: 'Newcomer',
        role: 'member'
      });

    if (insertError) {
      console.error('  ❌ Error creating forum_users record:', insertError.message);
    } else {
      console.log('  ✅ Created forum_users record\n');
    }
  }

  console.log('Sync complete!');
}

syncUser();
