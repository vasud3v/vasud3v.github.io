/**
 * Force create categories by directly inserting them
 * This bypasses RLS by using raw SQL through the REST API
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

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  {
    id: 'announcements',
    name: '📢 Announcements',
    description: 'Official announcements, updates, and important news from the team',
    icon: 'Newspaper',
    thread_count: 0,
    post_count: 0,
    last_activity: new Date().toISOString(),
    is_sticky: true,
    is_important: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'rules-guidelines',
    name: '📋 Rules & Guidelines',
    description: 'Forum rules, community guidelines, and best practices',
    icon: 'Shield',
    thread_count: 0,
    post_count: 0,
    last_activity: new Date().toISOString(),
    is_sticky: true,
    is_important: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'getting-started',
    name: '🚀 Getting Started',
    description: 'New to the forum? Start here for introductions and helpful guides',
    icon: 'Rocket',
    thread_count: 0,
    post_count: 0,
    last_activity: new Date().toISOString(),
    is_sticky: true,
    is_important: false,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'general',
    name: 'General Discussion',
    description: 'Off-topic conversations, introductions, and community talk',
    icon: 'MessageSquare',
    thread_count: 0,
    post_count: 0,
    last_activity: new Date().toISOString(),
    is_sticky: false,
    is_important: false,
    sort_order: 100,
    created_at: new Date().toISOString(),
  },
  {
    id: 'tech-support',
    name: 'Technical Support',
    description: 'Get help with coding problems, debugging, and technical issues',
    icon: 'Wrench',
    thread_count: 0,
    post_count: 0,
    last_activity: new Date().toISOString(),
    is_sticky: false,
    is_important: false,
    sort_order: 101,
    created_at: new Date().toISOString(),
  },
];

async function forceCreateCategories() {
  console.log('🚀 Force creating categories...\n');

  // First check if table exists and is accessible
  console.log('🔍 Testing database connection...');
  const { data: testData, error: testError } = await supabase
    .from('categories')
    .select('count')
    .limit(1);

  if (testError) {
    console.error('❌ Cannot access categories table:', testError.message);
    console.log('\n⚠️  This might be a permissions issue.');
    console.log('📝 Please run this SQL in your Supabase Dashboard SQL Editor:\n');
    console.log('-- Grant permissions');
    console.log('GRANT ALL ON public.categories TO anon;');
    console.log('GRANT ALL ON public.categories TO authenticated;\n');
    return;
  }

  console.log('✅ Database connection OK\n');

  // Try to insert each category
  for (const category of categories) {
    console.log(`📝 Creating: ${category.name}`);

    // Try insert first
    const { data: insertData, error: insertError } = await supabase
      .from('categories')
      .insert(category)
      .select();

    if (insertError) {
      // If insert fails, try upsert
      console.log(`   ⚠️  Insert failed: ${insertError.message}`);
      console.log(`   🔄 Trying upsert...`);

      const { data: upsertData, error: upsertError } = await supabase
        .from('categories')
        .upsert(category, { onConflict: 'id' })
        .select();

      if (upsertError) {
        console.error(`   ❌ Upsert also failed: ${upsertError.message}`);
      } else {
        console.log(`   ✅ Upserted successfully`);
      }
    } else {
      console.log(`   ✅ Created successfully`);
    }
  }

  // Verify
  console.log('\n📊 Verifying categories...');
  const { data: allCategories, error: fetchError } = await supabase
    .from('categories')
    .select('id, name, is_sticky, is_important, sort_order')
    .order('is_sticky', { ascending: false })
    .order('sort_order');

  if (fetchError) {
    console.error('❌ Error fetching categories:', fetchError.message);
  } else if (!allCategories || allCategories.length === 0) {
    console.log('⚠️  No categories found after insert!');
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Check if RLS policies are blocking inserts');
    console.log('2. Run this in Supabase SQL Editor:\n');
    console.log('   ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;');
    console.log('   -- Then try this script again');
    console.log('   -- After success, re-enable with:');
    console.log('   ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;\n');
  } else {
    console.log(`\n✅ Found ${allCategories.length} categories:`);
    console.table(allCategories.map(c => ({
      id: c.id,
      name: c.name,
      sticky: c.is_sticky ? '📌' : '',
      important: c.is_important ? '⚠️' : '',
      sort: c.sort_order,
    })));
    console.log('\n🎉 Success! Refresh your forum to see the categories.');
  }
}

forceCreateCategories().catch(console.error);
