/**
 * Debug database connection and table structure
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Database Debug Information\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key (first 50 chars):', supabaseKey?.substring(0, 50) + '...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDatabase() {
  // Test 1: Check if we can connect
  console.log('Test 1: Testing connection...');
  const { data: healthCheck, error: healthError } = await supabase
    .from('categories')
    .select('count', { count: 'exact', head: true });
  
  if (healthError) {
    console.error('❌ Connection failed:', healthError.message);
    console.log('\n🔧 Possible issues:');
    console.log('1. Table does not exist');
    console.log('2. RLS is blocking access');
    console.log('3. Wrong database credentials\n');
  } else {
    console.log('✅ Connection successful\n');
  }

  // Test 2: Try to select from categories
  console.log('Test 2: Fetching categories...');
  const { data: categories, error: selectError } = await supabase
    .from('categories')
    .select('*');
  
  if (selectError) {
    console.error('❌ Select failed:', selectError.message);
  } else {
    console.log(`✅ Found ${categories?.length || 0} categories`);
    if (categories && categories.length > 0) {
      console.table(categories);
    }
  }

  // Test 3: Check other tables
  console.log('\nTest 3: Checking other tables...');
  const tables = ['forum_users', 'threads', 'posts'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: accessible`);
    }
  }

  // Test 4: Try a simple insert to see the exact error
  console.log('\nTest 4: Testing insert (will likely fail due to RLS)...');
  const testCategory = {
    id: 'test-category-' + Date.now(),
    name: 'Test Category',
    description: 'Test',
    icon: 'MessageSquare',
    thread_count: 0,
    post_count: 0,
    last_activity: new Date().toISOString(),
    is_sticky: false,
    is_important: false,
    sort_order: 999,
    created_at: new Date().toISOString(),
  };

  const { data: insertData, error: insertError } = await supabase
    .from('categories')
    .insert(testCategory)
    .select();

  if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
    console.log('\n📋 This confirms RLS is blocking inserts.');
    console.log('You MUST run the SQL in Supabase Dashboard SQL Editor.\n');
  } else {
    console.log('✅ Insert succeeded!');
    console.log('Inserted:', insertData);
    
    // Clean up test category
    await supabase.from('categories').delete().eq('id', testCategory.id);
  }

  console.log('\n' + '='.repeat(80));
  console.log('📝 SOLUTION:');
  console.log('='.repeat(80));
  console.log('\nYou MUST run SQL directly in Supabase Dashboard:');
  console.log('1. Go to: https://app.supabase.com/project/qhcpdmerihcotfwelsnm/editor');
  console.log('2. Click: SQL Editor (left sidebar)');
  console.log('3. Click: New Query');
  console.log('4. Paste the content from: SETUP_CATEGORIES.sql');
  console.log('5. Click: Run');
  console.log('\nDid you actually run the SQL? Check for any error messages in the SQL Editor.');
  console.log('='.repeat(80));
}

debugDatabase().catch(console.error);
