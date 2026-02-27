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

async function checkUser() {
  console.log('Checking current user...\n');

  // Get current auth user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log('❌ No authenticated user found');
    console.log('Please log in to the app first, then run this script again.');
    return;
  }

  console.log('✅ Auth User ID:', user.id);
  console.log('   Email:', user.email);
  console.log('');

  // Check if user exists in forum_users table
  const { data: forumUser, error: forumError } = await supabase
    .from('forum_users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (forumError) {
    console.error('❌ Error checking forum_users:', forumError);
    return;
  }

  if (!forumUser) {
    console.log('❌ User NOT found in forum_users table!');
    console.log('   This is the problem - bookmarks require a forum_users record.');
    console.log('');
    console.log('Solution: The user needs to be created in forum_users table.');
    console.log('This should happen automatically on signup, but may have failed.');
  } else {
    console.log('✅ User found in forum_users table:');
    console.log('   Username:', forumUser.username);
    console.log('   ID:', forumUser.id);
    console.log('   Post Count:', forumUser.post_count);
    console.log('');
    console.log('User exists in forum_users, so bookmarks should work.');
    console.log('Check browser console for actual error messages.');
  }
}

checkUser();
